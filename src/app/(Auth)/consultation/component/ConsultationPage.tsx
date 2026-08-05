'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import ConsultationTableBody from "@/app/(Auth)/consultation/component/ConsultationTableBody";
import callApi from "@/utill/apiRequest";
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

interface Props {
    initialData: ConsultationListResponse;
}

export default function ConsultationPage({initialData}: Props) {
    const [data, setData] = useState<ConsultationRow[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [statusFilter, setStatusFilter] = useState('');
    const [adConsentFilter, setAdConsentFilter] = useState(false);
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
        if (statusFilter) params.set('status', statusFilter);
        if (adConsentFilter) params.set('adConsent', 'true');

        const options: RequestInit = {
            method: 'GET',
            credentials: 'include',
        };
        const res = await callApi(`/api/admin/consultations?${params.toString()}`, options);
        if (res.result && res.data) {
            const body = res.data as ConsultationListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search, statusFilter, adConsentFilter]);

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
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    // pagination
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
                        <input type="checkbox" checked={adConsentFilter}
                               onChange={e => { setAdConsentFilter(e.target.checked); setCurrentPage(0); }}/>
                        <span>광고수신동의</span>
                    </label>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}>
                        <option value="">처리상태 전체</option>
                        <option value="PENDING">신청</option>
                        <option value="EXCLUDED">대상제외</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">완료</option>
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'회사명 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/></button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
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
                        onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span className={'admin_icon'}/></button>
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
