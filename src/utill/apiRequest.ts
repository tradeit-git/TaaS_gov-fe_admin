import {ApiResponseType} from "@/types/apiResponse";
import Cookies from "js-cookie";
import {APP_URL} from "@/lib/routes";
import {AUTH_COOKIE_PATH, COOKIE_KEYS} from "@/lib/cookies";

type ApiCallResult = {
    result: boolean,
    data: object | object[] | string | null;
    message: string,
    /** 서버 도메인 코드(i18n 키). 실패 원인을 문구가 아니라 코드로 분기할 때 쓴다. */
    code: string | null,
}

const MAX_RETRY_COUNT = 5;
const BASE_DELAY = 300; // ms

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseApi = (result: boolean, json: ApiResponseType | null): ApiCallResult => ({
    result,
    data: json?.data ?? null,
    message: json?.message ?? "",
    code: json?.code ?? null,
});

const fetchJson = async (url: string, option: RequestInit) => {
    const res = await fetch(url, option);
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    const json =
        contentType.includes("application/json") && text
            ? (JSON.parse(text) as ApiResponseType)
            : null;

    return { res, json };
};

const saveTokens = (tokens: Record<string, string>) => {
    Object.entries(tokens).forEach(([k, v]) => {
        Cookies.set(k, v, {
            expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            path: AUTH_COOKIE_PATH
        });
    });
};

const clearAuth = () => {
    const domain = process.env.NEXT_PUBLIC_SAME_SITE;
    [COOKIE_KEYS.AUTH_TOKEN, COOKIE_KEYS.AUTH_REFRESH_TOKEN].forEach(k => {
        Cookies.remove(k, { path: AUTH_COOKIE_PATH });
        Cookies.remove(k); // path=/ 로 심겼던 구형 쿠키
        if (domain) Cookies.remove(k, { path: "/", domain });
    });
};

export default async function callApi(
    url: string,
    option: RequestInit
): Promise<ApiCallResult> {

    const endPoint = `${APP_URL}${url}`;
    let refreshed = false;

    try {
        for (let attempt = 0; attempt < MAX_RETRY_COUNT; attempt++) {

            if (attempt > 0) {
                await sleep(BASE_DELAY * Math.pow(2, attempt - 1));
            }

            const { res, json } = await fetchJson(endPoint, option);

            /* ---------- SUCCESS ---------- */
            if (res.status === 200) {
                return parseApi(true, json);
            }

            /* ---------- TOKEN REFRESH ---------- */
            if (res.status === 401 && !refreshed) {
                try {
                    const rfToken = Cookies.get(COOKIE_KEYS.AUTH_REFRESH_TOKEN);

                    if (rfToken) {
                        const refreshRes = await fetchJson(`${APP_URL}/api/admin/auth/refresh`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ rfToken }),
                        });

                        if (refreshRes.res.status === 200 && refreshRes.json?.data) {
                            saveTokens(refreshRes.json.data as Record<string, string>);
                            refreshed = true;
                            continue;
                        }
                    }
                    clearAuth();
                    return parseApi(false, json);
                } catch {
                    clearAuth();
                    return parseApi(false, json);
                }
            }

            /* ---------- SERVER BUSY ---------- */
            if (res.status === 202 && json?.code === "RETRY_LATER") {
                continue;
            }

            /* ---------- REAL FAILURE ---------- */
            if (refreshed) {
                clearAuth();
            }

            return parseApi(false, json);
        }

        return {
            result: false,
            data: null,
            message: "The server is currently busy. Please try again later.",
            code: null,
        };

    } catch (e) {
        console.error("API ERROR:", e);
        return {
            result: false,
            data: null,
            message: "Server Error",
            code: null,
        };
    }
}
