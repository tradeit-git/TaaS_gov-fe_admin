'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import AccountCreateForm from "@/app/(Auth)/account/component/AccountCreateForm";
import AccountTableBody from "@/app/(Auth)/account/component/AccountTableBody";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface AccountRow {
    id: number;
    email: string;
    name: string;
    phone: string;
    company: string;
    department: string;
    position: string;
    credit: number;
    createdAt: string;
}

// 일반 users 리스트 응답 (account = users 통합 전제)
export interface AccountApiRow {
    id: number;
    loginId: string;
    email?: string | null;
    name: string;
    contact?: string | null;
    companyName?: string | null;
    department?: string | null;
    position?: string | null;
    creditBalance?: number | null;
    createdAt: string;
}

export interface AccountListResponse {
    content: AccountApiRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

const mapRow = (r: AccountApiRow): AccountRow => ({
    id: r.id,
    email: r.loginId || r.email || '',
    name: r.name,
    phone: r.contact ?? '',
    company: r.companyName ?? '',
    department: r.department ?? '',
    position: r.position ?? '',
    credit: r.creditBalance ?? 0,
    createdAt: r.createdAt,
});

interface Props {
    initialData: AccountListResponse;
}

export default function AccountPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<AccountRow[]>(initialData.content.map(mapRow));
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const isInitial = useRef(true);

    const loadList = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(currentPage));
        params.set('size', String(itemsPerPage));
        if (search.trim()) params.set('keyword', search.trim());

        const res = await callApi(`/api/admin/members/demo-users?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            const body = res.data as AccountListResponse;
            setData(body.content.map(mapRow));
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        loadList();
    }, [loadList]);

    // 검색 디바운스
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
        // TODO: 계정 생성 API 연동 후 동작. 현재 등록 폼은 목업
        setCurrentPage(0);
        loadList();
    };

    // 충전 = 크레딧 수동 지급 (유효기간 null = 무기한)
    const handleCharge = (id: number, amount: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={`${amount.toLocaleString()} 크레딧을 지급하시겠습니까?`} callback={async () => {
            const res = await callApi(`/api/admin/members/demo-users/${id}/credits/grant`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({amount, expireDate: null}),
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'지급되었습니다.'}/>);
                loadList();
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '지급에 실패했습니다.'}/>);
            }
        }}/>);
    };

    // 차감 = 관리자 수동 차감 (REVOKE/MANUAL)
    const handleDeduct = (id: number, amount: number) => {
        const target = data.find(row => row.id === id);
        if (target && amount > target.credit) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'보유 크레딧보다 많이 차감할 수 없습니다.'}/>);
            return;
        }
        addPopup(<AlertComponent alertType={'confirm'} infoContent={`${amount.toLocaleString()} 크레딧을 차감하시겠습니까?`} callback={async () => {
            const res = await callApi(`/api/admin/members/demo-users/${id}/credits/deduct`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({amount}),
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'차감되었습니다.'}/>);
                loadList();
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '차감에 실패했습니다.'}/>);
            }
        }}/>);
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 계정을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/demo-users/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                loadList();
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'admin_page partner_page account_page'}>
            <div className={'page_start_box'}>
                <h2>내부영업계정</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/account'}>내부영업계정</Link></li>
                </ul>
            </div>

            <AccountCreateForm onCreated={handleCreated}/>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'ID / 이름 / 회사 검색'}/>
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
                        <col style={{width: '15%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '22%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '10%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th>ID(e-mail)</th>
                        <th>이름</th>
                        <th>전화번호</th>
                        <th>회사명</th>
                        <th>부서</th>
                        <th>직함</th>
                        <th>크레딧 관리</th>
                        <th>계정생성일</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <AccountTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onCharge={handleCharge}
                        onDeduct={handleDeduct}
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
