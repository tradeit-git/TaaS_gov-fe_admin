/**
 * 기업 태그. 관리기업 목록 · 관리기업 상세 · 기업정보조회 세 화면이 같이 쓴다.
 * <p>
 * 태그가 붙는 대상은 기준 DB 기업(sales_customers)이다. 관리 대상이 아니라 —
 * 그래서 관리기업에서 뺐다 다시 담아도 태그는 그대로 남는다.
 * <p>
 * <b>여기에 서버 전용 코드를 두지 말 것.</b> 클라이언트 컴포넌트가 이 파일에서 타입을 가져가므로
 * next/headers 를 쓰는 것이 하나라도 섞이면 그게 클라이언트 번들로 딸려 들어가 빌드가 깨진다.
 * 서버에서 읽는 것은 tagLoader.ts 에 있다.
 */

/** 태그 한 개. companyCount 는 태그 목록 API 에서만 온다 */
export interface TagRow {
    tagId: number;
    name: string;
    companyCount?: number;
}

/**
 * 태그명 비교용 정규화 — 공백류 제거 + 소문자.
 * 서버의 SalesNameNormalizer.normalizeTag 와 같은 규칙이어야 한다.
 * 「수출 유망」을 다시 쳤을 때 이미 달린 「수출유망」과 같은 것으로 봐야 하기 때문이다.
 */
export function normalizeTag(raw: string): string {
    return raw.replace(/[\s　]/g, '').toLowerCase();
}

/** 태그명 최대 길이. 서버 SalesTagService.MAX_NAME_LENGTH 와 같아야 한다 */
export const TAG_MAX_LENGTH = 50;
