import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {API_BASE} from "@/app/(Auth)/domestic-sales/companies/types";
import {
    MASTER_PAGE_SIZE,
    MasterFilters,
    MasterListData,
    MasterListResponse,
} from "@/app/(Auth)/domestic-sales/company-info/types";

/**
 * 기업정보조회의 서버 로더.
 * next/headers 를 쓰므로 서버 컴포넌트에서만 import 할 것.
 */

export function parseMasterFilters(sp: Record<string, string | undefined>): MasterFilters {
    return {
        keyword: sp.keyword ?? '',
        sidoId: Number(sp.sidoId ?? '0') || 0,
        sigunguId: Number(sp.sigunguId ?? '0') || 0,
        unmanagedOnly: sp.unmanagedOnly === 'true',
        tagIds: (sp.tagIds ?? '').split(',').map(Number).filter(n => n > 0),
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),
        size: Number(sp.size ?? String(MASTER_PAGE_SIZE)) || MASTER_PAGE_SIZE,
    };
}

export async function loadMasterList(filters: MasterFilters): Promise<MasterListData> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page + 1));
    params.set('size', String(filters.size));
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    if (filters.sidoId) params.set('sidoId', String(filters.sidoId));
    if (filters.sigunguId) params.set('sigunguId', String(filters.sigunguId));
    if (filters.unmanagedOnly) params.set('unmanagedOnly', 'true');
    if (filters.tagIds.length) params.set('tagIds', filters.tagIds.join(','));

    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`${API_BASE}/master-companies?${params.toString()}`, options);
        if (res.result && res.data) {
            const body = res.data as unknown as MasterListResponse;
            return {
                rows: body.content,
                totalElements: body.totalElements,
                totalPages: Math.max(1, body.totalPages),
            };
        }
    } catch (e) {
        console.error(e);
    }

    return {rows: [], totalElements: 0, totalPages: 1};
}
