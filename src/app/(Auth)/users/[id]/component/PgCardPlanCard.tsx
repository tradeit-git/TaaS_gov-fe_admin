'use client';

import {formatDateDot, formatDateTimeDot} from "@/utill/format";
import {
    CreditPlan,
    CreditRound,
    PLAN_STATUS_CLASS,
    PLAN_STATUS_LABEL,
    formatAmount,
    formatNegated,
    formatNum,
    formatPaymentMethodLabel,
    getPlanStatus,
} from "@/app/(Auth)/users/[id]/component/planShared";

/* ───────── PG 카드결제 카드 ───────── */
export default function PgCardPlanCard({plan, onUsage}: {
    plan: CreditPlan;
    onUsage: (round: CreditRound) => void;
}) {
    const latestRound = plan.rounds[plan.rounds.length - 1];
    const status = getPlanStatus(plan);
    const summary = plan.rounds.reduce(
        (acc, r) => ({
            grant: acc.grant + (r.grantedAmount ?? 0),
            used: acc.used + (r.usedAmount ?? 0),
            balance: acc.balance + (r.balance ?? 0),
            expired: acc.expired + (r.expiredAmount ?? 0),
        }),
        {grant: 0, used: 0, balance: 0, expired: 0},
    );

    return (
        <>
            <div className={'plan_info_grid standard_grid'}>
                <div className={'plan_info_item'}>
                    <span className={'label'}>플랜구분</span>
                    <span className={'value'}>
                        {plan.planName}
                        <span className={`plan_badge ${PLAN_STATUS_CLASS[status]}`}>{PLAN_STATUS_LABEL[status]}</span>
                    </span>
                </div>
                <div className={'plan_info_item period'}>
                    <span className={'label'}>이용기간</span>
                    <span className={'value'}>{formatDateDot(plan.startDate)} ~ {formatDateDot(plan.endDate)}</span>
                </div>
                <div className={'plan_info_item narrow'}>
                    <span className={'label'}>결제금액</span>
                    <span className={'value'}>{formatAmount(plan.paymentAmount)}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제방식</span>
                    <span className={'value'}>{formatPaymentMethodLabel(plan)}</span>
                </div>
                <div className={'plan_info_item narrow'}>
                    <span className={'label'}>결제일시</span>
                    <span className={'value'}>{plan.paymentDate ? formatDateTimeDot(plan.paymentDate) : '-'}</span>
                </div>
            </div>

            <div className={'credit_summary_row'}>
                <span className={'summary_label'}>크레딧</span>
                <div className={'summary_values'}>
                    <span className={'summary_item grant'}>지급 <span className={'line'}/> <span>{formatNum(summary.grant)}</span></span>
                    <span className={'summary_item used'}>사용 <span className={'line'}/> <span>{formatNegated(summary.used)}</span></span>
                    <span className={'summary_item remain'}>잔여 <span className={'line'}/> <span>{formatNum(summary.balance)}</span></span>
                    {summary.expired > 0 && (
                        <span className={'summary_item expired'}>소멸 <span className={'line'}/> <span>{formatNegated(summary.expired)}</span></span>
                    )}
                    {latestRound && (
                        <button type={'button'} className={'btn_usage'} onClick={() => onUsage(latestRound)}>사용내역</button>
                    )}
                </div>
            </div>
        </>
    );
}
