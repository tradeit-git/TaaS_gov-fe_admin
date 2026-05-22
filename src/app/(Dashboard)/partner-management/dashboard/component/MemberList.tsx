'use client'

import {useCallback, useEffect, useRef, useState} from "react";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {MembersResponse} from "@/app/(Dashboard)/partner-management/dashboard/types";

interface Props {
    partnerKey: string;
    initialData: MembersResponse;
}

const SIZE = 10;
const PAGE_GROUP = 10;

export default function MemberList({partnerKey, initialData}: Props) {
    const [rows, setRows] = useState(initialData.content);
    const [page, setPage] = useState(initialData.currentPage || 1); // 1-based
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const isInitial = useRef(true);

    const fetchMembers = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('size', String(SIZE));
        if (search.trim()) params.set('companyName', search.trim());

        const res = await callApi(
            `/api/admin/partner-keys/common/${encodeURIComponent(partnerKey)}/dashboard/members?${params.toString()}`,
            {method: 'GET', credentials: 'include'},
        );
        if (res.result && res.data) {
            const body = res.data as MembersResponse;
            setRows(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [partnerKey, page, search]);

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        fetchMembers();
    }, [fetchMembers]);

    // 검색 디바운스
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    const formatDeptPos = (dept: string, pos: string) => {
        const parts = [dept, pos].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    // 페이지 그룹 (10단위)
    const currentGroup = Math.ceil(page / PAGE_GROUP);
    const groupStart = (currentGroup - 1) * PAGE_GROUP + 1;
    const groupEnd = Math.min(currentGroup * PAGE_GROUP, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <section className={'table_card'}>
            <div className={'section_head'}>
                <h2>제휴 가입사 명단</h2>
                <div className={'search_input_wrap'}>
                    <span className={'partner_dashboard_icon'}/>
                    <input type="text" placeholder={'회사명 검색'}
                           value={searchInput}
                           onChange={e => setSearchInput(e.target.value)}/>
                </div>
            </div>
            <div className={'table_wrap'}>
                <table className={'dashboard_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '18%'}}/>
                        <col style={{width: '26%'}}/>
                        <col style={{width: '14%'}}/>
                        <col style={{width: '14%'}}/>
                        <col style={{width: '12%'}}/>
                        <col style={{width: '12%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>회사명</th>
                        <th>ID(E-mail)</th>
                        <th>이름</th>
                        <th>부서&직함</th>
                        <th>전화번호</th>
                        <th>회원가입일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{textAlign: 'center'}}>가입사가 없습니다.</td>
                        </tr>
                    ) : (
                        rows.map((m, i) => (
                            <tr key={m.id}>
                                <td>{totalElements - (page - 1) * SIZE - i}</td>
                                <td>{m.companyName || '-'}</td>
                                <td>{m.loginId}</td>
                                <td>{m.name}</td>
                                <td>{formatDeptPos(m.department, m.position)}</td>
                                <td>{m.contact || '-'}</td>
                                <td>{formatDateDot(m.createdAt)}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={'dashboard_pagination'}>
                    <button type="button" className={'btn_page_nav'} disabled={currentGroup <= 1}
                            onClick={() => setPage(groupStart - 1)}>‹
                    </button>
                    {pageNumbers.map(p => (
                        <button key={p} type="button"
                                className={`btn_page ${p === page ? 'on' : ''}`}
                                onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button type="button" className={'btn_page_nav'} disabled={groupEnd >= totalPages}
                            onClick={() => setPage(groupEnd + 1)}>›
                    </button>
                </div>
            )}
        </section>
    );
}
