'use client'

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import VideoLibraryTableBody from "@/app/(Auth)/video-library/component/VideoLibraryTableBody";
import VideoLibraryFormPopup, {VideoLibraryFormData} from "@/app/(Auth)/video-library/component/VideoLibraryFormPopup";
import {formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface TagItem {
    color: string;
    name: string;
}

export interface VideoLibraryRow {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    tags: TagItem[];
    content: string;
    videoUrl: string;
    duration: number | null; // 영상 길이(초)
    viewCount: number;
    published: boolean;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface VideoLibraryListResponse {
    content: VideoLibraryRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface Props {
    initialData: VideoLibraryListResponse;
}

export default function VideoLibraryPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<VideoLibraryRow[]>(initialData.content);
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

        const res = await callApi(`/api/admin/video-library/list?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== reqIdRef.current) return; // 더 최근 요청이 있으면 무시
        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as VideoLibraryListResponse;
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
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 영상을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/video-library/${id}`, {
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
        addPopup(<VideoLibraryFormPopup onSave={async (formData: VideoLibraryFormData) => {
            const res = await callApi(`/api/admin/video-library`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title.trim(),
                    thumbnailUrl: formData.thumbnailUrl || null,
                    tags: formData.tags,
                    content: formData.content,
                    videoUrl: formData.videoUrl.trim(),
                    duration: formData.duration ?? null,
                    published: formData.published,
                    pinned: formData.pinned,
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

    const handleEdit = (row: VideoLibraryRow) => {
        addPopup(<VideoLibraryFormPopup
            initialData={{
                id: row.id,
                title: row.title,
                thumbnailUrl: row.thumbnailUrl ?? '',
                tags: row.tags,
                content: row.content ?? '',
                videoUrl: row.videoUrl,
                duration: row.duration ?? null,
                published: row.published,
                pinned: row.pinned,
                createdAt: row.createdAt,
                viewCount: row.viewCount,
            }}
            onSave={async (formData: VideoLibraryFormData) => {
                const res = await callApi(`/api/admin/video-library/${row.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({
                        title: formData.title.trim(),
                        thumbnailUrl: formData.thumbnailUrl || null,
                        tags: formData.tags,
                        content: formData.content,
                        videoUrl: formData.videoUrl.trim(),
                        duration: formData.duration ?? null,
                        published: formData.published,
                        pinned: formData.pinned,
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
        const res = await callApi(`/api/admin/video-library/${id}/published?published=${next}`, {
            method: 'PUT',
            credentials: 'include',
        });
        if (res.result) {
            setData(prev => prev.map(row => row.id === id ? {...row, published: next} : row));
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '변경에 실패했습니다.'}/>);
        }
    };

    const handleTogglePinned = async (id: number, next: boolean) => {
        const res = await callApi(`/api/admin/video-library/${id}/pinned?pinned=${next}`, {
            method: 'PUT',
            credentials: 'include',
        });
        if (res.result) {
            // 상단 고정 변경은 목록 정렬(pinned 우선)에 영향을 주므로 재조회
            loadList();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '상단 고정 변경에 실패했습니다.'}/>);
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
                <h2>영상라이브러리</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/video-library'}>영상라이브러리</Link></li>
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
                <table className={'contact_table news_table'} style={{tableLayout: 'fixed', width: '100%'}}>
                    <colgroup>
                        <col style={{width: 70}}/>{/* 순번 */}
                        <col style={{width: 110}}/>{/* 상단고정 */}
                        <col />{/* 제목 (가변, 길면 말줄임) */}
                        <col style={{width: 140}}/>{/* 썸네일 */}
                        <col style={{width: 320}}/>{/* 영상링크 URL */}
                        <col style={{width: 100}}/>{/* 조회수 */}
                        <col style={{width: 180}}/>{/* 등록일시 */}
                        <col style={{width: 110}}/>{/* 게시 */}
                        <col style={{width: 120}}/>{/* 관리 */}
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>상단고정</th>
                        <th>제목</th>
                        <th>썸네일 이미지</th>
                        <th>영상링크 URL</th>
                        <th>조회수</th>
                        <th>등록일시</th>
                        <th>게시</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <VideoLibraryTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={displayedPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateTimeDot}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onTogglePublished={handleTogglePublished}
                        onTogglePinned={handleTogglePinned}
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
