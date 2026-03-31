'use client';

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { COOKIE_KEYS } from "@/lib/cookies";

function getTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_KEYS.AUTH_TOKEN}=`));
    return match ? match.split('=')[1] : null;
}

const STORAGE_KEY = '_TaaS.pageVisit.prevPath';
const DEBOUNCE_MS = 500;

export default function PageVisitLogger() {
    const pathname = usePathname();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            const referrer = sessionStorage.getItem(STORAGE_KEY);
            sessionStorage.setItem(STORAGE_KEY, pathname);

            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            fetch(`${basePath}/api/common/page-log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'ADMIN',
                    pageUrl: pathname,
                    token: getTokenFromCookie(),
                    referrer,
                }),
            }).catch(() => {});
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname]);

    return null;
}
