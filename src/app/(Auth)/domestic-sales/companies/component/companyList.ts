import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {
    API_BASE,
    CompanyFilters,
    CompanyListData,
    CompanyListResponse,
    DEFAULT_PAGE_SIZE,
    PAGE_SIZE_OPTIONS,
    decodeMulti,
    encodeMulti,
} from "@/app/(Auth)/domestic-sales/companies/types";

/**
 * 관리기업 목록의 서버 로더.
 * next/headers 를 쓰므로 서버 컴포넌트에서만 import 할 것.
 */

/** URL 쿼리 → 필터. URL 이 단일 진실이라 여기가 유일한 해석 지점이다 */
export function parseCompanyFilters(sp: Record<string, string | undefined>): CompanyFilters {
    return {
        keyword: sp.keyword ?? '',
        salesGrade: decodeMulti(sp.salesGrade),
        roundResult: decodeMulti(sp.roundResult),
        dormantOnly: sp.dormantOnly === 'true',
        linked: sp.linked ?? '',
        mineOnly: sp.mineOnly === 'true',
        sort: sp.sort ?? '',
        tagIds: (sp.tagIds ?? '').split(',').map(Number).filter(n => n > 0),
        page: Math.max(0, (Number(sp.page ?? '1') || 1) - 1),   // URL 1-based → 내부 0-based
        // 주소로 아무 숫자나 들어올 수 있다. 목록에 없는 값이면 기본으로 돌린다 —
        // 안 그러면 select 가 빈 칸이 되고 size=100000 같은 조회가 그대로 나간다
        size: PAGE_SIZE_OPTIONS.includes(Number(sp.size)) ? Number(sp.size) : DEFAULT_PAGE_SIZE,
    };
}

export async function loadCompanyList(filters: CompanyFilters): Promise<CompanyListData> {
    const params = new URLSearchParams();
    params.set('page', String(filters.page + 1));   // API 는 1-based
    params.set('size', String(filters.size));
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    const grade = encodeMulti(filters.salesGrade);
    if (grade) params.set('salesGrade', grade);
    const result = encodeMulti(filters.roundResult);
    if (result) params.set('roundResult', result);
    if (filters.dormantOnly) params.set('dormantOnly', 'true');
    if (filters.linked) params.set('linked', filters.linked);
    if (filters.mineOnly) params.set('mineOnly', 'true');
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.tagIds.length) params.set('tagIds', filters.tagIds.join(','));

    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`${API_BASE}/companies?${params.toString()}`, options);
        if (res.result && res.data) {
            const body = res.data as unknown as CompanyListResponse;
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
