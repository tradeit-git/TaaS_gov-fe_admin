'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import NewsTableBody from "@/app/(Auth)/news/component/NewsTableBody";
import NewsFormPopup, {NewsFormData} from "@/app/(Auth)/news/component/NewsFormPopup";
import {formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export const STATUS_MAP: Record<string, string> = {
    'PUBLISHED': '게시',
    'DRAFT': '임시저장',
};

export const NEWS_CATEGORY_OPTIONS = [
    {value: '공지사항', label: '공지사항'},
    {value: '보도자료', label: '보도자료'},
    {value: '이벤트', label: '이벤트'},
];

export interface NewsRow {
    id: number;
    title: string;
    thumbnailUrl: string;
    sourceUrl: string;
    views: number;
    createdAt: string;
    updatedAt: string;
}

export interface NewsListResponse {
    content: NewsRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface Props {
    initialData: NewsListResponse;
}

export default function NewsPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<NewsRow[]>(initialData.content);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isPublishedFilter, setIsPublishedFilter] = useState('');
    const isInitial = useRef(true);

    const fetchList = useCallback(async () => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        // 목업: 실제 API 연동 시 이 자리에 호출 로직 추가
        setData(initialData.content);
        setTotalElements(initialData.totalElements);
        setTotalPages(Math.max(1, initialData.totalPages));
    }, [currentPage, itemsPerPage, search, categoryFilter, isPublishedFilter, initialData]);

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
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 보도자료를 삭제하시겠습니까?'} callback={async () => {
            // 목업: 실제 API 연동 시 삭제 호출 추가
            setData(prev => prev.filter(row => row.id !== id));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
        }}/>);
    };

    const handleRegister = () => {
        addPopup(<NewsFormPopup onSave={(formData: NewsFormData) => {
            // 목업: 실제 API 연동 시 등록 호출 추가
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            console.log('register', formData);
        }}/>);
    };

    const handleEdit = (row: NewsRow) => {
        addPopup(<NewsFormPopup
            initialData={{
                id: row.id,
                title: row.title,
                thumbnailUrl: row.thumbnailUrl,
                content: '',
                sourceUrl: row.sourceUrl,
                createdAt: row.createdAt,
                views: row.views,
            }}
            onSave={(formData: NewsFormData) => {
                // 목업: 실제 API 연동 시 수정 호출 추가
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
                console.log('edit', formData);
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
                <h2>보도자료</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/news'}>보도자료</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'제목 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                    <button type="button" className={'news_register_btn'} onClick={handleRegister}>
                        등록
                    </button>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'contact_table news_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>제목</th>
                        <th>썸네일 이미지</th>
                        <th>원문 URL</th>
                        <th>등록일시</th>
                        <th>조회수</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <NewsTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateTimeDot}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
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
