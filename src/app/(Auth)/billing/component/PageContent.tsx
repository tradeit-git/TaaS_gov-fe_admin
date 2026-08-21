'use client'

import React, {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import BillingTableBody, {PAYMENT_STATUS_LABEL, PaymentHistoryItem, PaymentStatus} from "@/app/(Auth)/billing/component/BillingTableBody";

export interface BillingListResponse {
    content: PaymentHistoryItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface BillingFilters {
    startDate: string;
    endDate: string;
    planNames: string[];
    status: string;
    page: number;   // 0-based (서버에서 1-based URL을 변환해 전달)
    size: number;
}

interface Props {
    initialData: BillingListResponse;
    filters: BillingFilters;
    planOptions: string[];   // 이용플랜 필터 옵션 (서버 /plan-names)
}

const STATUS_OPTIONS: PaymentStatus[] = ['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'];
const NAV_COUNT = 10;

export default function PageContent({initialData, filters, planOptions}: Props) {
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props에서 파생 (URL = 단일 진실)
    const items = initialData.content;
    const totalElements = initialData.totalElements;
    const totalPages = Math.max(1, initialData.totalPages);
    const currentPage = filters.page;   // 0-based

    // 검색 영역(결제일자/이용플랜)은 '검색' 버튼을 눌러야 반영되므로 로컬 state로 유지
    const [searchInput, setSearchInput] = useState({
        startDate: filters.startDate,
        endDate: filters.endDate,
        planNames: filters.planNames,
    });
    useEffect(() => {
        setSearchInput({startDate: filters.startDate, endDate: filters.endDate, planNames: filters.planNames});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.startDate, filters.endDate, filters.planNames.join(',')]);

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<BillingFilters>) => {
        const f = {...filters, ...next};
        const params = new URLSearchParams();
        if (f.startDate) params.set('startDate', f.startDate);
        if (f.endDate) params.set('endDate', f.endDate);
        if (f.planNames.length > 0) params.set('planNames', f.planNames.join(','));
        if (f.status) params.set('status', f.status);
        if (f.page > 0) params.set('page', String(f.page + 1));   // URL은 1-based(표시 페이지)
        if (f.size !== 10) params.set('size', String(f.size));
        const qs = params.toString();
        router.replace(qs ? `/billing?${qs}` : '/billing');
    };

    const handlePlanToggle = (plan: string) => {
        setSearchInput(prev => ({
            ...prev,
            planNames: prev.planNames.includes(plan)
                ? prev.planNames.filter(p => p !== plan)
                : [...prev.planNames, plan]
        }));
    };

    const handleSearch = () => {
        navigate({
            startDate: searchInput.startDate,
            endDate: searchInput.endDate,
            planNames: searchInput.planNames,
            page: 0,
        });
    };

    const handleReset = () => {
        router.replace('/billing');
    };

    // 10페이지 단위 그룹
    const displayPage = currentPage + 1;
    const groupStart = Math.floor(currentPage / NAV_COUNT) * NAV_COUNT + 1;
    const groupEnd = Math.min(groupStart + NAV_COUNT - 1, totalPages);
    const navigations = Array.from({length: Math.max(0, groupEnd - groupStart + 1)}, (_, i) => groupStart + i);

    return (
        <>
            <div className={'billing_search_section'}>
                <div className={'search_row'}>
                    <div className={'search_date'}>
                        <span className={'label'}>결제일자</span>
                        <div className={'date_inputs'}>
                            <input
                                type={'date'}
                                value={searchInput.startDate}
                                onChange={(e) => setSearchInput(prev => ({...prev, startDate: e.target.value}))}
                            />
                            <span className={'date_separator'}>~</span>
                            <input
                                type={'date'}
                                value={searchInput.endDate}
                                onChange={(e) => setSearchInput(prev => ({...prev, endDate: e.target.value}))}
                            />
                        </div>
                    </div>
                    {planOptions.length > 0 && (
                        <div className={'search_plan'}>
                            <span className={'label'}>이용플랜</span>
                            <div className={'plan_checks'}>
                                {planOptions.map(plan => (
                                    <label key={plan} className={'plan_check_item'}>
                                        <input
                                            type={'checkbox'}
                                            checked={searchInput.planNames.includes(plan)}
                                            onChange={() => handlePlanToggle(plan)}
                                        />
                                        <span>{plan}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={'search_btns'}>
                        <button type={'button'} className={'btn_search'} onClick={handleSearch}>검색</button>
                        <button type={'button'} className={'btn_reset'} onClick={handleReset}>초기화</button>
                    </div>
                </div>
            </div>

            <div className={'list_header'}>
                <p className={'result_count'}>
                    총 결제 수 : <b>{totalElements.toLocaleString()}</b> 건
                </p>
                <div className={'search_area'}>
                    <select
                        value={filters.status}
                        onChange={(e) => navigate({status: e.target.value, page: 0})}
                    >
                        <option value="">결제상태</option>
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
                        ))}
                    </select>
                    <select
                        value={filters.size}
                        onChange={(e) => navigate({size: Number(e.target.value), page: 0})}
                    >
                        <option value={10}>10개씩</option>
                        <option value={30}>30개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>결제일시</th>
                        <th>결제 ID</th>
                        <th>사용자 ID</th>
                        <th>회사명</th>
                        <th>사용자명</th>
                        <th>이용플랜</th>
                        <th>결제금액(부가세 포함)</th>
                        <th>결제수단</th>
                        <th>결제상태</th>
                        <th>청구서</th>
                    </tr>
                    </thead>
                    <BillingTableBody
                        items={items}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        size={filters.size}
                    />
                </table>
            </div>

            <div className={'pagination'}>
                <button
                    type={'button'}
                    className={'btn_prev'}
                    disabled={groupStart === 1}
                    onClick={() => navigate({page: groupStart - NAV_COUNT - 1})}
                >
                    <span className={'admin_icon'}/>
                </button>
                {navigations.map((num) => (
                    <button
                        key={num}
                        type={'button'}
                        className={`btn_page ${displayPage === num ? 'on' : ''}`}
                        onClick={() => navigate({page: num - 1})}
                    >
                        {num}
                    </button>
                ))}
                <button
                    type={'button'}
                    className={'btn_next'}
                    disabled={groupStart + NAV_COUNT > totalPages}
                    onClick={() => navigate({page: groupStart + NAV_COUNT - 1})}
                >
                    <span className={'admin_icon'}/>
                </button>
            </div>
        </>
    );
}
