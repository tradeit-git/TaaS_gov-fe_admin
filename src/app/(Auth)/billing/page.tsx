import React, {Suspense} from "react";
import Link from "next/link";
import PageContent, {BillingFilters, BillingListResponse} from "@/app/(Auth)/billing/component/PageContent";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import '@/style/billing.scss';

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const options = await getServerRequestOptions();

    // URL 쿼리를 파싱해 필터 구성 (클라로 같이 내려 초기 state 세팅에 사용)
    const filters: BillingFilters = {
        startDate: sp.startDate ?? '',
        endDate: sp.endDate ?? '',
        planNames: sp.planNames ? sp.planNames.split(',').filter(Boolean) : [],
        status: sp.status ?? '',
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        size: Number(sp.size ?? '10') || 10,
    };

    const params = new URLSearchParams();
    params.set('page', String(filters.page));   // API는 0-based
    params.set('size', String(filters.size));
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.status) params.set('status', filters.status);
    filters.planNames.forEach(p => params.append('planNames', p));

    let initialData: BillingListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };
    let planNames: string[] = [];
    try {
        const [res, pnRes] = await Promise.all([
            callApi(`/api/admin/payments?${params.toString()}`, options),
            callApi(`/api/admin/payments/plan-names`, options),
        ]);
        if (res.result && res.data) {
            initialData = res.data as BillingListResponse;
        }
        if (pnRes.result && Array.isArray(pnRes.data)) {
            planNames = pnRes.data as string[];
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>결제현황</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>결제&크레딧</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/billing'}>결제현황</Link></li>
                </ul>
            </div>
            <Suspense>
                <PageContent initialData={initialData} filters={filters} planOptions={planNames}/>
            </Suspense>
        </div>
    );
}
