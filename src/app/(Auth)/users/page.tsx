import {Suspense} from "react";
import CompanyManagementPage, {CompanyFilters, CompanyListResponse} from "@/app/(Auth)/users/component/CompanyManagementPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const options = await getServerRequestOptions();

    // URL 쿼리를 파싱해 필터 구성 (클라로 같이 내려 초기 state 세팅에 사용)
    const filters: CompanyFilters = {
        planName: sp.planName ?? '',
        hasPlan: sp.hasPlan ?? '',
        keyword: sp.keyword ?? '',
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        size: Number(sp.size ?? '10') || 10,
    };

    // URL 쿼리(필터) 기준으로 초기 데이터 SSR fetch (상세→뒤로가기 시 그 상태로 렌더)
    const params = new URLSearchParams();
    params.set('page', String(filters.page));   // API는 0-based
    params.set('size', String(filters.size));
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.planName) params.set('planName', filters.planName);
    if (filters.hasPlan) params.set('hasPlan', filters.hasPlan);

    let initialData: CompanyListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };
    let planNames: string[] = [];
    try {
        const [res, pnRes] = await Promise.all([
            callApi(`/api/admin/members/users?${params.toString()}`, options),
            callApi(`/api/admin/members/users/plan-names`, options),
        ]);
        if (res.result && res.data) {
            initialData = res.data as CompanyListResponse;
        }
        if (pnRes.result && Array.isArray(pnRes.data)) {
            planNames = pnRes.data as string[];
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <Suspense>
            <CompanyManagementPage initialData={initialData} filters={filters} planNames={planNames} />
        </Suspense>
    );
}