import '@/style/contact.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ContactPage, {InquiryFilters, InquiryListResponse} from "@/app/(Auth)/contact/component/ContactPage";

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const options = await getServerRequestOptions();

    // URL 쿼리를 파싱해 필터 구성 (클라로 같이 내려 초기 state 세팅에 사용)
    const filters: InquiryFilters = {
        keyword: sp.keyword ?? '',
        type: sp.type ?? '',
        status: sp.status ?? '',
        isRead: sp.isRead ?? '',
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        size: Number(sp.size ?? '10') || 10,
    };

    // URL 쿼리(필터) 기준으로 초기 데이터 SSR fetch (상세→뒤로가기 시 그 상태로 렌더)
    const params = new URLSearchParams();
    params.set('page', String(filters.page));   // API는 0-based
    params.set('size', String(filters.size));
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.isRead) params.set('isRead', filters.isRead);

    let initialData: InquiryListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
        unreadCount: 0,
    };

    try {
        const res = await callApi(`/api/admin/inquiries?${params.toString()}`, options);
        if (res.result && res.data) {
            initialData = res.data as InquiryListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <ContactPage initialData={initialData} filters={filters}/>;
}
