'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import PartnerCreateForm from "@/app/(Auth)/partner-management/component/PartnerCreateForm";
import PartnerTableBody from "@/app/(Auth)/partner-management/component/PartnerTableBody";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface PartnerRow {
    id: number;
    partnerKey: string;
    partnerName: string;
    startDate: string;
    endDate: string;
    creditAmount: number;
    usedCount: number;
    createdAt: string;
}

interface CoalitionApiRow {
    id: number;
    partnerName: string;
    partnerKey: string;
    bonusCredit: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    userCount: number;
    status: string;
}

interface CoalitionListResponse {
    content: CoalitionApiRow[];
    totalElements: number;
    totalPages: number;
}

const mapToPartnerRow = (row: CoalitionApiRow): PartnerRow => ({
    id: row.id,
    partnerKey: row.partnerKey,
    partnerName: row.partnerName,
    startDate: row.startDate,
    endDate: row.endDate,
    creditAmount: row.bonusCredit,
    usedCount: row.userCount,
    createdAt: row.createdAt,
});

export default function PartnerPage() {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<PartnerRow[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchList = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(currentPage + 1));
        params.set('size', String(itemsPerPage));
        if (statusFilter) params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await callApi(`/api/admin/coalition-keys/list?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res.result && res.data) {
            const body = res.data as CoalitionListResponse;
            setData(body.content.map(mapToPartnerRow));
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search, statusFilter]);

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

    const handleCreated = () => {
        fetchList();
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 제휴를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/coalition-keys/${id}`, {
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

    return (
        <div className={'admin_page partner_page'}>
            <div className={'page_start_box'}>
                <h2>협회제휴관리</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/partner-management'}>협회제휴관리</Link></li>
                </ul>
            </div>

            <PartnerCreateForm onCreated={handleCreated}/>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <select value={statusFilter} onChange={e => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(0);
                    }}>
                        <option value="">전체</option>
                        <option value="예정">예정</option>
                        <option value="진행">진행</option>
                        <option value="종료">종료</option>
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'}
                                                onClick={() => {
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
                <table className={'client_table partner_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '20%'}}/>
                        <col style={{width: '14%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '20%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '6%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th>상태</th>
                        <th>제휴명</th>
                        <th>제휴가입전용경로</th>
                        <th>보너스 크레딧</th>
                        <th>가입혜택기간</th>
                        <th>가입자수</th>
                        <th>등록일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <PartnerTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                {currentGroup > 1 &&
                    <button type="button" className={'btn_prev'}
                            onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span
                        className={'admin_icon'}/></button>}
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page - 1)}>{page}</button>
                ))}
                {groupEnd < totalPages &&
                    <button type="button" className={'btn_next'}
                            onClick={() => setCurrentPage(groupEnd)}><span
                        className={'admin_icon'}/></button>}
            </div>
        </div>
    );
}
