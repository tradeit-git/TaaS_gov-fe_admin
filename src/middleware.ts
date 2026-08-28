import { NextRequest, NextResponse } from 'next/server';

const TOKEN_KEY = '_TaaS.auth.admin.token';
const RF_TOKEN_KEY = '_TaaS.auth.admin.rf_token';
// CRM 과 같은 호스트를 쓰므로 인증 쿠키를 admin basePath 로 한정한다
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/';

function hasAuthToken(request: NextRequest): boolean {
    return !!request.cookies.get(TOKEN_KEY)?.value;
}

function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // 만료 30초 전부터 갱신 시도
        return payload.exp * 1000 < Date.now() + 30_000;
    } catch {
        return true;
    }
}

async function refreshTokens(request: NextRequest): Promise<{ token: string; rfToken: string } | null> {
    const token = request.cookies.get(TOKEN_KEY)?.value;
    const rfToken = request.cookies.get(RF_TOKEN_KEY)?.value;

    if (!token || !rfToken) return null;
    if (!isTokenExpired(token)) return null;

    try {
        const baseUrl = process.env.NEXT_PUBLIC_FRONT_URL || request.nextUrl.origin;
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
        const clientIp = getClientIp(request);
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (clientIp) {
            headers['X-Forwarded-For'] = clientIp;
        }
        const res = await fetch(`${baseUrl}${basePath}/api/admin/auth/refresh`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ rfToken }),
        });

        if (res.status === 200) {
            const json = await res.json();
            if (json?.code === 'common.SUCCESS' && json?.data) {
                const tokens = json.data as Record<string, string>;
                return {
                    token: tokens[TOKEN_KEY],
                    rfToken: tokens[RF_TOKEN_KEY],
                };
            }
        }
    } catch {
        // 리프레시 실패해도 기존 흐름 유지
    }

    return null;
}

function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || '';
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // static 파일은 skip
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // 모든 요청에 클라이언트 IP 주입 (API 포함)
    const clientIp = getClientIp(request);
    const requestHeaders = new Headers(request.headers);
    if (clientIp) {
        requestHeaders.set('x-client-ip', clientIp);
        requestHeaders.set('x-forwarded-for', clientIp);
    }

    // API 요청은 IP 주입만 하고 리턴
    if (pathname.startsWith('/api')) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // 페이지 요청: 토큰 보유 시 만료됐으면 리프레시
    if (hasAuthToken(request)) {
        const freshTokens = await refreshTokens(request);

        if (freshTokens) {
            // 요청 헤더의 Cookie도 갱신 → SSR 서버 컴포넌트가 새 토큰을 읽음
            const existingCookies = request.headers.get('cookie') ?? '';
            const updatedCookies = existingCookies
                .split('; ')
                .filter(c => !c.startsWith(TOKEN_KEY + '=') && !c.startsWith(RF_TOKEN_KEY + '='))
                .concat(
                    `${TOKEN_KEY}=${freshTokens.token}`,
                    `${RF_TOKEN_KEY}=${freshTokens.rfToken}`,
                )
                .join('; ');
            requestHeaders.set('cookie', updatedCookies);

            const response = NextResponse.next({ request: { headers: requestHeaders } });

            // 브라우저 쿠키도 갱신
            const cookieOptions = { path: BASE_PATH, maxAge: 90 * 24 * 60 * 60 } as const;
            response.cookies.set(TOKEN_KEY, freshTokens.token, cookieOptions);
            response.cookies.set(RF_TOKEN_KEY, freshTokens.rfToken, cookieOptions);

            return response;
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
