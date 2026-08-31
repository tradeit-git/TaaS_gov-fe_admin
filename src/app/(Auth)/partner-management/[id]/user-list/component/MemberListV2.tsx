'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import * as XLSX from 'xlsx-js-style';
import callApi from "@/utill/apiRequest";
import {MembersResponse} from "@/app/(Auth)/partner-management/[id]/user-list/types";

type ApprovalStatus = 'REQUESTED' | 'APPROVED' | 'PENDING'; // 신청 / 승인 / 미승인
type ApprovalFilter = '' | ApprovalStatus;

const SIZE = 10;
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
}

export default function MemberListV2({partnerId, basePath}: Props) {
    const router = useRouter();
    const [rows, setRows] = useState<MembersResponse['content']>([]);
    const [page, setPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [requestedCount, setRequestedCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('');
    const [approvalEdits, setApprovalEdits] = useState<Record<number, ApprovalStatus>>({});

    const fetchMembers = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('size', String(SIZE));
        if (search.trim()) params.set('companyName', search.trim());
        if (approvalFilter) params.set('approvalStatus', approvalFilter);

        const res = await callApi(
            `/api/admin/partner-keys/${partnerId}/members?${params.toString()}`,
            {method: 'GET', credentials: 'include'},
        );
        if (res.result && res.data) {
            const body = res.data as unknown as MembersResponse;
            setRows(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
            setRequestedCount(body.requestedCount);
            setApprovedCount(body.approvedCount);
            setRejectedCount(body.rejectedCount);
            setApprovalEdits({});
        }
    }, [partnerId, page, search, approvalFilter]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    // 검색 디바운스
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
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
        fetchMembers();
    };

    // 다운로드: 현재 필터 기준 전체 명단을 받아 클라이언트에서 엑셀 생성
    const handleDownload = async () => {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('size', '100000');
        if (search.trim()) params.set('companyName', search.trim());
        if (approvalFilter) params.set('approvalStatus', approvalFilter);

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
                        신청 <b>{requestedCount}</b>
                    </span>
                    <span className={'v2_stat_item'}>
                        <span className={'content_icon approved_icon'}/>
                        승인 <b>{approvedCount}</b>
                    </span>
                    <span className={'v2_stat_item'}>
                        <span className={'content_icon unapproved_icon'}/>
                        미승인 <b>{rejectedCount}</b>
                    </span>
                </div>
                <div className={'v2_list_actions'}>
                    <select
                        className={'v2_filter_select'}
                        value={approvalFilter}
                        onChange={e => {
                            setApprovalFilter(e.target.value as ApprovalFilter);
                            setPage(1);
                        }}
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
                                <td className={'center'}>{totalElements - (page - 1) * SIZE - i}</td>
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
                    <button type="button" disabled={currentGroup <= 1} onClick={() => setPage(groupStart - 1)}>‹</button>
                    {pageNumbers.map(p => (
                        <button key={p} type="button" className={p === page ? 'on' : ''} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button type="button" disabled={groupEnd >= totalPages} onClick={() => setPage(groupEnd + 1)}>›</button>
                </div>
            )}
        </div>
    );
}
