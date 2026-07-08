'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import CompanyManagementTableBody from "@/app/(Auth)/users/component/CompanyManagementTableBody";
import {formatDateDot} from "@/utill/format";
import {CreditSummaryType} from "@/types/user/user";

export interface CompanyRow {
    id: number;
    companyName: string | null;
    loginId: string;
    name: string;
    department: string | null;
    position: string | null;
    paymentMethod: string | null;
    paymentMethodName: string | null;
    planMonths: number | null;
    planName: string | null;
    planSourceType: string | null;
    planStartDate: string | null;
    planEndDate: string | null;
    partnerName : string | null;
    creditSummary: CreditSummaryType | null;
    createdAt: string;
}

export interface CompanyListResponse {
    content: CompanyRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface CompanyFilters {
    planName: string;
    hasPlan: string;
    keyword: string;
    page: number;   // 0-based (서버에서 1-based URL을 변환해 전달)
    size: number;
}

interface Props {
    initialData: CompanyListResponse;
    filters: CompanyFilters;
    planNames: string[];   // 플랜명 필터 옵션 (서버 /plan-names)
}

export default function CompanyManagementPage({initialData, filters, planNames}: Props) {
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props에서 파생 (URL = 단일 진실)
    const data = initialData.content;
    const totalElements = initialData.totalElements;
    const totalPages = Math.max(1, initialData.totalPages);
    const currentPage = filters.page;       // 0-based
    const itemsPerPage = filters.size;
    const planFilter = filters.planName;
    const hasPlan = filters.hasPlan;

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.keyword);
    useEffect(() => {
        setSearchInput(filters.keyword);
    }, [filters.keyword]);

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<CompanyFilters>) => {
        const f = {planName: planFilter, hasPlan, keyword: filters.keyword, page: currentPage, size: itemsPerPage, ...next};
        const params = new URLSearchParams();
        if (f.planName) params.set('planName', f.planName);
        if (f.hasPlan) params.set('hasPlan', f.hasPlan);
        if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
        if (f.page > 0) params.set('page', String(f.page + 1));   // URL은 1-based(표시 페이지)
        if (f.size !== 10) params.set('size', String(f.size));
        const qs = params.toString();
        router.replace(qs ? `/users?${qs}` : '/users');
    };

    // 검색 디바운스 → 네비게이션 (실제로 바뀐 경우만)
    useEffect(() => {
        if (searchInput === filters.keyword) return;
        const t = setTimeout(() => navigate({keyword: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    // 10페이지 단위 그룹
    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>가입회원사</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/company-management'}>가입회원사</Link></li>
                </ul>
            </div>

            {/* 안내 배너 */}
            <div className={'info_banner'}>
                <span className={'info_icon'}>ⓘ</span>
                <p>이용현황은 현재 상태를 기준으로 관련 정보가 구성되며, 플랜 이용기간이 만료된 계정을 <strong>Free 상태로 변경</strong>됩니다. 플랜 이력은 계정별 상세 페이지에서
                    확인하세요.</p>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <select value={planFilter} onChange={e => navigate({planName: e.target.value, page: 0})}>
                        <option value="">플랜 전체</option>
                        {planNames.map(pn => <option key={pn} value={pn}>{pn}</option>)}
                    </select>
                    <select value={hasPlan} onChange={e => navigate({hasPlan: e.target.value, page: 0})}>
                        <option value="">구독여부 전체</option>
                        <option value="true">유효 구독 보유</option>
                        <option value="false">플랜 없음</option>
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => {
                            setSearchInput('');
                            navigate({keyword: '', page: 0});
                        }}><span className={'admin_icon'}/></button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => navigate({size: Number(e.target.value), page: 0})}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table company_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '6%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th rowSpan={2}>순번</th>
                        <th rowSpan={2}>회사명</th>
                        <th rowSpan={2}>ID(e-mail)</th>
                        <th rowSpan={2}>이름</th>
                        <th rowSpan={2}>부서&직함</th>
                        <th colSpan={2} style={{textAlign: 'center', borderBottom: '1px solid #EAEBED'}}>현재 이용현황</th>
                        <th colSpan={4} style={{textAlign: 'center', borderBottom: '1px solid #EAEBED', borderLeft: '1px solid #EAEBED'}}>현재 크레딧 현황</th>
                        <th rowSpan={2}>회원가입일</th>
                        <th rowSpan={2}>관리</th>
                        <th rowSpan={2}>기업전략분석</th>
                    </tr>
                    <tr>
                        <th>플랜</th>
                        <th>이용기간</th>
                        <th style={{borderLeft: "1px solid #EAEBED"}}>지급</th>
                        <th>사용</th>
                        <th>소멸</th>
                        <th style={{borderRight: "1px solid #EAEBED"}}>잔여</th>
                    </tr>
                    </thead>
                    <CompanyManagementTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => navigate({page: groupStart - pageGroupSize - 1})}><span className={'admin_icon'}/>
                </button>
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