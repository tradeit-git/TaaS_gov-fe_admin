'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import ConsultationTableBody from "@/app/(Auth)/consultation/component/ConsultationTableBody";
import {formatDateDot} from "@/utill/format";

export const STATUS_MAP: Record<string, string> = {
    'PENDING': '신청',
    'EXCLUDED': '대상제외',
    'IN_PROGRESS': '처리중',
    'COMPLETED': '완료',
};

export const CONSULTATION_STATUS_OPTIONS = [
    {value: 'PENDING', label: '신청'},
    {value: 'EXCLUDED', label: '대상제외'},
    {value: 'IN_PROGRESS', label: '처리중'},
    {value: 'COMPLETED', label: '완료'},
];

export const AD_CONSENT_MAP: Record<string, string> = {
    'true': '동의',
    'false': '미동의',
};

export interface ConsultationRow {
    id: number;
    companyName: string | null;
    name: string | null;
    department: string | null;
    position: string | null;
    phone: string | null;
    email: string | null;
    adConsent: boolean;
    content: string;
    adminMemo: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConsultationListResponse {
    content: ConsultationRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface ConsultationFilters {
    keyword: string;
    status: string;
    adConsent: boolean;
    page: number;   // 0-based (서버에서 1-based URL을 변환해 전달)
    size: number;
}

interface Props {
    initialData: ConsultationListResponse;
    filters: ConsultationFilters;
}

export default function ConsultationPage({initialData, filters}: Props) {
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props에서 파생 (URL = 단일 진실)
    const data = initialData.content;
    const totalElements = initialData.totalElements;
    const totalPages = Math.max(1, initialData.totalPages);
    const currentPage = filters.page;       // 0-based
    const itemsPerPage = filters.size;

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.keyword);
    useEffect(() => {
        setSearchInput(filters.keyword);
    }, [filters.keyword]);

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<ConsultationFilters>) => {
        const f = {...filters, ...next};
        const params = new URLSearchParams();
        if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
        if (f.status) params.set('status', f.status);
        if (f.adConsent) params.set('adConsent', 'true');
        if (f.page > 0) params.set('page', String(f.page + 1));   // URL은 1-based(표시 페이지)
        if (f.size !== 10) params.set('size', String(f.size));
        const qs = params.toString();
        router.replace(qs ? `/consultation?${qs}` : '/consultation');
    };

    // 검색 디바운스 → 네비게이션 (실제로 바뀐 경우만)
    useEffect(() => {
        if (searchInput === filters.keyword) return;
        const t = setTimeout(() => navigate({keyword: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    // pagination
    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상담신청</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/consultation'}>상담신청</Link></li>
                </ul>
            </div>

            <div className={'list_header'}>
                <p className={'result_count'}>{totalElements.toLocaleString()} <span>records founds</span></p>
                <div className={'search_area'}>
                    <label className={'checkbox_filter'}>
                        <input type="checkbox" checked={filters.adConsent}
                               onChange={e => navigate({adConsent: e.target.checked, page: 0})}/>
                        <span>광고수신동의</span>
                    </label>
                    <select value={filters.status} onChange={e => navigate({status: e.target.value, page: 0})}>
                        <option value="">처리상태 전체</option>
                        <option value="PENDING">신청</option>
                        <option value="EXCLUDED">대상제외</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">완료</option>
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'회사명 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => setSearchInput('')}><span className={'admin_icon'}/></button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => navigate({size: Number(e.target.value), page: 0})}>
                        <option value={10}>10개씩 보기</option>
                        <option value={20}>20개씩 보기</option>
                        <option value={50}>50개씩 보기</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'consultation_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>{/* 순번 */}
                        <col style={{width: '15%'}}/>{/* 회사명 */}
                        <col style={{width: '6%'}}/>{/* 성함 */}
                        <col style={{width: '9%'}}/>{/* 부서 */}
                        <col style={{width: '7%'}}/>{/* 직함 */}
                        <col style={{width: '11%'}}/>{/* 연락처 */}
                        <col style={{width: '19%'}}/>{/* 이메일 */}
                        <col style={{width: '7%'}}/>{/* 광고수신동의 */}
                        <col style={{width: '9%'}}/>{/* 신청일 */}
                        <col style={{width: '7%'}}/>{/* 처리상태 */}
                        <col style={{width: '6%'}}/>{/* 관리 */}
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th>회사명</th>
                        <th>성함</th>
                        <th>부서</th>
                        <th>직함</th>
                        <th>연락처</th>
                        <th>이메일</th>
                        <th>광고수신동의</th>
                        <th>신청일</th>
                        <th>처리상태</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <ConsultationTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        statusMap={STATUS_MAP}
                        formatDate={formatDateDot}
                    />
                </table>
            </div>

            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => navigate({page: groupStart - pageGroupSize - 1})}><span className={'admin_icon'}/></button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => navigate({page: page - 1})}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => navigate({page: groupEnd})}><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
