import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {
    DEFAULT_TAB_SIZE,
    MembersResponse,
    PartnerInfo,
    SORT_PARAM,
    SortKey,
    TmMemberResponse,
    UserListFilters,
    UserListTab,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

/**
 * 가입명단 / 기업별 활동현황 화면의 서버 로더.
 * partner-management 와 poc-management 가 같은 화면을 쓰므로 여기서 공유한다.
 * next/headers 를 쓰므로 서버 컴포넌트에서만 import 할 것.
 */

interface CoalitionDetailApiRow {
    id: number;
    partnerName: string;
    partnerKey: string;
    bonusCredit: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    requiresApproval?: boolean;
}

export function parseUserListFilters(sp: Record<string, string | undefined>): UserListFilters {
    const tab: UserListTab = sp.tab === 'activity' ? 'activity' : 'members';
    const sort = sp.sort && sp.sort in SORT_PARAM ? sp.sort as SortKey : 'latest';

    return {
        tab,
        q: sp.q ?? '',
        page: Math.max(1, Number(sp.page ?? '1') || 1),
        size: Number(sp.size ?? String(DEFAULT_TAB_SIZE)) || DEFAULT_TAB_SIZE,
        approval: sp.approval ?? '',
        sort,
        grade: sp.grade ?? '',
        timing: sp.timing ?? '',
        from: sp.from ?? '',
    };
}

export async function loadPartnerInfo(partnerId: string): Promise<PartnerInfo | null> {
    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`/api/admin/partner-keys/${partnerId}`, options);
        if (res.result && res.data) {
            const row = res.data as unknown as CoalitionDetailApiRow;
            return {
                partnerName: row.partnerName,
                partnerKey: row.partnerKey,
                creditAmount: row.bonusCredit,
                startDate: row.startDate,
                endDate: row.endDate,
                requiresApproval: row.requiresApproval ?? false,
            };
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

const EMPTY_MEMBERS: MembersResponse = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    currentPage: 1,
    requestedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    systemAccessDate: '',
};

export async function loadMembers(partnerId: string, filters: UserListFilters): Promise<MembersResponse> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('size', String(filters.size));
    if (filters.q.trim()) params.set('companyName', filters.q.trim());
    if (filters.approval) params.set('approvalStatus', filters.approval);

    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/members?${params.toString()}`, options);
        if (res.result && res.data) {
            return res.data as unknown as MembersResponse;
        }
    } catch (e) {
        console.error(e);
    }
    return EMPTY_MEMBERS;
}

const EMPTY_ACTIVITY: TmMemberResponse = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    currentPage: 1,
    statsStartDate: null,
    statsEndDate: null,
};

export async function loadActivity(partnerId: string, filters: UserListFilters): Promise<TmMemberResponse> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('size', String(filters.size));
    if (filters.q.trim()) params.set('companyName', filters.q.trim());
    const sortParam = SORT_PARAM[filters.sort];
    if (sortParam) {
        params.set('sort', sortParam);
        params.set('direction', 'desc'); // 활동량 많은 순
    }
    if (filters.grade) params.set('grade', filters.grade);
    if (filters.timing) params.set('adoptionTiming', filters.timing);

    try {
        // TM 값(등급/도입시기/접촉)이 섞여 나오므로 CRM 공개 API 가 아니라 어드민 전용 API 를 쓴다.
        const options = await getServerRequestOptions();
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-members?${params.toString()}`, options);
        if (res.result && res.data) {
            return res.data as unknown as TmMemberResponse;
        }
    } catch (e) {
        console.error(e);
    }
    return EMPTY_ACTIVITY;
}
