import React from "react";
import Link from "next/link";
import PageContent from "@/app/(Auth)/billing/component/PageContent";
import '@/style/billing.scss';

export default async function Page() {
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>결제현황</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>결제&크레딧</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/billing'}>결제현황</Link></li>
                </ul>
            </div>
            <PageContent/>
        </div>
    );
}
