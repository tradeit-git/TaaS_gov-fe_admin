'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import ClientRegisterTableBody from "@/app/(Auth)/domestic-sales/client-register/component/ClientRegisterTableBody";
import ClientFormPopup from "@/app/(Auth)/domestic-sales/client-register/component/ClientFormPopup";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import callApi from "@/utill/apiRequest";

export interface ClientRow {
    id: number;
    name: string;
    bizNo: string | null;      // 일괄 적재된 기준 DB 행은 비어 있을 수 있다
    ceoName: string | null;
    sidoName: string | null;
    sigunguName: string | null;
    bizField: string | null;
    createdAt: string;
}

interface ClientListResponse {
    content: ClientRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export default function ClientRegisterPage() {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<ClientRow[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [displayedPage, setDisplayedPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const reqIdRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadList = useCallback(async () => {
        const myReqId = ++reqIdRef.current;
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(currentPage + 1));
        params.set('size', String(itemsPerPage));
        if (search.trim()) params.set('keyword', search.trim());

        const res = await callApi(`/api/admin/sales/customers?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== reqIdRef.current) return;
        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as ClientListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
            setDisplayedPage(Math.max(0, (body.currentPage ?? currentPage + 1) - 1));
        }
    }, [currentPage, itemsPerPage, search]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    // 검색 debounce
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const handleEdit = (row: ClientRow) => {
        addPopup(<ClientFormPopup
            initialData={{
                id: row.id,
                companyName: row.name,
                businessNumber: row.bizNo ?? '',
                ceoName: row.ceoName ?? '',
                sidoName: row.sidoName,
                sigunguName: row.sigunguName,
                businessField: row.bizField ?? '',
            }}
            onSuccess={() => {
                loadList();
            }}/>);
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 고객사를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/sales/customers/${id}`, {
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

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedExts = ['.xlsx', '.xls'];
        const lowerName = file.name.toLowerCase();
        const extOk = allowedExts.some(ext => lowerName.endsWith(ext));
        if (!extOk) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'}/>);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // TODO: API 연동 시 FormData로 파일 전송
        addPopup(<AlertComponent alertType={'alert'} infoContent={`"${file.name}" 파일이 선택되었습니다.\n(API 연동 후 업로드됩니다)`}/>);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(0);
    };

    // 페이지네이션
    const displayPage = displayedPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>고객사등록</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>국내고객사영업</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/domestic-sales/client-register'}>고객사등록</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>총 <strong>{totalElements.toLocaleString()}</strong>건</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/></button>}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display: 'none'}} onChange={handleExcelUpload}/>
                    <button type="button" className={'btn_excel_upload'} onClick={() => fileInputRef.current?.click()}>
                        엑셀업로드
                    </button>
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
                    <colgroup>
                        <col style={{width: 60}}/>
                        <col style={{width: 180}}/>
                        <col style={{width: 140}}/>
                        <col style={{width: 90}}/>
                        <col style={{width: 90}}/>
                        <col style={{width: 130}}/>
                        <col style={{width: 110}}/>
                        <col style={{width: 90}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>고객사</th>
                        <th>사업자번호</th>
                        <th>대표자</th>
                        <th>소재지역</th>
                        <th>사업분야</th>
                        <th>등록일</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <ClientRegisterTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={displayedPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
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
