'use client'
import ExcelDownloadButton from "@/app/(Auth)/user/components/ExcelDownloadButton";
import UserTableBody from "@/app/(Auth)/user/components/UserTableBody";
import React, {useEffect, useMemo, useState} from "react";
import "@/style/member_user.scss";
import {UserType} from "@/types/user/user";

type SortByOptionType = "no_desc" | "createdAt_asc" | "createdAt_desc" | "lastLoginAt_asc" | "lastLoginAt_desc" | "noLoginDays_asc" | "noLoginDays_desc";

type PageNationOptionType = {
    perPage: number;
    page: number;
}

export default function PageContent(props: {
    users: UserType[],
}) {

    const [users, setUsers] = useState<UserType[]>(props.users);
    const [searchText, setSearchText] = useState("");

    const [sortByOption, setSortByOption] = useState<SortByOptionType>("createdAt_desc");

    const [pageNationOption, setPageNationOption] = useState<PageNationOptionType>({
        page: 1,
        perPage: 15,
    });

    useEffect(() => {
        setUsers(props.users);
    }, [props.users]);

    const handleDelete = (id: number) => {
        if (!confirm("해당 회원을 삭제하시겠습니까?")) return;
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const filteredUsers = useMemo(() => {
        const keyword = searchText.toLowerCase();
        if (!keyword) return users;

        return users.filter(user =>
            (user.loginId ?? "").toLowerCase().includes(keyword) ||
            (user.email ?? "").toLowerCase().includes(keyword) ||
            (user.name ?? "").toLowerCase().includes(keyword) ||
            (user.companyName ?? "").toLowerCase().includes(keyword)
        );
    }, [users, searchText]);

    const maxPage = useMemo(() => {
        const {perPage} = pageNationOption;
        return Math.max(Math.floor(filteredUsers.length / perPage) + (filteredUsers.length % perPage === 0 ? 0 : 1), 1);
    }, [filteredUsers, pageNationOption])

    useEffect(() => {
        if(maxPage < pageNationOption.page) {
            setPageNationOption(prev => ({...prev, page: maxPage}));
        }
    }, [maxPage, pageNationOption.page]);

    const navigationCnt = 10;
    const navigations = useMemo(() => {
        const {page} = pageNationOption;
        const groupStart = Math.floor((page - 1) / navigationCnt) * navigationCnt + 1;
        const groupEnd = Math.min(groupStart + 9, maxPage);
        const result = [];
        for (let i = groupStart; i <= groupEnd; i++) {
            result.push(i);
        }
        return result;
    }, [maxPage, pageNationOption]);

    const getLoginTime = (user: UserType) => user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;

    const sortedUsers = useMemo(() => {
        if (sortByOption === "createdAt_asc") {
            return [...filteredUsers].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }
        if (sortByOption === "createdAt_desc") {
            return [...filteredUsers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (sortByOption === "lastLoginAt_asc") {
            return [...filteredUsers].sort((a, b) => getLoginTime(a) - getLoginTime(b));
        }
        if (sortByOption === "lastLoginAt_desc") {
            return [...filteredUsers].sort((a, b) => getLoginTime(b) - getLoginTime(a));
        }
        if (sortByOption === "noLoginDays_asc") {
            return [...filteredUsers].sort((a, b) => getLoginTime(b) - getLoginTime(a));
        }
        if (sortByOption === "noLoginDays_desc") {
            return [...filteredUsers].sort((a, b) => {
                if (!a.lastLoginAt && !b.lastLoginAt) return 0;
                if (!a.lastLoginAt) return 1;
                if (!b.lastLoginAt) return -1;
                return getLoginTime(a) - getLoginTime(b);
            });
        }
        return filteredUsers;
    }, [filteredUsers, sortByOption]);

    const pagedUsers = useMemo(() => {
        const { page, perPage } = pageNationOption;
        const start = (page - 1) * perPage;
        return sortedUsers.slice(start, start + perPage);
    }, [sortedUsers, pageNationOption]);

    return (
        <>
            <div className={'list_header'}>
                <p className={'result_count'}>
                    회원 수 : <b>{filteredUsers.length}</b> 명
                </p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input
                            type="text"
                            placeholder="회원 검색"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setPageNationOption(prev => ({...prev, page: 1}));
                            }}
                        />
                        {searchText && (
                            <button
                                type="button"
                                className={'btn_clear'}
                                onClick={() => {
                                    setSearchText('');
                                    setPageNationOption(prev => ({...prev, page: 1}));
                                }}
                            >
                                <span className={'admin_icon'}/>
                            </button>
                        )}
                    </div>
                    <ExcelDownloadButton users={users}/>
                    <select
                        value={pageNationOption.perPage}
                        onChange={(e) => setPageNationOption({
                            page: 1,
                            perPage: Number(e.target.value),
                        })}
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
                        <col width={'78px'}/>
                        <col width={'300px'}/>
                        <col width={'140px'}/>
                        <col width={'180px'}/>
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
                        <th rowSpan={2} className={'status'}>상태</th>
                        <th rowSpan={2} className={'id'}>이메일(ID)</th>
                        <th rowSpan={2} className={'name'}>이름</th>
                        <th rowSpan={2} className={'company'}>회사명</th>
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
                        pagedUsers={pagedUsers}
                        totalCount={filteredUsers.length}
                        currentPage={pageNationOption.page}
                        perPage={pageNationOption.perPage}
                        onDelete={handleDelete}
                    />
                </table>
            </div>
            <div className={'pagination'}>
                <button
                    type="button"
                    className={'btn_prev'}
                    disabled={pageNationOption.page - navigationCnt < 1}
                    onClick={() => {
                        const {page} = pageNationOption;
                        if ((page - 1) - navigationCnt < 0) return;
                        const movePage = (Math.floor(((page - 1) - navigationCnt) / navigationCnt) + 1) * navigationCnt;
                        setPageNationOption({...pageNationOption, page: movePage});
                    }}
                >
                    <span className={'admin_icon'}/>
                </button>
                {navigations.map((item) => (
                    <button
                        key={item}
                        type="button"
                        className={`btn_page ${pageNationOption.page === item ? 'on' : ''}`}
                        onClick={() => {
                            if (item <= maxPage) setPageNationOption({...pageNationOption, page: item});
                        }}
                    >
                        {item}
                    </button>
                ))}
                <button
                    type="button"
                    className={'btn_next'}
                    disabled={(Math.floor((pageNationOption.page - 1) / navigationCnt) + 1) * navigationCnt + 1 > maxPage}
                    onClick={() => {
                        const {page} = pageNationOption;
                        const movePage = (Math.floor((page - 1) / navigationCnt) + 1) * navigationCnt + 1;
                        if (movePage > maxPage) return;
                        setPageNationOption({...pageNationOption, page: movePage});
                    }}
                >
                    <span className={'admin_icon'}/>
                </button>
            </div>
        </>
    )
}