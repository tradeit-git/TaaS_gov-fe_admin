'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import ContactTableBody from "@/app/(Auth)/contact/component/ContactTableBody";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export const STATUS_MAP: Record<string, string> = {
    'PENDING': '접수',
    'EXCLUDED': '대상제외',
    'IN_PROGRESS': '처리중',
    'COMPLETED': '완료',
};

export const INQUIRY_STATUS_OPTIONS = [
    {value: 'PENDING', label: '접수'},
    {value: 'EXCLUDED', label: '대상제외'},
    {value: 'IN_PROGRESS', label: '처리중'},
    {value: 'COMPLETED', label: '완료'},
];

export const TYPE_MAP: Record<string, string> = {
    'PARTNERSHIP': '도입문의',
    'CRM_1ON1': 'CRM문의',
};

export interface InquiryRow {
    id: number;
    inquiryType: string;
    title: string | null;
    companyName: string | null;
    name: string | null;
    department: string | null;
    position: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    content: string | null;
    ip: string | null;
    privacyAgreed: boolean;
    adminMemo: string | null;
    status: string;
    isRead: boolean;
    readAt: string | null;
    readByAdminId: number | null;
    userId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface InquiryListResponse {
    content: InquiryRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    unreadCount: number;
}

export interface InquiryFilters {
    keyword: string;
    type: string;
    status: string;
    isRead: string;
    page: number;   // 0-based (서버에서 1-based URL을 변환해 전달)
    size: number;
}

interface Props {
    initialData: InquiryListResponse;
    filters: InquiryFilters;
}

export default function ContactPage({initialData, filters}: Props) {
    const {addPopup} = usePopupStore();
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props에서 파생 (URL = 단일 진실)
    const data = initialData.content;
    const totalElements = initialData.totalElements;
    const totalPages = Math.max(1, initialData.totalPages);
    const currentPage = filters.page;       // 0-based
    const itemsPerPage = filters.size;

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.keyword);
    useEffect(() => {
        setSearchInput(filters.keyword);
    }, [filters.keyword]);

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<InquiryFilters>) => {
        const f = {...filters, ...next};
        const params = new URLSearchParams();
        if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
        if (f.type) params.set('type', f.type);
        if (f.status) params.set('status', f.status);
        if (f.isRead) params.set('isRead', f.isRead);
        if (f.page > 0) params.set('page', String(f.page + 1));   // URL은 1-based(표시 페이지)
        if (f.size !== 10) params.set('size', String(f.size));
        const qs = params.toString();
        router.replace(qs ? `/contact?${qs}` : '/contact');
    };

    // 검색 디바운스 → 네비게이션 (실제로 바뀐 경우만)
    useEffect(() => {
        if (searchInput === filters.keyword) return;
        const t = setTimeout(() => navigate({keyword: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 문의를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/inquiries/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                router.refresh();   // 현재 필터/페이지 그대로 서버에서 다시 렌더
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    // 10페이지 단위 그룹 (0-based → 1-based 표시)
    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>고객문의</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/contact'}>고객문의</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'고객사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => setSearchInput('')}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={filters.type} onChange={e => navigate({type: e.target.value, page: 0})}>
                        <option value="">유형 전체</option>
                        <option value="PARTNERSHIP">도입문의</option>
                        <option value="CRM_1ON1">CRM문의</option>
                    </select>
                    <select value={filters.status} onChange={e => navigate({status: e.target.value, page: 0})}>
                        <option value="">처리상태 전체</option>
                        <option value="PENDING">접수</option>
                        <option value="EXCLUDED">대상제외</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">완료</option>
                    </select>
                    <select value={filters.isRead} onChange={e => navigate({isRead: e.target.value, page: 0})}>
                        <option value="">열람여부 전체</option>
                        <option value="false">미열람</option>
                        <option value="true">열람</option>
                    </select>
                    <select value={itemsPerPage} onChange={e => navigate({size: Number(e.target.value), page: 0})}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'contact_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>유형</th>
                        <th>회사명</th>
                        <th>이름</th>
                        <th>부서</th>
                        <th>직급</th>
                        <th>전화번호</th>
                        <th>휴대전화</th>
                        <th>이메일</th>
                        <th>문의일</th>
                        <th>열람시간</th>
                        <th>처리상태</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <ContactTableBody
                        data={data}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        statusMap={STATUS_MAP}
                        typeMap={TYPE_MAP}
                        formatDate={formatDateDot}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => navigate({page: groupStart - pageGroupSize - 1})}><span className={'admin_icon'}/> </button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => navigate({page: page - 1})}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => navigate({page: groupEnd})}><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
