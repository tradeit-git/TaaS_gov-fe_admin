'use client';

import React, {useEffect, useState} from 'react';
import {useMediaQuery} from 'react-responsive';
import AppConfig from "@/app/(Auth)/components/AppConfig";
import Sidebar from "@/app/(Auth)/components/Sidebar";
import MobileHeader from "@/app/(Auth)/bm/salesflow/component/mobile/MobileHeader";
import {AdminType} from "@/types/auth/admin";
import {AppConfigType} from "@/types/common/appConfig";
import {usePathname} from "next/navigation";
import PageVisitLogger from "@/components/PageVisitLogger";

interface Props {
    children: React.ReactNode;
    auth: AdminType;
    appConfig: AppConfigType
}

export default function ResponsiveLayout({children, auth, appConfig}: Props) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const isDesktop = useMediaQuery({minWidth: 1025});

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // SSR 시에는 렌더 안 하고 클라이언트에서만 렌더
    const isTrackerPage = pathname.includes('tracker');

    return (
        <>
            <PageVisitLogger />
            <AppConfig auth={auth} appConfig={appConfig}/>
            {isDesktop ? (
                <>
                    <div className="section_wrap">
                        <Sidebar />
                        <section className={`right_box ${isTrackerPage ? 'tracker-active' : ''}`}>{children}</section>
                    </div>
                </>
            ) : (
                <>
                    <MobileHeader/>
                    <div className="mobile_section">{children}</div>
                </>
            )}
        </>
    );
}
