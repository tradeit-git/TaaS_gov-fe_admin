'use client';

import {useRef, useState} from "react";
import {formatDateDot, formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup from "@/app/(Auth)/users/[id]/component/OverseasPlanPopup";
import CreditUsagePopup from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";

/* ───────── 타입 정의 ───────── */
export interface CreditItem {
    id: number;
    status: 'completed' | 'in_progress' | 'scheduled';
    startDate: string;
    endDate: string;
    creditGrant: number | null;
    creditUsed: number | null;
    creditRemain: number | null;
}

export interface OverseasPlan {
    id: number;
    type: 'overseas';
    planName: string;
    status: 'active' | 'expired';
    contractStartDate: string;
    contractEndDate: string;
    contractAmount: string;
    contractMethod: string;
    contractDate: string | null;
    credits: CreditItem[];
}

export interface StandardPlan {
    id: number;
    type: 'standard';
    planName: string;
    status: 'active' | 'expired';
    usageStartDate: string;
    usageEndDate: string;
    paymentAmount: string;
    paymentMethod: string;
    paymentDate: string | null;
    creditSummary: {
        grant: number;
        used: number;
        remain: number;
        expired: number;
    };
}

export type PlanItem = OverseasPlan | StandardPlan;

interface Props {
    plans: PlanItem[];
}

/* ───────── 상태 뱃지 ───────── */
const STATUS_LABEL: Record<string, string> = {
    active: '이용중',
    expired: '이용만료',
    completed: '완료',
    in_progress: '진행',
    scheduled: '예정',
};

const STATUS_CLASS: Record<string, string> = {
    active: 'badge_active',
    expired: 'badge_expired',
    completed: 'badge_completed',
    in_progress: 'badge_progress',
    scheduled: 'badge_scheduled',
};

export default function PlanSection({plans}: Props) {
    const {addPopup} = usePopupStore();
    const [visiblePlans] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const planListRef = useRef<HTMLDivElement>(null);

    const handleOpenUsagePopup = () => {
        addPopup(<CreditUsagePopup/>);
    };

    const handleOpenOverseasPlanPopup = () => {
        addPopup(<OverseasPlanPopup onSave={(data) => {
            // TODO: API 연동
            console.log('해외영업실행 플랜 등록:', data);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        }}/>);
    };

    const handleEditOverseasPlan = (plan: OverseasPlan) => {
        const formatNumberWithComma = (n: number) => n.toLocaleString();
        addPopup(<OverseasPlanPopup
            initialData={{
                contractStartDate: plan.contractStartDate,
                contractEndDate: plan.contractEndDate,
                contractAmount: plan.contractAmount.replace(/[^0-9]/g, '') ? formatNumberWithComma(parseInt(plan.contractAmount.replace(/[^0-9,]/g, '').replace(/,/g, ''))) : plan.contractAmount,
                contractMethod: plan.contractMethod,
                managerGA: '',
                managerTP: '',
                contractDate: plan.contractDate ?? '',
                creditStartDate: plan.credits.length > 0 ? plan.credits[0].startDate : '',
                monthlyCredit: plan.credits.length > 0 && plan.credits[0].creditGrant ? formatNumberWithComma(plan.credits[0].creditGrant) : '',
                credits: plan.credits.map((c, i) => ({
                    round: i + 1,
                    period: `${formatDateDot(c.startDate)} ~ ${formatDateDot(c.endDate)}`,
                    credit: c.creditGrant !== null ? formatNumberWithComma(c.creditGrant) : '',
                })),
            }}
            onSave={(data) => {
                // TODO: API 연동
                console.log('해외영업실행 플랜 수정:', data);
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            }}
        />);
    };

    const formatNum = (n: number | null) => {
        if (n === null || n === undefined) return '-';
        return n.toLocaleString();
    };

    return (
        <div className={'company_detail_right'}>
            <div className={'plan_header'}>
                <div className={'section_title'}>
                    <span className={'admin_icon arrow_icon'}/>
                    플랜 상세정보
                </div>
                <button type={'button'} className={'btn_add_plan'} onClick={handleOpenOverseasPlanPopup}>
                    + 해외영업실행플랜 등록
                </button>
            </div>

            <div ref={planListRef} className={`plan_list ${expanded ? 'expanded' : ''}`}>
                {(expanded ? plans : plans.slice(0, visiblePlans)).map(plan => (
                    <div key={plan.id} className={`plan_card ${plan.type === 'overseas' ? 'overseas' : 'standard'} ${plan.status === 'expired' ? 'expired' : ''}`}>
                        {plan.type === 'overseas' ? (
                            <OverseasPlanCard plan={plan} formatNum={formatNum} onUsage={handleOpenUsagePopup} onEdit={() => handleEditOverseasPlan(plan)}/>
                        ) : (
                            <StandardPlanCard plan={plan} formatNum={formatNum} onUsage={handleOpenUsagePopup}/>
                        )}
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

/* ───────── 해외영업 플랜 카드 ───────── */
function OverseasPlanCard({plan, formatNum, onUsage, onEdit}: { plan: OverseasPlan; formatNum: (n: number | null) => string; onUsage: () => void; onEdit: () => void }) {
    return (
        <>
            <div className={'plan_card_header'}>
                <div className={'plan_info_grid overseas_grid'}>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>플랜구분</span>
                        <span className={'value'}>
                            {plan.planName}
                            <span className={`plan_badge ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
                        </span>
                    </div>
                    <div className={'plan_info_item period'}>
                        <span className={'label'}>계약기간</span>
                        <span className={'value'}>{formatDateDot(plan.contractStartDate)} ~ {formatDateDot(plan.contractEndDate)}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약금액</span>
                        <span className={'value'}>{plan.contractAmount}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약방식</span>
                        <span className={'value'}>{plan.contractMethod}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약일자</span>
                        <span className={'value'}>{plan.contractDate ? formatDateDot(plan.contractDate) : '-'}</span>
                    </div>
                </div>
                {plan.status !== 'expired' && (
                    <button type={'button'} className={'btn_edit'} onClick={onEdit}>
                        <span className={'admin_icon icon_edit'}/>
                    </button>
                )}
            </div>

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
                    {plan.credits.map(credit => (
                        <tr key={credit.id} className={credit.status === 'completed' ? 'row_completed' : ''}>
                            <td>
                                <span className={`credit_status ${STATUS_CLASS[credit.status]}`}>
                                    {STATUS_LABEL[credit.status]}
                                </span>
                            </td>
                            <td>{formatDateDot(credit.startDate)} ~ {formatDateDot(credit.endDate)}</td>
                            <td>{formatNum(credit.creditGrant)}</td>
                            <td className={credit.creditUsed !== null && credit.creditUsed < 0 ? 'negative' : ''}>
                                {formatNum(credit.creditUsed)}
                            </td>
                            <td>{formatNum(credit.creditRemain)}</td>
                            <td>
                                <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ───────── 일반 플랜 카드 ───────── */
function StandardPlanCard({plan, formatNum, onUsage}: { plan: StandardPlan; formatNum: (n: number | null) => string; onUsage: () => void }) {
    return (
        <>
            <div className={'plan_info_grid standard_grid'}>
                <div className={'plan_info_item'}>
                    <span className={'label'}>플랜구분</span>
                    <span className={'value'}>
                        {plan.planName}
                        <span className={`plan_badge ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
                    </span>
                </div>
                <div className={'plan_info_item period'}>
                    <span className={'label'}>이용기간</span>
                    <span className={'value'}>{formatDateDot(plan.usageStartDate)} ~ {formatDateDot(plan.usageEndDate)}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제금액</span>
                    <span className={'value'}>{plan.paymentAmount}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제방식</span>
                    <span className={'value'}>{plan.paymentMethod}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제일시</span>
                    <span className={'value'}>{plan.paymentDate ? formatDateTimeDot(plan.paymentDate) : '-'}</span>
                </div>
            </div>

            <div className={'credit_summary_row'}>
                <span className={'summary_label'}>크레딧</span>
                <div className={'summary_values'}>
                    <span className={'summary_item grant'}>지급 <span className={'line'}/> <span>{formatNum(plan.creditSummary.grant)}</span></span>
                    <span className={'summary_item used'}>사용 <span className={'line'}/> <span>{formatNum(plan.creditSummary.used)}</span></span>
                    <span className={'summary_item remain'}>잔여 <span className={'line'}/> <span>{formatNum(plan.creditSummary.remain)}</span></span>
                    <span className={'summary_item expired'}>소멸 <span className={'line'}/> <span>{formatNum(plan.creditSummary.expired)}</span></span>
                    <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                </div>
            </div>
        </>
    );
}
