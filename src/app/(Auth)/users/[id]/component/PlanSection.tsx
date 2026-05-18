'use client';

import {useMemo, useRef, useState} from "react";
import {formatDateDot, formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup from "@/app/(Auth)/users/[id]/component/OverseasPlanPopup";
import CreditUsagePopup from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";

/* ───────── 타입 정의 (백엔드 DTO 매핑) ───────── */
export type PaymentMethod = 'PG_CARD' | 'GA_CONTRACT' | 'BANK_TRANSFER';
export type PlanStatus = 'ACTIVE' | 'EXPIRED';
export type RoundStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED';
export type CreditType = 'FREE' | 'PAID';

export interface CreditRound {
    id: number;
    scheduledDate: string;
    expireAt: string | null;
    grantedAmount: number | null;
    usedAmount: number | null;
    balance: number | null;
    expiredAmount: number | null;
    creditType: CreditType | null;
    status: RoundStatus | null;
}

export interface CreditPlan {
    id: number;
    status: PlanStatus | null;
    planName: string;
    startDate: string;
    endDate: string;
    months: number | null;
    paymentMethod: PaymentMethod | null;
    paymentMethodName: string | null;
    billingDay: number | null;
    contractDate: string | null;
    contractAmount: number | null;
    paymentAmount: number | null;
    paymentDate: string | null;
    createdAt: string;
    rounds: CreditRound[];
}

interface Props {
    plans: CreditPlan[];
}

/* ───────── 상태 뱃지 ───────── */
const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
    ACTIVE: '이용중',
    EXPIRED: '이용만료',
};

const PLAN_STATUS_CLASS: Record<PlanStatus, string> = {
    ACTIVE: 'badge_active',
    EXPIRED: 'badge_expired',
};

const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
    SCHEDULED: '예정',
    ACTIVE: '진행',
    EXPIRED: '만료',
    EXHAUSTED: '소진',
};

const ROUND_STATUS_CLASS: Record<RoundStatus, string> = {
    SCHEDULED: 'badge_scheduled',
    ACTIVE: 'badge_progress',
    EXPIRED: 'badge_expired',
    EXHAUSTED: 'badge_completed',
};

const formatNum = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    return n.toLocaleString();
};

const formatAmount = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    return `${n.toLocaleString()}원(vat포함)`;
};

const formatPaymentMethodLabel = (plan: CreditPlan) => {
    const base = plan.paymentMethodName || '-';
    if (plan.paymentMethod === 'PG_CARD' && plan.billingDay) {
        return `${base} (매월 ${plan.billingDay}일)`;
    }
    return base;
};

const getPlanStatus = (plan: CreditPlan): PlanStatus => {
    if (!plan.endDate) return 'ACTIVE';
    const end = new Date(plan.endDate);
    end.setHours(23, 59, 59, 999);
    return new Date() > end ? 'EXPIRED' : 'ACTIVE';
};

export default function PlanSection({plans}: Props) {
    const {addPopup} = usePopupStore();
    const [visiblePlans] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const planListRef = useRef<HTMLDivElement>(null);

    // 플랜이 없거나, 가장 최근(createdAt) 플랜이 만료된 경우에만 신규 등록 가능
    const canRegisterOverseasPlan = useMemo(() => {
        if (plans.length === 0) return true;
        const lastPlan = [...plans].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        return getPlanStatus(lastPlan) === 'EXPIRED';
    }, [plans]);

    const handleOpenUsagePopup = () => {
        addPopup(<CreditUsagePopup/>);
    };

    const handleOpenOverseasPlanPopup = () => {
        if (!canRegisterOverseasPlan) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이용 중인 플랜이 있어 신규 등록할 수 없습니다.'}/>);
            return;
        }
        addPopup(<OverseasPlanPopup onSave={(data) => {
            // TODO: API 연동
            console.log('해외영업실행 플랜 등록:', data);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        }}/>);
    };

    const handleEditOverseasPlan = (plan: CreditPlan) => {
        const formatNumberWithComma = (n: number) => n.toLocaleString();
        const firstScheduled = plan.rounds.find(r => (r.status ?? 'SCHEDULED') === 'SCHEDULED');
        const baseCreditSource = firstScheduled ?? plan.rounds[0];
        addPopup(<OverseasPlanPopup
            initialData={{
                planStartDate: plan.startDate,
                planMonths: plan.months ?? plan.rounds.length ?? 1,
                contractAmount: plan.contractAmount ? formatNumberWithComma(plan.contractAmount) : '',
                contractMethod: plan.paymentMethodName || 'GA 계약',
                managerGA: '',
                managerTP: '',
                contractDate: plan.contractDate ?? '',
                monthlyCredit: baseCreditSource?.grantedAmount ? formatNumberWithComma(baseCreditSource.grantedAmount) : '',
                credits: plan.rounds.map((r, i) => ({
                    round: i + 1,
                    period: r.expireAt ? `${formatDateDot(r.scheduledDate)} ~ ${formatDateDot(r.expireAt)}` : formatDateDot(r.scheduledDate),
                    credit: r.grantedAmount !== null ? formatNumberWithComma(r.grantedAmount) : '',
                    periodStartDate: r.scheduledDate,
                    periodEndDate: r.expireAt ?? undefined,
                    status: r.status ?? 'SCHEDULED',
                })),
            }}
            onSave={(data) => {
                // TODO: API 연동
                console.log('해외영업실행 플랜 수정:', data);
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            }}
        />);
    };

    const renderCard = (plan: CreditPlan) => {
        switch (plan.paymentMethod) {
            case 'GA_CONTRACT':
                return <ContractPlanCard plan={plan} onUsage={handleOpenUsagePopup} onEdit={() => handleEditOverseasPlan(plan)}/>;
            case 'BANK_TRANSFER':
                return <ContractPlanCard plan={plan} onUsage={handleOpenUsagePopup}/>;
            case 'PG_CARD':
            default:
                return <PgCardPlanCard plan={plan} onUsage={handleOpenUsagePopup}/>;
        }
    };

    const cardClass = (plan: CreditPlan) => {
        const layout = plan.paymentMethod === 'PG_CARD' ? 'standard' : 'overseas';
        const expired = getPlanStatus(plan) === 'EXPIRED' ? 'expired' : '';
        return `plan_card ${layout} ${expired}`.trim();
    };

    return (
        <div className={'company_detail_right'}>
            <div className={'plan_header'}>
                <div className={'section_title'}>
                    <span className={'admin_icon arrow_icon'}/>
                    플랜 상세정보
                </div>
                <button type={'button'}
                        className={`btn_add_plan${!canRegisterOverseasPlan ? ' disabled' : ''}`}
                        onClick={handleOpenOverseasPlanPopup}>
                    + 해외영업실행플랜 등록
                </button>
            </div>

            <div ref={planListRef} className={`plan_list ${expanded ? 'expanded' : ''}`}>
                {(expanded ? plans : plans.slice(0, visiblePlans)).map(plan => (
                    <div key={plan.id} className={cardClass(plan)}>
                        {renderCard(plan)}
                    </div>
                ))}
            </div>

            {plans.length > visiblePlans && !expanded && (
                <button type={'button'} className={'btn_more'} onClick={() => setExpanded(true)}>
                    <span className={'admin_icon more_icon'}/> 더보기
                </button>
            )}
        </div>
    );
}

/* ───────── 라운드 테이블 (GA_CONTRACT / BANK_TRANSFER 공용) ───────── */
function RoundsTable({rounds, onUsage}: { rounds: CreditRound[]; onUsage: () => void }) {
    return (
        <div className={'credit_table_wrap'}>
            <table style={{tableLayout: 'fixed', width: '100%'}}>
                <colgroup>
                    <col style={{width: '8%'}}/>
                    <col style={{width: '25%'}}/>
                    <col style={{width: '17%'}}/>
                    <col style={{width: '17%'}}/>
                    <col style={{width: '17%'}}/>
                    <col style={{width: '11%'}}/>
                </colgroup>
                <thead>
                <tr>
                    <th>이용상태</th>
                    <th>이용기간</th>
                    <th>크레딧 지급</th>
                    <th>크레딧 사용</th>
                    <th>크레딧 잔여</th>
                    <th>비고</th>
                </tr>
                </thead>
                <tbody>
                {rounds.map(round => {
                    const statusKey = round.status ?? 'SCHEDULED';
                    const rowDimmed = statusKey === 'EXPIRED' || statusKey === 'EXHAUSTED';
                    return (
                        <tr key={round.id} className={rowDimmed ? 'row_completed' : ''}>
                            <td>
                                <span className={`credit_status ${ROUND_STATUS_CLASS[statusKey]}`}>
                                    {ROUND_STATUS_LABEL[statusKey]}
                                </span>
                            </td>
                            <td>
                                {formatDateDot(round.scheduledDate)} ~ {round.expireAt ? formatDateDot(round.expireAt) : '-'}
                            </td>
                            <td>{formatNum(round.grantedAmount)}</td>
                            <td className={round.usedAmount !== null && round.usedAmount > 0 ? 'negative' : ''}>
                                {round.usedAmount !== null ? formatNum(-round.usedAmount) : '-'}
                            </td>
                            <td>{formatNum(round.balance)}</td>
                            <td>
                                <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

/* ───────── 계약형 카드 (GA_CONTRACT / BANK_TRANSFER) ───────── */
function ContractPlanCard({plan, onUsage, onEdit}: { plan: CreditPlan; onUsage: () => void; onEdit?: () => void }) {
    const status = getPlanStatus(plan);
    return (
        <>
            <div className={'plan_card_header'}>
                <div className={'plan_info_grid overseas_grid'}>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>플랜구분</span>
                        <span className={'value'}>
                            {plan.planName}
                            <span className={`plan_badge ${PLAN_STATUS_CLASS[status]}`}>{PLAN_STATUS_LABEL[status]}</span>
                        </span>
                    </div>
                    <div className={'plan_info_item period'}>
                        <span className={'label'}>계약기간</span>
                        <span className={'value'}>{formatDateDot(plan.startDate)} ~ {formatDateDot(plan.endDate)}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약금액</span>
                        <span className={'value'}>{formatAmount(plan.contractAmount)}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약방식</span>
                        <span className={'value'}>{plan.paymentMethodName || '-'}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약일자</span>
                        <span className={'value'}>{plan.contractDate ? formatDateDot(plan.contractDate) : '-'}</span>
                    </div>
                </div>
                {onEdit && status !== 'EXPIRED' && (
                    <button type={'button'} className={'btn_edit'} onClick={onEdit}>
                        <span className={'admin_icon icon_edit'}/>
                    </button>
                )}
            </div>

            <RoundsTable rounds={plan.rounds} onUsage={onUsage}/>
        </>
    );
}

/* ───────── PG 카드결제 카드 ───────── */
function PgCardPlanCard({plan, onUsage}: { plan: CreditPlan; onUsage: () => void }) {
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
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제금액</span>
                    <span className={'value'}>{formatAmount(plan.paymentAmount)}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제방식</span>
                    <span className={'value'}>{formatPaymentMethodLabel(plan)}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제일시</span>
                    <span className={'value'}>{plan.paymentDate ? formatDateTimeDot(plan.paymentDate) : '-'}</span>
                </div>
            </div>

            <div className={'credit_summary_row'}>
                <span className={'summary_label'}>크레딧</span>
                <div className={'summary_values'}>
                    <span className={'summary_item grant'}>지급 <span className={'line'}/> <span>{formatNum(summary.grant)}</span></span>
                    <span className={'summary_item used'}>사용 <span className={'line'}/> <span>{formatNum(-summary.used)}</span></span>
                    <span className={'summary_item remain'}>잔여 <span className={'line'}/> <span>{formatNum(summary.balance)}</span></span>
                    <span className={'summary_item expired'}>소멸 <span className={'line'}/> <span>{formatNum(-summary.expired)}</span></span>
                    <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                </div>
            </div>
        </>
    );
}
