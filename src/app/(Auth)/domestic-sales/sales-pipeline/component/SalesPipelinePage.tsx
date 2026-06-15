'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import SalesPipelineTableBody from "@/app/(Auth)/domestic-sales/sales-pipeline/component/SalesPipelineTableBody";
import SalesPipelineFormPopup from "@/app/(Auth)/domestic-sales/sales-pipeline/component/SalesPipelineFormPopup";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import callApi from "@/utill/apiRequest";

export interface PipelineRow {
    id: number;
    customerId: number;
    customerName: string;
    bizNo: string;
    ceoName: string;
    salesGrade: string;
    salesType: string;
    salesManager: string;
    activityCount: number;
    createdAt: string;
}

interface PipelineListResponse {
    content: PipelineRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

const GRADE_OPTIONS = ['전체', 'POTENTIAL', 'LEAD', 'TARGET', 'CLIENT'] as const;

export const GRADE_LABELS: Record<string, string> = {
    POTENTIAL: '잠재',
    LEAD: '리드',
    TARGET: '타겟',
    CLIENT: '클라이언트',
};

export default function SalesPipelinePage() {
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<PipelineRow[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [gradeFilter, setGradeFilter] = useState('전체');
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
        if (gradeFilter !== '전체') params.set('salesGrade', gradeFilter);

        const res = await callApi(`/api/admin/sales/pipelines?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== reqIdRef.current) return;
        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as PipelineListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
            setDisplayedPage(Math.max(0, (body.currentPage ?? currentPage + 1) - 1));
        }
    }, [currentPage, itemsPerPage, search, gradeFilter]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const displayPage = displayedPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    const handleRegister = () => {
        addPopup(<SalesPipelineFormPopup onSuccess={() => {
            setCurrentPage(0);
            loadList();
        }}/>);
    };

    const handleManage = (row: PipelineRow) => {
        router.push(`/domestic-sales/sales-pipeline/${row.id}`);
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

    const handleGradeChange = (value: string) => {
        setGradeFilter(value);
        setCurrentPage(0);
    };

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>영업파이프라인</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>국내고객사영업</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/domestic-sales/sales-pipeline'}>영업파이프라인</Link></li>
                </ul>
            </div>

            <div className={'list_header'}>
                <p className={'result_count'}>총 <strong>{totalElements.toLocaleString()}</strong>건</p>
                <div className={'search_area'}>
                    <select value={gradeFilter} onChange={e => handleGradeChange(e.target.value)}>
                        {GRADE_OPTIONS.map(g => (
                            <option key={g} value={g}>{g === '전체' ? '영업등급 전체' : GRADE_LABELS[g]}</option>
                        ))}
                    </select>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/></button>}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display: 'none'}} onChange={handleExcelUpload}/>
                    <button type="button" className={'btn_excel_upload'} onClick={() => fileInputRef.current?.click()}>
                        엑셀업로드
                    </button>
                    <button type="button" className={'news_register_btn'} onClick={handleRegister}>
                        신규영업등록
                    </button>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'contact_table'}>
                    <colgroup>
                        <col style={{width: 50}}/>
                        <col style={{width: 70}}/>
                        <col style={{width: 150}}/>
                        <col style={{width: 80}}/>
                        <col style={{width: 120}}/>
                        <col style={{width: 70}}/>
                        <col style={{width: 80}}/>
                        <col style={{width: 80}}/>
                        <col style={{width: 100}}/>
                        <col style={{width: 80}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>영업등급</th>
                        <th>고객사</th>
                        <th>영업유형</th>
                        <th>사업자번호</th>
                        <th>대표자</th>
                        <th>영업활동수</th>
                        <th>영업담당자</th>
                        <th>등록일</th>
                        <th>영업관리</th>
                    </tr>
                    </thead>
                    <SalesPipelineTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={displayedPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onManage={handleManage}
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
