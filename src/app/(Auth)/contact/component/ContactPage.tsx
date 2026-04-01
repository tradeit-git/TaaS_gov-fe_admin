'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import ContactTableBody from "@/app/(Auth)/contact/component/ContactTableBody";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export const STATUS_MAP: Record<string, string> = {
    'PENDING': '접수',
    'IN_PROGRESS': '처리중',
    'COMPLETED': '완료',
};

export const INQUIRY_STATUS_OPTIONS = [
    {value: 'PENDING', label: '접수'},
    {value: 'IN_PROGRESS', label: '처리중'},
    {value: 'COMPLETED', label: '완료'},
];

export interface InquiryRow {
    id: number;
    companyName: string;
    name: string;
    department: string;
    position: string;
    phone: string | null;
    mobile: string;
    email: string;
    content: string;
    ip: string | null;
    privacyAgreed: boolean;
    adminMemo: string | null;
    status: string;
    isRead: boolean;
    readAt: string | null;
    readByAdminId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface InquiryListResponse {
    content: InquiryRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    unreadCount: number;
}

interface Props {
    initialData: InquiryListResponse;
}

export default function ContactPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<InquiryRow[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [statusFilter, setStatusFilter] = useState('');
    const [isReadFilter, setIsReadFilter] = useState('');
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
        if (isReadFilter !== '') params.set('isRead', isReadFilter);

        const options: RequestInit = {
            method: 'GET',
            credentials: 'include',
        };
        const res = await callApi(`/api/admin/inquiries?${params.toString()}`, options);
        if (res.result && res.data) {
            const body = res.data as InquiryListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search, statusFilter, isReadFilter]);

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

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 문의를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/inquiries/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                fetchList();
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    // 10페이지 단위 그룹 (0-based → 1-based 표시)
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
                <h2>도입문의</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/contact'}>도입문의</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}>
                        <option value="">처리상태 전체</option>
                        <option value="PENDING">접수</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">완료</option>
                    </select>
                    <select value={isReadFilter} onChange={e => { setIsReadFilter(e.target.value); setCurrentPage(0); }}>
                        <option value="">열람여부 전체</option>
                        <option value="false">미열람</option>
                        <option value="true">열람</option>
                    </select>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'contact_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>회사명</th>
                        <th>이름</th>
                        <th>부서</th>
                        <th>직급</th>
                        <th>전화번호</th>
                        <th>휴대전화</th>
                        <th>이메일</th>
                        <th>문의일</th>
                        <th>열람시간</th>
                        <th>처리상태</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <ContactTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        statusMap={STATUS_MAP}
                        formatDate={formatDateDot}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span className={'admin_icon'}/> </button>
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
