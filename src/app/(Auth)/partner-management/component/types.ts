export type PartnerCategory = 'BASE' | 'POC';

export interface PartnerRow {
    id: number;
    partnerKey: string;
    partnerName: string;
    startDate: string;
    endDate: string;
    creditAmount: number;
    maxMembers: number;
    usedCount: number;
    approvedCount: number;
    createdAt: string;
    logoUrl: string;
    requiresApproval: boolean;
    dashboardCode: string;
    favorite: boolean;
}

/** 화면 상태는 전부 URL 에 있다. 서버가 파싱해 클라이언트로 내려준다. */
export interface PartnerFilters {
    search: string;
    status: string;
    favoriteOnly: boolean;
    page: number;   // 0-based (URL 은 1-based)
    size: number;
}

export interface PartnerListData {
    rows: PartnerRow[];
    totalElements: number;
    totalPages: number;
}

export const DEFAULT_PAGE_SIZE = 15;

/**
 * 기본값은 URL 에 싣지 않는다.
 * 가입명단으로 들어갈 때 이 값을 그대로 넘겨, "목록으로" 가 진입 시점 검색조건으로 돌아오게 한다.
 */
export function buildPartnerQuery(f: PartnerFilters): string {
    const p = new URLSearchParams();
    if (f.search.trim()) p.set('search', f.search.trim());
    if (f.status) p.set('status', f.status);
    if (f.favoriteOnly) p.set('favoriteOnly', 'true');
    if (f.page > 0) p.set('page', String(f.page + 1));   // URL은 1-based(표시 페이지)
    if (f.size !== DEFAULT_PAGE_SIZE) p.set('size', String(f.size));
    return p.toString();
}
