'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import CompanyManagementTableBody from "@/app/(Auth)/users/component/CompanyManagementTableBody";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";

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
    createdAt: string;
}

export interface CompanyListResponse {
    content: CompanyRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface Props {
    initialData: CompanyListResponse;
}

export default function CompanyManagementPage({initialData}: Props) {
    const [data, setData] = useState<CompanyRow[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [planFilter, setPlanFilter] = useState('');
    const isInitial = useRef(true);

    const fetchList = useCallback(async () => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }

        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('size', String(itemsPerPage));
        if (search.trim()) params.set('keyword', search.trim());

        const res = await callApi(`/api/admin/members/users?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            const body = res.data as CompanyListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 100);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    // 10페이지 단위 그룹
    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(0);
    };

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
                    <select value={planFilter} onChange={e => {
                        setPlanFilter(e.target.value);
                        setCurrentPage(0);
                    }}>
                        <option value="">전체</option>
                        <option value="FREE">Free</option>
                        <option value="PERSONAL">개인</option>
                        <option value="TEAM">팀</option>
                        <option value="ENTERPRISE">엔터프라이즈</option>
                        <option value="GLOBAL_SALES">해외영업실행</option>
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => {
                            setSearchInput('');
                            setSearch('');
                            setCurrentPage(0);
                        }}><span className={'admin_icon'}/></button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
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
                        <col style={{width: '10%'}}/>
                        <col style={{width: '12%'}}/>
                        <col style={{width: '13%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '13%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '5%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th rowSpan={2}>순번</th>
                        <th rowSpan={2}>회사명</th>
                        <th rowSpan={2}>ID(e-mail)</th>
                        <th rowSpan={2}>이름</th>
                        <th rowSpan={2}>부서&직함</th>
                        <th colSpan={3} style={{textAlign: 'center', borderBottom: '1px solid #EAEBED'}}>현재 이용현황</th>
                        <th rowSpan={2}>제휴가입</th>
                        <th rowSpan={2}>회원가입일</th>
                        <th rowSpan={2}>관리</th>
                    </tr>
                    <tr>
                        <th>플랜</th>
                        <th>결제방식</th>
                        <th style={{borderRight: "1px solid #EAEBED"}}>이용기간</th>
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
                        onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span className={'admin_icon'}/>
                </button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page - 1)}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => setCurrentPage(groupEnd)}><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}