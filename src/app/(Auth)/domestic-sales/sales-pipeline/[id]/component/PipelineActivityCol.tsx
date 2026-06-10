'use client'

import {useCallback, useEffect, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import ActivityFormPopup from "./ActivityFormPopup";
import {formatDateDot} from "@/utill/format";
import callApi from "@/utill/apiRequest";

interface ActivityItem {
    id: number;
    content: string;
    bookMark: boolean;
    activityDate: string;
    createdAt: string;
}

interface ActivityListResponse {
    content: ActivityItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface Props {
    pipelineId: number;
    activityCount: number;
}

export default function PipelineActivityCol({pipelineId}: Props) {
    const {addPopup} = usePopupStore();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [bookmarkFilter, setBookmarkFilter] = useState<boolean | null>(null);

    const loadActivities = useCallback(async (page: number, reset: boolean) => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('size', '10');
        if (bookmarkFilter !== null) params.set('bookMark', String(bookmarkFilter));

        const res = await callApi(`/api/admin/sales/pipelines/${pipelineId}/activities?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as ActivityListResponse;
            setActivities(prev => reset ? body.content : [...prev, ...body.content]);
            setTotalElements(body.totalElements);
            setTotalPages(Math.max(1, body.totalPages));
            setCurrentPage(body.currentPage);
        }
    }, [pipelineId, bookmarkFilter]);

    useEffect(() => {
        loadActivities(1, true);
    }, [loadActivities]);

    const handleLoadMore = () => {
        loadActivities(currentPage + 1, false);
    };

    const handleFilterChange = () => {
        setBookmarkFilter(prev => prev === null ? true : null);
    };

    const handleAddActivity = () => {
        addPopup(<ActivityFormPopup pipelineId={pipelineId} onSuccess={() => {
            loadActivities(1, true);
        }}/>);
    };

    const handleToggleBookmark = async (item: ActivityItem) => {
        const newValue = !item.bookMark;
        setActivities(prev => prev.map(a => a.id === item.id ? {...a, bookMark: newValue} : a));
        const res = await callApi(`/api/admin/sales/pipelines/${pipelineId}/activities/${item.id}/bookmark`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({bookMark: newValue}),
        });
        if (!res.result) {
            setActivities(prev => prev.map(a => a.id === item.id ? {...a, bookMark: !newValue} : a));
        }
    };

    const handleEdit = (item: ActivityItem) => {
        addPopup(<ActivityFormPopup
            pipelineId={pipelineId}
            initialData={{
                id: item.id,
                content: item.content,
                activityDate: item.createdAt,
            }}
            onSuccess={() => {
                loadActivities(1, true);
            }}/>);
    };

    const handleDelete = (item: ActivityItem) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 영업활동을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/sales/pipelines/${pipelineId}/activities/${item.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                loadActivities(1, true);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'pipeline_activity_col'}>
            {/* 헤더 */}
            <div className={'pipeline_activity_head'}>
                <div className={'activity_total'}>총 <b>{totalElements}건</b></div>
                <button type="button" className={'activity_sort'}>
                    최신등록순
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <button type="button"
                        className={`activity_filter_btn ${bookmarkFilter === true ? 'active' : ''}`}
                        onClick={handleFilterChange}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    {bookmarkFilter === true ? '등록' : '전체'}
                </button>
            </div>

            {/* 등록 버튼 */}
            <div className={'pipeline_add_row'}>
                <button type="button" className={'btn_add_activity'} onClick={handleAddActivity}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    영업활동등록
                </button>
            </div>

            {/* 활동 목록 */}
            <div className={'pipeline_activity_list'}>
                {activities.length === 0 && !loading ? (
                    <div style={{padding: '40px 0', textAlign: 'center', color: '#999'}}>
                        등록된 영업활동이 없습니다.
                    </div>
                ) : (
                    activities.map((item, i) => (
                        <div key={item.id} className={'pipeline_activity_item'}>
                            <div className={'activity_meta'}>
                                <span>{String(i + 1).padStart(3, '0')} · {formatDateDot(item.activityDate ?? item.createdAt)}</span>
                                <button type="button"
                                        className={`activity_bookmark ${item.bookMark ? 'active' : ''}`}
                                        onClick={() => handleToggleBookmark(item)}>
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 2h12a2 2 0 0 1 2 2v18l-8-5-8 5V4a2 2 0 0 1 2-2z"/></svg>
                                </button>
                            </div>
                            <div className={'activity_body'}>{item.content}</div>
                            <div className={'activity_actions'}>
                                <button type="button" className={'btn_activity_edit'} onClick={() => handleEdit(item)}>수정</button>
                                <button type="button" className={'btn_activity_del'} onClick={() => handleDelete(item)}>삭제</button>
                            </div>
                        </div>
                    ))
                )}

                {currentPage < totalPages && (
                    <div className={'pipeline_load_more'}>
                        <button type="button" onClick={handleLoadMore} disabled={loading}>
                            {loading ? '로딩 중...' : '더보기'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
