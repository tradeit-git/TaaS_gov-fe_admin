'use client'
import ExcelDownloadButton from "@/app/(Auth)/user/components/ExcelDownloadButton";
import UserTableBody from "@/app/(Auth)/user/components/UserTableBody";
import React, {useCallback, useEffect, useRef, useState} from "react";
import "@/style/member_user.scss";
import {UserType} from "@/types/user/user";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface UserApiRow {
    id: number;
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "WITHDRAWN";
    statusUpdatedAt: string;
    loginId: string;
    userType: string;
    name: string;
    companyName: string;
    businessNumber: string;
    department: string;
    position: string;
    email: string;
    contact: string;
    createdAt: string;
    updatedAt: string | null;
    deletedAt: string | null;
    creditTotal: number;
    creditUsed: number;
    creditExpired: number;
    creditBalance: number;
    lastLoginAt: string | null;
}

export interface UserListResponse {
    content: UserApiRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

const mapToUserType = (row: UserApiRow): UserType => ({
    ...row,
    password: '',
    userFiles: [],
    creditSummary: {
        granted: row.creditTotal ?? 0,
        used: row.creditUsed ?? 0,
        expired: row.creditExpired ?? 0,
        balance: row.creditBalance ?? 0,
    },
});

type SortByOptionType = "createdAt_asc" | "createdAt_desc" | "lastLoginAt_asc" | "lastLoginAt_desc" | "noLoginDays_asc" | "noLoginDays_desc";

interface Props {
    initialData: UserListResponse;
}

export default function PageContent({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<UserType[]>(initialData.content.map(mapToUserType));
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [sortByOption, setSortByOption] = useState<SortByOptionType>("createdAt_desc");
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
            const body = res.data as UserListResponse;
            setData(body.content.map(mapToUserType));
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // 디바운스 검색
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
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 회원을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${id}`, {
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

    // 클라이언트 정렬
    const getLoginTime = (user: UserType) => user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;

    const sortedData = React.useMemo(() => {
        const arr = [...data];
        switch (sortByOption) {
            case "createdAt_asc":
                return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case "createdAt_desc":
                return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case "lastLoginAt_asc":
                return arr.sort((a, b) => getLoginTime(a) - getLoginTime(b));
            case "lastLoginAt_desc":
                return arr.sort((a, b) => getLoginTime(b) - getLoginTime(a));
            case "noLoginDays_asc":
                return arr.sort((a, b) => getLoginTime(b) - getLoginTime(a));
            case "noLoginDays_desc":
                return arr.sort((a, b) => {
                    if (!a.lastLoginAt && !b.lastLoginAt) return 0;
                    if (!a.lastLoginAt) return 1;
                    if (!b.lastLoginAt) return -1;
                    return getLoginTime(a) - getLoginTime(b);
                });
            default:
                return arr;
        }
    }, [data, sortByOption]);

    // 페이지네이션
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
        <>
            <div className={'list_header'}>
                <p className={'result_count'}>
                    회원 수 : <b>{totalElements}</b> 명
                </p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input
                            type="text"
                            placeholder="회원 검색"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button
                                type="button"
                                className={'btn_clear'}
                                onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}
                            >
                                <span className={'admin_icon'}/>
                            </button>
                        )}
                    </div>
                    <ExcelDownloadButton keyword={search}/>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                        <option value={15}>15개씩</option>
                        <option value={30}>30개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>
            <div className={'table_wrap'}>
                <table className={'client_table user_table'}>
                    <colgroup>
                        <col width={'58px'}/>
                        <col width={'300px'}/>
                        <col width={'140px'}/>
                        <col width={'140px'}/>
                        <col width={'180px'}/>
                        <col width={'130px'}/>
                        <col width={'110px'}/>
                        <col width={'110px'}/>
                        <col width={'110px'}/>
                        <col width={'110px'}/>
                        <col width={'110px'}/>
                        <col width={'114px'}/>
                        <col width={'114px'}/>
                        <col width={'120px'}/>
                        <col width={'80px'}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th rowSpan={2} className={'num'}>순번</th>
                        <th rowSpan={2} className={'id'}>이메일(ID)</th>
                        <th rowSpan={2} className={'name'}>이름</th>
                        <th rowSpan={2} className={'contact'}>전화번호</th>
                        <th rowSpan={2} className={'company'}>회사명</th>
                        <th rowSpan={2} className={'department'}>부서</th>
                        <th rowSpan={2} className={'position'}>직함</th>
                        <th colSpan={4} className={'credit'}>크레딧 사용현황</th>
                        <th rowSpan={2} className={'sign_in'}>
                            회원가입일
                            <span
                                className={`admin_icon icon_up ${sortByOption === "createdAt_asc" ? "on" : ""}`}
                                onClick={() => setSortByOption("createdAt_asc")}
                            />
                            <span
                                className={`admin_icon icon_down ${sortByOption === "createdAt_desc" ? "on" : ""}`}
                                onClick={() => setSortByOption("createdAt_desc")}
                            />
                        </th>
                        <th rowSpan={2} className={'sign_in'}>
                            최근접속일
                            <span
                                className={`admin_icon icon_up ${sortByOption === "lastLoginAt_asc" ? "on" : ""}`}
                                onClick={() => setSortByOption("lastLoginAt_asc")}
                            />
                            <span
                                className={`admin_icon icon_down ${sortByOption === "lastLoginAt_desc" ? "on" : ""}`}
                                onClick={() => setSortByOption("lastLoginAt_desc")}
                            />
                        </th>
                        <th rowSpan={2} className={'sign_in'}>
                            미접속 경과일
                            <span
                                className={`admin_icon icon_up ${sortByOption === "noLoginDays_asc" ? "on" : ""}`}
                                onClick={() => setSortByOption("noLoginDays_asc")}
                            />
                            <span
                                className={`admin_icon icon_down ${sortByOption === "noLoginDays_desc" ? "on" : ""}`}
                                onClick={() => setSortByOption("noLoginDays_desc")}
                            />
                        </th>
                        <th rowSpan={2} className={'sign_in'}>관리</th>
                    </tr>
                    <tr>
                        <th><span className={'credit_label total'}>전체</span></th>
                        <th><span className={'credit_label used'}>사용</span></th>
                        <th><span className={'credit_label remove'}>소멸</span></th>
                        <th className={'credit_last'}><span className={'credit_label remaining'}>잔여</span></th>
                    </tr>
                    </thead>
                    <UserTableBody
                        pagedUsers={sortedData}
                        totalCount={totalElements}
                        currentPage={currentPage + 1}
                        perPage={itemsPerPage}
                        onDelete={handleDelete}
                    />
                </table>
            </div>
            <div className={'pagination'}>
                <button
                    type="button"
                    className={'btn_prev'}
                    disabled={currentGroup <= 1}
                    onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}
                >
                    <span className={'admin_icon'}/>
                </button>
                {pageNumbers.map(page => (
                    <button
                        key={page}
                        type="button"
                        className={`btn_page ${page === displayPage ? 'on' : ''}`}
                        onClick={() => setCurrentPage(page - 1)}
                    >
                        {page}
                    </button>
                ))}
                <button
                    type="button"
                    className={'btn_next'}
                    disabled={groupEnd >= totalPages}
                    onClick={() => setCurrentPage(groupEnd)}
                >
                    <span className={'admin_icon'}/>
                </button>
            </div>
        </>
    );
}
