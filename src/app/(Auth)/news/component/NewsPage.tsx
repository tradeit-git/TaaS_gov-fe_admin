'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import NewsTableBody from "@/app/(Auth)/news/component/NewsTableBody";
import NewsFormPopup, {NewsFormData} from "@/app/(Auth)/news/component/NewsFormPopup";
import {formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface NewsRow {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    content: string;
    sourceUrl: string;
    viewCount: number;
    published: boolean;
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
    const [currentPage, setCurrentPage] = useState(0); // 0-based UI / API는 1-based
    const [displayedPage, setDisplayedPage] = useState(Math.max(0, (initialData.currentPage ?? 1) - 1)); // 서버 응답 반영된 페이지
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [publishedFilter, setPublishedFilter] = useState<'' | 'true' | 'false'>('');
    const [loading, setLoading] = useState(false);
    const isInitial = useRef(true);
    const reqIdRef = useRef(0);

    const loadList = useCallback(async () => {
        const myReqId = ++reqIdRef.current;
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(currentPage + 1));
        params.set('size', String(itemsPerPage));
        if (search.trim()) params.set('search', search.trim());
        if (publishedFilter !== '') params.set('published', publishedFilter);

        const res = await callApi(`/api/admin/news/list?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== reqIdRef.current) return; // 더 최근 요청이 있으면 무시
        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as NewsListResponse;
            setData(body.content);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
            setDisplayedPage(Math.max(0, (body.currentPage ?? currentPage + 1) - 1));
        }
    }, [currentPage, itemsPerPage, search, publishedFilter]);

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
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 보도자료를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/news/${id}`, {
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

    const handleRegister = () => {
        addPopup(<NewsFormPopup onSave={async (formData: NewsFormData) => {
            const res = await callApi(`/api/admin/news`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title.trim(),
                    thumbnailUrl: formData.thumbnailUrl || null,
                    content: formData.content,
                    sourceUrl: formData.sourceUrl.trim(),
                    published: formData.published,
                }),
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

    const handleEdit = (row: NewsRow) => {
        addPopup(<NewsFormPopup
            initialData={{
                id: row.id,
                title: row.title,
                thumbnailUrl: row.thumbnailUrl ?? '',
                content: row.content ?? '',
                sourceUrl: row.sourceUrl,
                published: row.published,
                createdAt: row.createdAt,
                viewCount: row.viewCount,
            }}
            onSave={async (formData: NewsFormData) => {
                const res = await callApi(`/api/admin/news/${row.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({
                        title: formData.title.trim(),
                        thumbnailUrl: formData.thumbnailUrl || null,
                        content: formData.content,
                        sourceUrl: formData.sourceUrl.trim(),
                        published: formData.published,
                    }),
                });
                if (res.result) {
                    addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
                    loadList();
                    return true;
                } else {
                    addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '수정에 실패했습니다.'}/>);
                    return false;
                }
            }}/>);
    };

    const handleTogglePublished = async (id: number, next: boolean) => {
        const res = await callApi(`/api/admin/news/${id}/published?published=${next}`, {
            method: 'PUT',
            credentials: 'include',
        });
        if (res.result) {
            setData(prev => prev.map(row => row.id === id ? {...row, published: next} : row));
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '변경에 실패했습니다.'}/>);
        }
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
                    <select value={publishedFilter} onChange={e => { setPublishedFilter(e.target.value as '' | 'true' | 'false'); setCurrentPage(0); }}>
                        <option value="">전체</option>
                        <option value="true">게시</option>
                        <option value="false">게시중단</option>
                    </select>
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
                    <colgroup>
                        <col style={{width: 60}}/>
                        <col/>
                        <col style={{width: 120}}/>
                        <col/>
                        <col style={{width: 160}}/>
                        <col style={{width: 80}}/>
                        <col style={{width: 100}}/>
                        <col style={{width: 110}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>제목</th>
                        <th>썸네일 이미지</th>
                        <th>원문 URL</th>
                        <th>등록일시</th>
                        <th>조회수</th>
                        <th>게시</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <NewsTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={displayedPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateTimeDot}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onTogglePublished={handleTogglePublished}
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
