import { cookies, headers } from 'next/headers';
import { COOKIE_KEYS } from '@/lib/cookies';

/**
 * SSR 서버 컴포넌트에서 callApi 호출 시 사용할 공통 options 빌더.
 * - 쿠키 (인증 토큰)
 * - X-Forwarded-For (클라이언트 IP, 미들웨어에서 x-client-ip로 주입)
 */
export async function getServerRequestOptions(method: string = 'GET'): Promise<RequestInit> {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const token = cookieStore.get(COOKIE_KEYS.AUTH_TOKEN)?.value ?? '';
    const rfToken = cookieStore.get(COOKIE_KEYS.AUTH_REFRESH_TOKEN)?.value ?? '';
    const clientIp = headerStore.get('x-client-ip') ?? '';

    const reqHeaders: Record<string, string> = {
        'Cookie': `${COOKIE_KEYS.AUTH_TOKEN}=${token}; ${COOKIE_KEYS.AUTH_REFRESH_TOKEN}=${rfToken}`,
    };

    if (clientIp) {
        reqHeaders['X-Forwarded-For'] = clientIp;
    }

    return {
        method,
        headers: reqHeaders,
        credentials: 'include',
        next: { revalidate: 0 },
    };
}
