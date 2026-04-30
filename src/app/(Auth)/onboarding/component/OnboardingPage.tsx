'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OnboardingCreateForm from "@/app/(Auth)/onboarding/component/OnboardingCreateForm";
import OnboardingTableBody from "@/app/(Auth)/onboarding/component/OnboardingTableBody";

export interface HostAdmin {
    id: number;
    loginId: string;
    name: string;
    department: string;
    position: string;
    email: string;
    contact: string;
}

export interface OnboardingSession {
    id: number;
    sessionAt: string;
    className: string;
    url: string;
    hostAdmin: HostAdmin;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface OnboardingListResponse {
    content: OnboardingSession[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface OnboardingEditState {
    sessionAt: string;
    className: string;
    url: string;
    hostAdminId: number;
}

export const ONBOARDING_CLASSES = [
    "우리 제품의 실제 해외 바이어 찾기 '기본 실습'",
    "산업별 실제 해외 바이어 발굴 실습 '화장품, 뷰티'",
    "산업별 실제 해외 바이어 발굴 실습 '식품, K-Food'",
    "산업별 실제 해외 바이어 발굴 실습 '자동차부품'",
    "산업별 실제 해외 바이어 발굴 실습 '기계, 산업제'",
    "산업별 실제 해외 바이어 발굴 실습 '생활 소비재, 기타 소비재'",
] as const;

interface Props {
    initialData: OnboardingListResponse;
}

export default function OnboardingPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<OnboardingSession[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [hosts, setHosts] = useState<HostAdmin[]>([]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editRow, setEditRow] = useState<OnboardingEditState | null>(null);

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

        const res = await callApi(`/api/admin/onboarding-sessions?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            const body = res.data as OnboardingListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const fetchHosts = useCallback(async () => {
        const res = await callApi(`/api/admin/onboarding-sessions/hosts`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            setHosts(res.data as HostAdmin[]);
        }
    }, []);

    useEffect(() => {
        fetchHosts();
    }, [fetchHosts]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const handleCreated = () => {
        isInitial.current = false;
        setCurrentPage(0);
        setSearch('');
        setSearchInput('');
        fetchList();
    };

    const handleEdit = (row: OnboardingSession) => {
        setEditingId(row.id);
        setEditRow({
            sessionAt: row.sessionAt,
            className: row.className,
            url: row.url,
            hostAdminId: row.hostAdmin.id,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditRow(null);
    };

    const handleChange = (field: keyof OnboardingEditState, value: string | number) => {
        if (!editRow) return;
        setEditRow({...editRow, [field]: value} as OnboardingEditState);
    };

    const handleSave = async () => {
        if (!editRow || editingId === null) return;
        if (!editRow.sessionAt || !editRow.className || !editRow.url.trim() || !editRow.hostAdminId) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/onboarding-sessions/${editingId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                sessionAt: editRow.sessionAt,
                className: editRow.className,
                url: editRow.url.trim(),
                hostAdminId: editRow.hostAdminId,
            }),
        });

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            setEditingId(null);
            setEditRow(null);
            isInitial.current = false;
            fetchList();
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '수정에 실패했습니다.'}/>);
        }
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 온보딩을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/onboarding-sessions/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                isInitial.current = false;
                fetchList();
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

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
                <h2>웨비나 온보딩</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/onboarding'}>웨비나온보딩</Link></li>
                </ul>
            </div>

            <OnboardingCreateForm hosts={hosts} onCreated={handleCreated}/>

            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'진행자/URL 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'client_table onboarding_table'}>
                    <colgroup>
                        <col width={'60px'}/>
                        <col width={'120px'}/>
                        <col width={'150px'}/>
                        <col width={'540px'}/>
                        <col/>
                        <col width={'120px'}/>
                        <col width={'120px'}/>
                        <col width={'160px'}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>상태</th>
                        <th>일시</th>
                        <th>URL</th>
                        <th>클래스</th>
                        <th>진행자</th>
                        <th>생성일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <OnboardingTableBody
                        pageData={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        hosts={hosts}
                        editingId={editingId}
                        editRow={editRow}
                        onEdit={handleEdit}
                        onCancel={handleCancel}
                        onChange={handleChange}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

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
