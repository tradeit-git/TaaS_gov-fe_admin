// app/layout.tsx
import React, {Suspense} from 'react';
import PopupSection from "@/components/PopupSection";
import '@/style/admin.scss'
import Loading from "@/components/Loading";

export default async function Layout({children}: { children: React.ReactNode }) {
    return (
        <html>
        <head>
            <meta charSet="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com"/>
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap"
                  rel="stylesheet"/>
            <link rel="stylesheet"
                  href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
            <title>TaaS - admin</title>
        </head>
        <body>
        {children}
        <Suspense fallback={<></>}>
            <PopupSection/>
        </Suspense>
        <Loading/>
        </body>
        </html>
    );
}

