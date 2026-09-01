import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {
    DEFAULT_PAGE_SIZE,
    PartnerCategory,
    PartnerFilters,
    PartnerListData,
    PartnerRow,
} from "@/app/(Auth)/partner-management/component/types";

/**
 * 협회제휴관리 / PoC 관리 목록의 서버 로더.
 * 두 페이지가 카테고리만 다르고 나머지는 같아 여기서 공유한다.
 * next/headers 를 쓰므로 서버 컴포넌트에서만 import 할 것.
 */

interface CoalitionApiRow {
    id: number;
    partnerName: string;
    partnerKey: string;
    bonusCredit: number;
    maxMembers: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    userCount: number;
    approvedCount?: number;
    status: string;
    logoUrl?: string;
    requiresApproval?: boolean;
    dashboardAccessCode?: string;
    favorite?: boolean;
}

interface CoalitionListResponse {
    content: CoalitionApiRow[];
    totalElements: number;
    totalPages: number;
}

const mapToPartnerRow = (row: CoalitionApiRow): PartnerRow => ({
    id: row.id,
    partnerKey: row.partnerKey,
    partnerName: row.partnerName,
    startDate: row.startDate,
    endDate: row.endDate,
    creditAmount: row.bonusCredit,
    maxMembers: row.maxMembers ?? 0,
    usedCount: row.userCount,
    approvedCount: row.approvedCount ?? 0,
    createdAt: row.createdAt,
    logoUrl: row.logoUrl ?? '',
    requiresApproval: row.requiresApproval ?? false,
    dashboardCode: row.dashboardAccessCode ?? '',
    favorite: row.favorite ?? false,
});

export function parsePartnerFilters(sp: Record<string, string | undefined>): PartnerFilters {
    return {
        search: sp.search ?? '',
        status: sp.status ?? '',
        favoriteOnly: sp.favoriteOnly === 'true',
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        size: Number(sp.size ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE,
    };
}

export async function loadPartnerList(filters: PartnerFilters, category?: PartnerCategory): Promise<PartnerListData> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page + 1));   // API 는 1-based
    params.set('size', String(filters.size));
    if (filters.status) params.set('status', filters.status);
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (category) params.set('category', category);
    if (filters.favoriteOnly) params.set('favoriteOnly', 'true');

    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`/api/admin/partner-keys/list?${params.toString()}`, options);
        if (res.result && res.data) {
            const body = res.data as unknown as CoalitionListResponse;
            return {
                rows: body.content.map(mapToPartnerRow),
                totalElements: body.totalElements,
                totalPages: Math.max(1, body.totalPages),
            };
        }
    } catch (e) {
        console.error(e);
    }

    return {rows: [], totalElements: 0, totalPages: 1};
}
