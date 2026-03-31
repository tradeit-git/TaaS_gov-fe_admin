import {NextRequest, NextResponse} from "next/server";
import {ADMIN_LOGIN} from "@/lib/routes";
import {ApiResponseType} from "@/types/apiResponse";

/**
 * 토큰 유효성 체크
 * status 401, code "Refresh" -> 토큰 재발급되었으니 업데이트
 * @param request
 * @param response
 */
export default async function auth(request: NextRequest, response: NextResponse) {
    const url = request.nextUrl.pathname;
    const redirectToLogin = () => NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));

    const jwtKeys = {
        token: `${process.env.NEXT_PUBLIC_JWT_KEY}.token`,
        rfToken: `${process.env.NEXT_PUBLIC_JWT_KEY}.rf_token`
    }
    const token = request.cookies.get(jwtKeys.token);
    const rfToken = request.cookies.get(jwtKeys.rfToken);

    // 둘 다 없으면 로그인 페이지로 리디렉션
    if (!token && !rfToken) return url === ADMIN_LOGIN ? response : redirectToLogin();

    try {
        const options = {
            method: 'GET',
            headers : {
                'Cookie': `${jwtKeys.token}=${token?.value}; ${jwtKeys.rfToken}=${rfToken?.value}`, // 쿠키 헤더에 토큰 추가
            },
            credentials: 'include', // 쿠키 포함을 명시
            next: {revalidate: 0} // ISR/캐싱 비활성화 필요시
        } as RequestInit

        const apiRes = await fetch(`${process.env.NEXT_PUBLIC_FRONT_URL}/api/admin/auth`, options);

        // 성공이면 그대로 response 반환
        if (apiRes.status === 200) return response;

        const contentType = apiRes.headers.get("content-type") || "";
        const text = await apiRes.text();

        const apiJson: ApiResponseType | null = contentType.includes("application/json") && text ? JSON.parse(text) : null;

        if (apiRes.status === 401 && apiJson && apiJson.code === "Refresh" ){
            const newTokens = apiJson.data as Record<string, string>;
            for (const name in newTokens) {
                response.cookies.set(name, newTokens[name], {
                    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일
                    path: "/",
                });
            }
            return response;
        }

        // 그 외의 실패는 로그인 페이지로 리디렉션
        return url === ADMIN_LOGIN ? response : redirectToLogin();
    } catch (error) {
        console.error("auth error:", error);
        return url === ADMIN_LOGIN ? response : redirectToLogin();
    }
}