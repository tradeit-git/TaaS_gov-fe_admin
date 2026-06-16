'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import UserProjectManagementTableBody from "@/app/(Auth)/managed-users/component/UserProjectManagementTableBody";
import UserSelectPopup from "@/app/(Auth)/managed-users/component/UserSelectPopup";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface UserProjectRow {
    id: number;
    userType: string | null;     // 계정 타입
    companyName: string | null;
    loginId: string;
    name: string;
    department: string | null;
    position: string | null;
    planName: string | null;
    projectCount: number | null;
    partnerName: string | null;   // 협회제휴 명
    lastLoginAt: string | null;   // 최근 접속일
    managedAt: string | null;     // 관리 대상 등록일 (#1에만 포함)
    createdAt: string;            // 회원 가입일
}

export interface UserProjectListResponse {
    content: UserProjectRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface Props {
    initialData: UserProjectListResponse;
}

export default function UserProjectManagementPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<UserProjectRow[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [projectInput, setProjectInput] = useState('');
    const [projectName, setProjectName] = useState('');
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
        if (projectName.trim()) params.set('projectName', projectName.trim());

        const res = await callApi(`/api/admin/managed-users?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            const body = res.data as UserProjectListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search, projectName]);

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        loadList();
    }, [loadList]);

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

    const projectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (projectDebounceRef.current) clearTimeout(projectDebounceRef.current);
        projectDebounceRef.current = setTimeout(() => {
            setProjectName(projectInput);
            setCurrentPage(0);
        }, 100);
        return () => {
            if (projectDebounceRef.current) clearTimeout(projectDebounceRef.current);
        };
    }, [projectInput]);

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

    const handleRegister = () => {
        addPopup(<UserSelectPopup onSave={async ({userId}) => {
            const res = await callApi(`/api/admin/managed-users`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({userId}),
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
                setCurrentPage(0);
                loadList();
                return true;
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '등록에 실패했습니다.'}/>);
                return false;
            }
        }}/>);
    };

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>유저프로젝트관리</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/managed-users'}>유저프로젝트관리</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={projectInput} onChange={e => setProjectInput(e.target.value)}
                               placeholder={'프로젝트명 검색'}/>
                        {projectInput && <button type="button" className={'btn_clear'} onClick={() => {
                            setProjectInput('');
                            setProjectName('');
                            setCurrentPage(0);
                        }}><span className={'admin_icon'}/></button>}
                    </div>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'사용자 검색'}/>
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
                    <button type="button" className={'news_register_btn'} onClick={handleRegister}>사용자 등록</button>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <colgroup>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '12%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '13%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '5%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>회사명</th>
                        <th>계정 타입</th>
                        <th>ID</th>
                        <th>이름</th>
                        <th>부서&직함</th>
                        <th>플랜</th>
                        <th>등록 프로젝트 수</th>
                        <th>협회제휴 명</th>
                        <th>최근 접속일</th>
                        <th>등록일</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <UserProjectManagementTableBody
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
