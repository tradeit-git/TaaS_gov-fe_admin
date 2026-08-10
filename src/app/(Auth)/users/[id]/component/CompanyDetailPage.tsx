'use client';

import Link from "next/link";
import {UserType} from "@/types/user/user";
import AccountInfoSection from "@/app/(Auth)/components/AccountInfoSection";
import PlanSection, {CreditPlan} from "@/app/(Auth)/users/[id]/component/PlanSection";

interface Props {
    id: string;
    initialUser: UserType;
    initialPlans: CreditPlan[];
}

export default function CompanyDetailPage({id, initialUser, initialPlans}: Props) {
    return (
        <div className={'admin_page company_detail_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/users'}>가입회원사</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>

            <div className={'company_detail_layout'}>
                <AccountInfoSection user={initialUser} memberType={'users'}/>
                <PlanSection userId={id} initialPlans={initialPlans} creditSummary={initialUser.creditSummary}/>
            </div>
        </div>
    );
}
