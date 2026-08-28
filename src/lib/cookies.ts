export const COOKIE_KEYS = {
    AUTH_TOKEN: "_TaaS.auth.admin.token",
    AUTH_REFRESH_TOKEN: "_TaaS.auth.admin.rf_token",
} as const;

/**
 * 인증 쿠키를 admin 앱 경로로 한정한다.
 *
 * admin 은 CRM 과 같은 호스트를 쓰고 basePath 만 다르다. path=/ 로 두면
 * 토큰 2개(약 1KB)가 CRM 의 모든 요청에도 실려가 요청 헤더를 부풀린다.
 * 페이지(/admin/*)도 API(/admin/api/* → next.config rewrite)도 모두
 * basePath 아래라 이 경로 하나로 admin 요청 전부를 덮는다.
 */
export const AUTH_COOKIE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/";
