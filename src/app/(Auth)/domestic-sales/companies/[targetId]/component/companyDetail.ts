import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {API_BASE, CompanyDetail, TimelineItem} from "@/app/(Auth)/domestic-sales/companies/types";

/**
 * 관리기업 상세의 서버 로더.
 * next/headers 를 쓰므로 서버 컴포넌트에서만 import 할 것.
 */

/** 통합 타임라인 필터. 빈 값이면 전체 */
export type TimelineFilter = '' | 'SALES' | 'TM';

export function parseTimelineFilter(value: string | undefined): TimelineFilter {
    return value === 'SALES' || value === 'TM' ? value : '';
}

export async function loadCompanyDetail(targetId: number): Promise<CompanyDetail | null> {
    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`${API_BASE}/companies/${targetId}`, options);
        if (res.result && res.data) return res.data as unknown as CompanyDetail;
    } catch (e) {
        console.error(e);
    }
    return null;
}

export async function loadTimeline(targetId: number, filter: TimelineFilter): Promise<TimelineItem[]> {
    try {
        const options = await getServerRequestOptions();
        const query = filter ? `?type=${filter}` : '';
        const res = await callApi(`${API_BASE}/companies/${targetId}/timeline${query}`, options);
        if (res.result && res.data) return res.data as unknown as TimelineItem[];
    } catch (e) {
        console.error(e);
    }
    return [];
}
