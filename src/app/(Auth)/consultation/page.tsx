import '@/style/contact.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ConsultationPage, {ConsultationFilters, ConsultationListResponse} from "@/app/(Auth)/consultation/component/ConsultationPage";

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const options = await getServerRequestOptions();

    // URL 쿼리를 파싱해 필터 구성 (클라로 같이 내려 초기 state 세팅에 사용)
    const filters: ConsultationFilters = {
        keyword: sp.keyword ?? '',
        status: sp.status ?? '',
        adConsent: sp.adConsent === 'true',
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        size: Number(sp.size ?? '10') || 10,
    };

    // URL 쿼리(필터) 기준으로 초기 데이터 SSR fetch (상세→뒤로가기 시 그 상태로 렌더)
    const params = new URLSearchParams();
    params.set('page', String(filters.page));   // API는 0-based
    params.set('size', String(filters.size));
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.status) params.set('status', filters.status);
    if (filters.adConsent) params.set('adConsent', 'true');

    let initialData: ConsultationListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    try {
        const res = await callApi(`/api/admin/consultations?${params.toString()}`, options);
        if (res.result && res.data) {
            initialData = res.data as ConsultationListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <ConsultationPage initialData={initialData} filters={filters}/>;
}
