import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";

// 기업정보조회 — 국내 기업정보 기준 DB 브라우징
// GET /api/admin/domestic-sales/master-companies

export const MASTER_PAGE_SIZE = 20;

export interface MasterCompanyRow {
    customerId: number;
    name: string;
    bizNo: string | null;
    ceoName: string | null;
    sidoName: string | null;
    sigunguName: string | null;
    bizField: string | null;
    createdAt: string;

    /** 관리 대상이면 그 pk. null 이면 아직 안 담은 기업이다 */
    targetId: number | null;
    targetStatus: string | null;

    tags: TagRow[];
}

export interface MasterListResponse {
    content: MasterCompanyRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface MasterListData {
    rows: MasterCompanyRow[];
    totalElements: number;
    totalPages: number;
}

/** URL 쿼리에서 읽어낸 필터. URL 이 단일 진실이다 */
export interface MasterFilters {
    keyword: string;
    /** 0 이면 전체 */
    sidoId: number;
    sigunguId: number;
    unmanagedOnly: boolean;
    /** 고른 태그 pk. AND 다 — 전부 가진 기업만 나온다. 빈 배열이면 태그 조건 없음 */
    tagIds: number[];
    /** 0-based. URL 은 1-based */
    page: number;
    size: number;
}

export function buildMasterQuery(f: MasterFilters): string {
    const params = new URLSearchParams();
    if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
    if (f.sidoId) params.set('sidoId', String(f.sidoId));
    if (f.sigunguId) params.set('sigunguId', String(f.sigunguId));
    if (f.unmanagedOnly) params.set('unmanagedOnly', 'true');
    if (f.tagIds.length) params.set('tagIds', f.tagIds.join(','));
    if (f.page > 0) params.set('page', String(f.page + 1));
    if (f.size !== MASTER_PAGE_SIZE) params.set('size', String(f.size));
    return params.toString();
}
