'use client';

import {usePopupStore} from "@/stores/common/popupStore";
import callApi from "@/utill/apiRequest";
import {CreditSummaryType} from "@/types/user/user";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import {formatNum} from "@/app/(Auth)/users/[id]/component/planShared";

interface Props {
    userId: string;
    summary: CreditSummaryType | null;
}

export default function CreditStatusSection({userId, summary}: Props) {
    const {addPopup} = usePopupStore();

    const handleOpenUsagePopup = async () => {
        const endpoint = `/api/admin/members/users/${userId}/credits/transactions`;
        const res = await callApi(`${endpoint}?page=0&size=10`, {method: 'GET', credentials: 'include'});
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup endpoint={endpoint} initialData={initialData}/>);
    };

    return (
        <div className={'credit_status_section'}>
            <div className={'section_title'}>
                <span className={'admin_icon arrow_icon'}/>
                크레딧 누계 현황
            </div>

            <div className={'credit_card_row'}>
                <div className={'credit_card'}>
                    <span className={'credit_card_label'}>누적 지급</span>
                    <span className={'credit_card_value'}>{formatNum(summary?.granted)}</span>
                </div>
                <div className={'credit_card'}>
                    <div className={'credit_card_label_row'}>
                        <span className={'credit_card_label'}>누적 사용</span>
                        <button type={'button'} className={'btn_usage_small'} onClick={handleOpenUsagePopup}>사용내역</button>
                    </div>
                    <span className={'credit_card_value accent_blue'}>{formatNum(summary?.used)}</span>
                </div>
                <div className={'credit_card highlight'}>
                    <span className={'credit_card_label'}>현재 잔여</span>
                    <span className={'credit_card_value accent_orange'}>{formatNum(summary?.balance)}</span>
                </div>
                <div className={'credit_card'}>
                    <span className={'credit_card_label'}>누적 소멸</span>
                    <span className={'credit_card_value'}>{formatNum(summary?.expired)}</span>
                </div>
            </div>
        </div>
    );
}
