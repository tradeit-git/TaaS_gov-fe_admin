'use client'

import Link from "next/link";
import {useState} from "react";
import VideoLibraryTableBody from "@/app/(Auth)/video-library/component/VideoLibraryTableBody";
import VideoLibraryFormPopup, {VideoLibraryFormData} from "@/app/(Auth)/video-library/component/VideoLibraryFormPopup";
import {formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

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
    viewCount: number;
    published: boolean;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
}

const MOCK_DATA: VideoLibraryRow[] = [
    {
        id: 4,
        title: "트레이드잇, 실리콘밸리 '플러그앤플레이(Plug and Play)' 서밋 참가… 글로벌 무역 혁신 선도",
        thumbnailUrl: "https://placehold.co/90x60/e74c3c/ffffff?text=Video",
        tags: [{color: '#37B3F2', name: '서비스소개'}],
        content: "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가하여 글로벌 무역 혁신을 선도합니다.",
        videoUrl: "https://www.etoday.co.kr/news/view/2587723",
        viewCount: 0,
        published: true,
        pinned: true,
        createdAt: "2026-05-26T10:55:00",
        updatedAt: "2026-05-26T10:55:00",
    },
    {
        id: 3,
        title: "트레이드잇, 실리콘밸리 '플러그앤플레이(Plug and Play)' 서밋 참가… 글로벌 무역 혁신 선도",
        thumbnailUrl: "https://placehold.co/90x60/e74c3c/ffffff?text=Video",
        tags: [{color: '#8ABF28', name: '뉴스'}],
        content: "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가하여 글로벌 무역 혁신을 선도합니다.",
        videoUrl: "https://www.etoday.co.kr/news/view/2587723",
        viewCount: 0,
        published: false,
        pinned: false,
        createdAt: "2026-05-26T10:55:00",
        updatedAt: "2026-05-26T10:55:00",
    },
    {
        id: 2,
        title: "트레이드잇, 실리콘밸리 '플러그앤플레이(Plug and Play)' 서밋 참가… 글로벌 무역 혁신 선도",
        thumbnailUrl: "https://placehold.co/90x60/e74c3c/ffffff?text=Video",
        tags: [],
        content: "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가하여 글로벌 무역 혁신을 선도합니다.",
        videoUrl: "https://www.etoday.co.kr/news/view/2587723",
        viewCount: 0,
        published: true,
        pinned: false,
        createdAt: "2026-05-26T10:55:00",
        updatedAt: "2026-05-26T10:55:00",
    },
    {
        id: 1,
        title: "트레이드잇, 실리콘밸리 '플러그앤플레이(Plug and Play)' 서밋 참가… 글로벌 무역 혁신 선도",
        thumbnailUrl: "https://placehold.co/90x60/e74c3c/ffffff?text=Video",
        tags: [{color: '#FF7063', name: '이벤트'}, {color: '#AD70EE', name: '프로모션'}],
        content: "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가하여 글로벌 무역 혁신을 선도합니다.",
        videoUrl: "https://www.etoday.co.kr/news/view/2587723",
        viewCount: 0,
        published: true,
        pinned: false,
        createdAt: "2026-05-26T10:55:00",
        updatedAt: "2026-05-26T10:55:00",
    },
];

export default function VideoLibraryPage() {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<VideoLibraryRow[]>(MOCK_DATA);
    const [searchInput, setSearchInput] = useState('');

    const totalElements = data.length;

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 영상을 삭제하시겠습니까?'} callback={() => {
            setData(prev => prev.filter(row => row.id !== id));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
        }}/>);
    };

    const handleRegister = () => {
        addPopup(<VideoLibraryFormPopup onSave={async (formData: VideoLibraryFormData) => {
            const newId = Math.max(0, ...data.map(r => r.id)) + 1;
            const newRow: VideoLibraryRow = {
                id: newId,
                title: formData.title,
                thumbnailUrl: formData.thumbnailUrl || null,
                tags: formData.tags,
                content: formData.content,
                videoUrl: formData.videoUrl,
                viewCount: 0,
                published: formData.published,
                pinned: formData.pinned,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData(prev => [newRow, ...prev]);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            return true;
        }}/>);
    };

    const handleEdit = (row: VideoLibraryRow) => {
        addPopup(<VideoLibraryFormPopup
            initialData={{
                id: row.id,
                title: row.title,
                thumbnailUrl: row.thumbnailUrl ?? '',
                tags: row.tags,
                content: row.content,
                videoUrl: row.videoUrl,
                published: row.published,
                pinned: row.pinned,
                createdAt: row.createdAt,
                viewCount: row.viewCount,
            }}
            onSave={async (formData: VideoLibraryFormData) => {
                setData(prev => prev.map(r => r.id === row.id ? {
                    ...r,
                    title: formData.title,
                    thumbnailUrl: formData.thumbnailUrl || null,
                    tags: formData.tags,
                    content: formData.content,
                    videoUrl: formData.videoUrl,
                    published: formData.published,
                    pinned: formData.pinned,
                    updatedAt: new Date().toISOString(),
                } : r));
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
                return true;
            }}/>);
    };

    const handleTogglePublished = async (id: number, next: boolean) => {
        setData(prev => prev.map(row => row.id === id ? {...row, published: next} : row));
    };

    const handleTogglePinned = async (id: number, next: boolean) => {
        setData(prev => prev.map(row => row.id === id ? {...row, pinned: next} : row));
    };

    const filtered = searchInput.trim()
        ? data.filter(r => r.title.includes(searchInput.trim()))
        : data;

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
                <p className={'result_count'}>Showing {filtered.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'제목 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => setSearchInput('')}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select defaultValue="">
                        <option value="">전체</option>
                        <option value="true">게시</option>
                        <option value="false">게시중단</option>
                    </select>
                    <select defaultValue={10}>
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
                        <col style={{width: 80}}/>
                        <col/>
                        <col style={{width: 120}}/>
                        <col/>
                        <col style={{width: 80}}/>
                        <col style={{width: 160}}/>
                        <col style={{width: 100}}/>
                        <col style={{width: 110}}/>
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
                        data={filtered}
                        totalElements={filtered.length}
                        currentPage={0}
                        itemsPerPage={10}
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
                <button type="button" className={'btn_prev'} disabled><span className={'admin_icon'}/> </button>
                <button type="button" className={'btn_page on'}>1</button>
                <button type="button" className={'btn_next'} disabled><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
