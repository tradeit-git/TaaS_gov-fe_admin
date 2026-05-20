'use client';

import {useRouter} from "next/navigation";
import {usePopupStore} from "@/stores/common/popupStore";
import callApi from "@/utill/apiRequest";
import {CreditSummaryType} from "@/types/user/user";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import {ServiceCreditButton} from "@/app/(Auth)/users/[id]/component/ServicePlanCard";
import {formatNegated, formatNum} from "@/app/(Auth)/users/[id]/component/planShared";

interface Props {
    userId: string;
    summary: CreditSummaryType | null;
}

export default function CreditStatusSection({userId, summary}: Props) {
    const {addPopup} = usePopupStore();
    const router = useRouter();

    const handleOpenUsagePopup = async () => {
        // 회원 통합 크레딧 거래내역
        const endpoint = `/api/admin/members/users/${userId}/credits/transactions`;
        const res = await callApi(`${endpoint}?page=0&size=10`, {method: 'GET', credentials: 'include'});
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup endpoint={endpoint} initialData={initialData}/>);
    };

    return (
        <div className={'credit_status_box'}>
            <div className={'plan_header'}>
                <div className={'section_title'}>
                    <span className={'admin_icon arrow_icon'}/>
                    크레딧 현황
                </div>
                <ServiceCreditButton userId={userId} onSuccess={() => router.refresh()}/>
            </div>

            <div className={'credit_summary_row'}>
                <span className={'summary_label'}>크레딧</span>
                <div className={'summary_values'}>
                    <span className={'summary_item grant'}>지급 <span className={'line'}/> <span>{formatNum(summary?.granted)}</span></span>
                    <span className={'summary_item used'}>사용 <span className={'line'}/> <span>{formatNegated(summary?.used)}</span></span>
                    <span className={'summary_item remain'}>잔여 <span className={'line'}/> <span>{formatNum(summary?.balance)}</span></span>
                    <span className={'summary_item expired'}>소멸 <span className={'line'}/> <span>{formatNegated(summary?.expired)}</span></span>
                    <button type={'button'} className={'btn_usage'} onClick={handleOpenUsagePopup}>사용내역</button>
                </div>
            </div>
        </div>
    );
}
