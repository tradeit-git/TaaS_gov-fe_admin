'use client';

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import * as XLSX from 'xlsx-js-style';
import callApi from "@/utill/apiRequest";
import {
    MembersResponse,
    SIZE_OPTIONS,
    UserListFilters,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

type ApprovalStatus = 'REQUESTED' | 'APPROVED' | 'PENDING'; // 신청 / 승인 / 미승인

const PAGE_GROUP = 10;

const STATUS_LABEL: Record<ApprovalStatus, string> = {
    REQUESTED: '신청',
    APPROVED: '승인',
    PENDING: '미승인',
};

const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

interface Props {
    partnerId: string; // 제휴 PK
    basePath: string; // 상세보기 라우팅 베이스 (/partner-management | /poc-management)
    data: MembersResponse;
    filters: UserListFilters;
    navigate: (next: Partial<UserListFilters>) => void;
}

export default function MemberListV2({partnerId, basePath, data, filters, navigate}: Props) {
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props 에서 파생 (URL = 단일 진실)
    const rows = data.content;
    const totalElements = data.totalElements;
    const totalPages = Math.max(1, data.totalPages);
    const page = filters.page;
    const size = filters.size;

    const [approvalEdits, setApprovalEdits] = useState<Record<number, ApprovalStatus>>({});
    // 새 서버 데이터가 오면 편집 중이던 선택은 버린다.
    useEffect(() => {
        setApprovalEdits({});
    }, [data]);

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.q);
    useEffect(() => {
        setSearchInput(filters.q);
    }, [filters.q]);

    useEffect(() => {
        if (searchInput === filters.q) return;
        const t = setTimeout(() => navigate({q: searchInput, page: 1}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    const handleApprovalChange = (id: number, status: ApprovalStatus) => {
        setApprovalEdits(prev => ({...prev, [id]: status}));
    };

    const handleSave = async (id: number) => {
        const status = approvalEdits[id];
        if (!status) return;

        await callApi(
            `/api/admin/partner-keys/members/${id}/approval`,
            {method: 'PUT', credentials: 'include', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({approvalStatus: status})},
        );
        router.refresh();   // 현재 필터/페이지 그대로 서버에서 다시 렌더
    };

    // 다운로드: 현재 필터 기준 전체 명단을 받아 클라이언트에서 엑셀 생성
    const handleDownload = async () => {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('size', '100000');
        if (filters.q.trim()) params.set('companyName', filters.q.trim());
        if (filters.approval) params.set('approvalStatus', filters.approval);

        const res = await callApi(
            `/api/admin/partner-keys/${partnerId}/members?${params.toString()}`,
            {method: 'GET', credentials: 'include'},
        );
        if (!res.result || !res.data) return;
        const list = (res.data as unknown as MembersResponse).content;

        const header = ['순번', '회사명', '아이디(E-mail)', '이름', '사업자번호', '대표자명', '소속부서', '직함', '전화번호', '가입일자', '승인상태'];
        const aoa: (string | number)[][] = [
            header,
            ...list.map((m, i) => [
                list.length - i,
                m.companyName || '',
                m.loginId || '',
                m.name || '',
                m.businessNumber || '',
                m.ceoName || '',
                m.department || '',
                m.position || '',
                m.contact || '',
                formatDate(m.createdAt),
                STATUS_LABEL[m.approvalStatus] ?? '',
            ]),
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, '가입명단');
        XLSX.writeFile(wb, `members_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const currentGroup = Math.ceil(page / PAGE_GROUP);
    const groupStart = (currentGroup - 1) * PAGE_GROUP + 1;
    const groupEnd = Math.min(currentGroup * PAGE_GROUP, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <div className={'v2_member_list'}>
            {/* 상단 통계 + 필터 */}
            <div className={'v2_list_header'}>
                <div className={'v2_stats'}>
                    <span className={'v2_stat_item'}>
                        <span className={'content_icon pending_icon'}/>
                        신청 <b>{data.requestedCount}</b>
                    </span>
                    <span className={'v2_stat_item'}>
                        <span className={'content_icon approved_icon'}/>
                        승인 <b>{data.approvedCount}</b>
                    </span>
                    <span className={'v2_stat_item'}>
                        <span className={'content_icon unapproved_icon'}/>
                        미승인 <b>{data.rejectedCount}</b>
                    </span>
                </div>
                <div className={'v2_list_actions'}>
                    <select
                        className={'v2_filter_select'}
                        value={filters.approval}
                        onChange={e => navigate({approval: e.target.value, page: 1})}
                    >
                        <option value="">전체</option>
                        <option value="REQUESTED">신청</option>
                        <option value="APPROVED">승인</option>
                        <option value="PENDING">미승인</option>
                    </select>
                    <div className={'v2_search_wrap'}>
                        <svg className={'v2_search_icon'} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="#999" strokeWidth="1.5"/>
                            <line x1="10" y1="10" x2="13" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="회사명 검색"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>
                    <select className={'v2_filter_select'} value={size}
                            onChange={e => navigate({size: Number(e.target.value), page: 1})}>
                        {SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}개씩</option>)}
                    </select>
                    <button type="button" className={'v2_btn_download'} onClick={handleDownload}>
                        <span className={'content_icon'}/>
                        다운로드
                    </button>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'v2_table_wrap'}>
                <table className={'v2_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '13%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '8%'}}/>{/* 상세보기 */}
                    </colgroup>
                    <thead>
                    <tr>
                        <th className={'center'}>순번</th>
                        <th>회사명</th>
                        <th>아이디(E-mail)</th>
                        <th>이름</th>
                        <th>사업자번호</th>
                        <th>대표자명</th>
                        <th>소속부서</th>
                        <th>직함</th>
                        <th>전화번호</th>
                        <th>가입일자</th>
                        <th>가입승인</th>
                        <th className={'center'}>상세보기</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={12} className={'v2_empty_td'}>가입된 회원이 없습니다.</td>
                        </tr>
                    ) : rows.map((m, i) => {
                        const currentStatus = approvalEdits[m.id] ?? m.approvalStatus;
                        const hasEdit = m.id in approvalEdits && approvalEdits[m.id] !== m.approvalStatus;
                        return (
                            <tr key={m.id}>
                                <td className={'center'}>{totalElements - (page - 1) * size - i}</td>
                                <td title={m.companyName}>{m.companyName || '-'}</td>
                                <td title={m.loginId}>{m.loginId}</td>
                                <td>{m.name}</td>
                                <td>{m.businessNumber || '-'}</td>
                                <td>{m.ceoName || '-'}</td>
                                <td>{m.department || '-'}</td>
                                <td>{m.position || '-'}</td>
                                <td>{m.contact || '-'}</td>
                                <td>{formatDate(m.createdAt)}</td>
                                <td>
                                    <div className={'v2_approval_cell'}>
                                        <select
                                            className={`v2_approval_select ${currentStatus === 'APPROVED' ? 'approved' : 'pending'}`}
                                            value={currentStatus}
                                            onChange={e => handleApprovalChange(m.id, e.target.value as ApprovalStatus)}
                                        >
                                            {m.approvalStatus === 'REQUESTED' && (
                                                <option value="REQUESTED">신청</option>
                                            )}
                                            <option value="APPROVED">승인</option>
                                            <option value="PENDING">미승인</option>
                                        </select>
                                        <button
                                            type="button"
                                            className={`v2_btn_save ${hasEdit ? 'active' : ''}`}
                                            disabled={!hasEdit}
                                            onClick={() => handleSave(m.id)}
                                        >
                                            저장
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <button type="button" className={'v2_btn_view'}
                                            onClick={() => router.push(`${basePath}/${partnerId}/user-list/${m.id}`)}>
                                        보기
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className={'v2_pagination'}>
                    <button type="button" disabled={currentGroup <= 1} onClick={() => navigate({page: groupStart - 1})}>‹</button>
                    {pageNumbers.map(p => (
                        <button key={p} type="button" className={p === page ? 'on' : ''} onClick={() => navigate({page: p})}>{p}</button>
                    ))}
                    <button type="button" disabled={groupEnd >= totalPages} onClick={() => navigate({page: groupEnd + 1})}>›</button>
                </div>
            )}
        </div>
    );
}
