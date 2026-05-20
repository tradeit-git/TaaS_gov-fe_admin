'use client';

import {formatDateDot} from "@/utill/format";
import {
    CreditPlan,
    CreditRound,
    PLAN_STATUS_CLASS,
    PLAN_STATUS_LABEL,
    ROUND_STATUS_CLASS,
    ROUND_STATUS_LABEL,
    formatAmount,
    formatNegated,
    formatNum,
    getPlanStatus,
    todayISODate,
} from "@/app/(Auth)/users/[id]/component/planShared";

/* ───────── 라운드 테이블 (GA_CONTRACT / BANK_TRANSFER 공용) ───────── */
function RoundsTable({rounds, onUsage, onGrant}: {
    rounds: CreditRound[];
    onUsage: (round: CreditRound) => void;
    onGrant?: (round: CreditRound) => void;
}) {
    const today = todayISODate();
    return (
        <div className={'credit_table_wrap'}>
            <table style={{tableLayout: 'fixed', width: '100%'}}>
                <colgroup>
                    <col style={{width: '8%'}}/>
                    <col style={{width: '22%'}}/>
                    <col style={{width: '14%'}}/>
                    <col style={{width: '14%'}}/>
                    <col style={{width: '14%'}}/>
                    <col style={{width: '14%'}}/>
                    <col style={{width: '11%'}}/>
                </colgroup>
                <thead>
                <tr>
                    <th>이용상태</th>
                    <th>이용기간</th>
                    <th>크레딧 지급</th>
                    <th>크레딧 사용</th>
                    <th>크레딧 잔여</th>
                    <th>크레딧 소멸</th>
                    <th>비고</th>
                </tr>
                </thead>
                <tbody>
                {rounds.map(round => {
                    const statusKey = round.status ?? 'SCHEDULED';
                    const rowDimmed = statusKey === 'EXPIRED' || statusKey === 'EXHAUSTED';
                    const canGrant = statusKey === 'SCHEDULED' && round.scheduledDate <= today;
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
                                {formatNegated(round.usedAmount)}
                            </td>
                            <td>{formatNum(round.balance)}</td>
                            <td>
                                {(statusKey === 'EXPIRED' || statusKey === 'EXHAUSTED') ? formatNegated(round.expiredAmount) : ''}
                            </td>
                            <td>
                                {canGrant && onGrant ? (
                                    <button type={'button'} className={'btn_grant'} onClick={() => onGrant(round)}>지급</button>
                                ) : statusKey === 'SCHEDULED' ? null : (
                                    <button type={'button'} className={'btn_usage'} onClick={() => onUsage(round)}>사용내역</button>
                                )}
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
export default function ContractPlanCard({plan, onUsage, onEdit, onDelete, onGrant}: {
    plan: CreditPlan;
    onUsage: (round: CreditRound) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onGrant?: (round: CreditRound) => void;
}) {
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
                        <span className={'label'}>플랜기간</span>
                        <span className={'value'}>{formatDateDot(plan.startDate)} ~ {formatDateDot(plan.endDate)}</span>
                    </div>
                    <div className={'plan_info_item narrow'}>
                        <span className={'label'}>계약금액</span>
                        <span className={'value'}>{formatAmount(plan.contractAmount)}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약방식</span>
                        <span className={'value'}>{plan.paymentMethodName || '-'}</span>
                    </div>
                    <div className={'plan_info_item narrow'}>
                        <span className={'label'}>계약일자</span>
                        <span className={'value'}>{plan.contractDate ? formatDateDot(plan.contractDate) : '-'}</span>
                    </div>
                </div>
                <div className={'plan_actions'}>
                    {onEdit && status !== 'EXPIRED' && (
                        <button type={'button'} className={'btn_edit'} onClick={onEdit}>
                            <span className={'admin_icon icon_edit'}/>
                        </button>
                    )}
                    {onDelete && (
                        <button type={'button'} className={'btn_delete'} onClick={onDelete}>
                            <span className={'admin_icon icon_trash'}/>
                        </button>
                    )}
                </div>
            </div>

            <RoundsTable rounds={plan.rounds} onUsage={onUsage} onGrant={onGrant}/>
        </>
    );
}
