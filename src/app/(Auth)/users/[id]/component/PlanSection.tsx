'use client';

import {useMemo, useRef, useState} from "react";
import {formatDateDot, formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup, {OverseasPlanFormData} from "@/app/(Auth)/users/[id]/component/OverseasPlanPopup";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import ServiceCreditPopup, {ServiceCreditFormData} from "@/app/(Auth)/users/[id]/component/ServiceCreditPopup";
import callApi from "@/utill/apiRequest";

/* ───────── 타입 정의 (백엔드 DTO 매핑) ───────── */
export type PaymentMethod = 'PG_CARD' | 'GA_CONTRACT' | 'BANK_TRANSFER';
export type PlanStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';
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
    managerGa: string | null;
    managerTp: string | null;
    createdAt: string;
    rounds: CreditRound[];
}

interface Props {
    userId: string;
    initialPlans: CreditPlan[];
}

const parseAmount = (s: string) => Number((s || '').replace(/,/g, '')) || 0;

const buildCreatePayload = (data: OverseasPlanFormData) => ({
    planName: '해외영업실행',
    startDate: data.planStartDate,
    months: data.planMonths,
    contractAmount: parseAmount(data.contractAmount),
    paymentMethod: 'GA_CONTRACT',
    paymentMethodName: data.contractMethod,
    contractDate: data.contractDate,
    monthlyCredit: parseAmount(data.monthlyCredit),
    managerGa: data.managerGA,
    managerTp: data.managerTP,
});

// 수정은 startDate 변경 불가 (명세 참조)
const buildEditPayload = (data: OverseasPlanFormData) => ({
    planName: '해외영업실행',
    months: data.planMonths,
    monthlyCredit: parseAmount(data.monthlyCredit),
    contractAmount: parseAmount(data.contractAmount),
    paymentMethod: 'GA_CONTRACT',
    paymentMethodName: data.contractMethod,
    contractDate: data.contractDate,
    managerGa: data.managerGA,
    managerTp: data.managerTP,
});

const todayISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const sortByCreatedDesc = (list: CreditPlan[]) =>
    [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

/* ───────── 서비스 크레딧 타입 & 목업 데이터 ───────── */
interface ServiceCreditItem {
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    grantedAmount: number;
    usedAmount: number;
    balance: number;
    expiredAmount: number;
}

const MOCK_SERVICE_CREDITS: ServiceCreditItem[] = [
    {
        id: 9001,
        planName: '서비스',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        grantedAmount: 5000,
        usedAmount: 0,
        balance: 5000,
        expiredAmount: 0,
    },
    {
        id: 9002,
        planName: '서비스',
        startDate: '2026-05-19',
        endDate: '2026-06-30',
        grantedAmount: 5000,
        usedAmount: 0,
        balance: 5000,
        expiredAmount: 0,
    },
    {
        id: 9003,
        planName: '서비스',
        startDate: '2026-01-01',
        endDate: '2026-04-30',
        grantedAmount: 5000,
        usedAmount: 1000,
        balance: 4000,
        expiredAmount: 4000,
    },
];

const getServiceStatus = (item: ServiceCreditItem): PlanStatus => {
    const today = todayISODate();
    if (today > item.endDate) return 'EXPIRED';
    return 'ACTIVE';
};

const canEditService = (item: ServiceCreditItem) => getServiceStatus(item) !== 'EXPIRED';

const canDeleteService = (item: ServiceCreditItem) => {
    const today = todayISODate();
    return getServiceStatus(item) === 'ACTIVE' && today < item.startDate;
};

const isServiceStarted = (item: ServiceCreditItem) => {
    const today = todayISODate();
    return today >= item.startDate;
};

/* ───────── 상태 뱃지 ───────── */
const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
    SCHEDULED: '예정',
    ACTIVE: '이용중',
    EXPIRED: '이용만료',
};

const PLAN_STATUS_CLASS: Record<PlanStatus, string> = {
    SCHEDULED: 'badge_scheduled',
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

const formatNegated = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    if (n === 0) return '0';
    return (-n).toLocaleString();
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
    const now = new Date();
    if (plan.startDate) {
        const start = new Date(plan.startDate);
        start.setHours(0, 0, 0, 0);
        if (now < start) return 'SCHEDULED';
    }
    if (!plan.endDate) return 'ACTIVE';
    const end = new Date(plan.endDate);
    end.setHours(23, 59, 59, 999);
    return now > end ? 'EXPIRED' : 'ACTIVE';
};

export default function PlanSection({userId, initialPlans}: Props) {
    const {addPopup} = usePopupStore();
    const [plans, setPlans] = useState<CreditPlan[]>(initialPlans);
    const [visiblePlans] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const planListRef = useRef<HTMLDivElement>(null);

    // 플랜이 없거나, 가장 최근(createdAt) 플랜이 만료된 경우에만 신규 등록 가능
    const canRegisterOverseasPlan = useMemo(() => {
        if (plans.length === 0) return true;
        const lastPlan = sortByCreatedDesc(plans)[0];
        return getPlanStatus(lastPlan) === 'EXPIRED';
    }, [plans]);

    const handleOpenUsagePopup = async (plan: CreditPlan, round: CreditRound) => {
        const res = await callApi(
            `/api/admin/members/users/${userId}/credit-plans/${plan.id}/rounds/${round.id}/transactions?page=0&size=10`,
            {method: 'GET', credentials: 'include'},
        );
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup
            userId={userId}
            planId={plan.id}
            roundId={round.id}
            initialData={initialData}
        />);
    };

    const handleCreateOverseasPlan = async (data: OverseasPlanFormData) => {
        const res = await callApi(`/api/admin/members/users/${userId}/credit-plans`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(buildCreatePayload(data)),
        });

        if (res.result && res.data) {
            const created = res.data as CreditPlan;
            setPlans(prev => sortByCreatedDesc([created, ...prev]));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '등록에 실패했습니다.'}/>);
        }
    };

    const handleOpenOverseasPlanPopup = () => {
        if (!canRegisterOverseasPlan) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이용 중인 플랜이 있어 신규 등록할 수 없습니다.'}/>);
            return;
        }
        addPopup(<OverseasPlanPopup onSave={handleCreateOverseasPlan}/>);
    };

    const handleOpenServiceCreditPopup = () => {
        const activePlan = sortByCreatedDesc(plans).find(p => getPlanStatus(p) === 'ACTIVE');
        const planName = activePlan?.planName || '서비스';

        const handleServiceCreditSave = async (data: ServiceCreditFormData) => {
            const payload = {
                planName,
                startDate: data.startDate,
                endDate: data.endDate,
                credit: Number((data.credit || '').replace(/,/g, '')) || 0,
            };
            const res = await callApi(`/api/admin/members/users/${userId}/service-credits`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '등록에 실패했습니다.'}/>);
            }
        };

        addPopup(<ServiceCreditPopup planName={planName} onSave={handleServiceCreditSave}/>);
    };

    const handleServiceUsagePopup = async (sc: ServiceCreditItem) => {
        const res = await callApi(
            `/api/admin/members/users/${userId}/service-credits/${sc.id}/transactions?page=0&size=10`,
            {method: 'GET', credentials: 'include'},
        );
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup
            userId={userId}
            planId={sc.id}
            roundId={sc.id}
            initialData={initialData}
        />);
    };

    const handleDeleteServiceCredit = (sc: ServiceCreditItem) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 플랜을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${userId}/service-credits/${sc.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    const handleEditServiceCredit = (sc: ServiceCreditItem) => {
        const started = isServiceStarted(sc);
        addPopup(<ServiceCreditPopup
            planName={sc.planName}
            initialData={{
                startDate: sc.startDate,
                endDate: sc.endDate,
                credit: sc.grantedAmount.toLocaleString(),
            }}
            started={started}
            onSave={async (data) => {
                // TODO: API 연동
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            }}
        />);
    };

    // 모든 회차가 예정 상태일 때만 삭제 가능 (실제 지급 이력이 없는 케이스)
    const canDeletePlan = (plan: CreditPlan) =>
        plan.rounds.length === 0 || plan.rounds.every(r => (r.status ?? 'SCHEDULED') === 'SCHEDULED');

    const handleGrantRound = (plan: CreditPlan, round: CreditRound) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 회차를 즉시 지급하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${userId}/credit-plans/${plan.id}/rounds/${round.id}/grant`, {
                method: 'POST',
                credentials: 'include',
            });
            if (res.result && res.data) {
                const updated = res.data as CreditPlan;
                setPlans(prev => sortByCreatedDesc(prev.map(p => p.id === updated.id ? updated : p)));
                addPopup(<AlertComponent alertType={'alert'} infoContent={'지급되었습니다.'}/>);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '지급에 실패했습니다.'}/>);
            }
        }}/>);
    };

    const handleDeleteOverseasPlan = (plan: CreditPlan) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 플랜을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${userId}/credit-plans/${plan.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                setPlans(prev => prev.filter(p => p.id !== plan.id));
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
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
                managerGA: plan.managerGa ?? '',
                managerTP: plan.managerTp ?? '',
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
            onSave={async (data) => {
                const res = await callApi(`/api/admin/members/users/${userId}/credit-plans/${plan.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(buildEditPayload(data)),
                });
                if (res.result && res.data) {
                    const updated = res.data as CreditPlan;
                    setPlans(prev => sortByCreatedDesc(prev.map(p => p.id === updated.id ? updated : p)));
                    addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
                } else {
                    addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '수정에 실패했습니다.'}/>);
                }
            }}
        />);
    };

    const renderCard = (plan: CreditPlan) => {
        const onDelete = canDeletePlan(plan) ? () => handleDeleteOverseasPlan(plan) : undefined;
        const onGrant = (round: CreditRound) => handleGrantRound(plan, round);
        const onUsage = (round: CreditRound) => handleOpenUsagePopup(plan, round);
        switch (plan.paymentMethod) {
            case 'GA_CONTRACT':
                return <ContractPlanCard plan={plan} onUsage={onUsage} onEdit={() => handleEditOverseasPlan(plan)} onDelete={onDelete} onGrant={onGrant}/>;
            case 'BANK_TRANSFER':
                return <ContractPlanCard plan={plan} onUsage={onUsage} onDelete={onDelete} onGrant={onGrant}/>;
            case 'PG_CARD':
            default:
                return <PgCardPlanCard plan={plan} onUsage={onUsage}/>;
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
                <div className={'plan_header_buttons'}>
                    <button type={'button'}
                            className={'btn_service_credit'}
                            onClick={handleOpenServiceCreditPopup}>
                        서비스 크레딧
                    </button>
                    <button type={'button'}
                            className={`btn_add_plan${!canRegisterOverseasPlan ? ' disabled' : ''}`}
                            onClick={handleOpenOverseasPlanPopup}>
                        + 해외영업실행플랜 등록
                    </button>
                </div>
            </div>

            <div ref={planListRef} className={`plan_list ${expanded ? 'expanded' : ''}`}>
                {MOCK_SERVICE_CREDITS.map(sc => (
                    <div key={`sc-${sc.id}`} className={`plan_card service ${getServiceStatus(sc) === 'EXPIRED' ? 'expired' : ''}`}>
                        <ServicePlanCard
                            item={sc}
                            onEdit={canEditService(sc) ? () => handleEditServiceCredit(sc) : undefined}
                            onDelete={canDeleteService(sc) ? () => handleDeleteServiceCredit(sc) : undefined}
                            onUsage={() => handleServiceUsagePopup(sc)}
                        />
                    </div>
                ))}
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
function RoundsTable({rounds, onUsage, onGrant}: { rounds: CreditRound[]; onUsage: (round: CreditRound) => void; onGrant?: (round: CreditRound) => void }) {
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
function ContractPlanCard({plan, onUsage, onEdit, onDelete, onGrant}: { plan: CreditPlan; onUsage: (round: CreditRound) => void; onEdit?: () => void; onDelete?: () => void; onGrant?: (round: CreditRound) => void }) {
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

/* ───────── 서비스 크레딧 카드 ───────── */
function ServicePlanCard({item, onEdit, onDelete, onUsage}: { item: ServiceCreditItem; onEdit?: () => void; onDelete?: () => void; onUsage: () => void }) {
    const status = getServiceStatus(item);
    return (
        <div className={'service_card_row'}>
            <div className={'service_info_section'}>
                <span className={'label'}>플랜구분</span>
                <span className={'value'}>
                    {item.planName}
                    <span className={`plan_badge ${PLAN_STATUS_CLASS[status]}`}>{PLAN_STATUS_LABEL[status]}</span>
                </span>
            </div>
            <div className={'service_info_section period'}>
                <span className={'label'}>이용기간</span>
                <span className={'value'}>{formatDateDot(item.startDate)} ~ {formatDateDot(item.endDate)}</span>
            </div>
            <div className={'service_credit_section'}>
                <span className={'label'}>크레딧</span>
                <div className={'credit_values'}>
                    <span className={'credit_item'}>지급 <span className={'line'}/> <span>{formatNum(item.grantedAmount)}</span></span>
                    <span className={'credit_item'}>사용 <span className={'line'}/> <span>{formatNegated(item.usedAmount)}</span></span>
                    <span className={'credit_item'}>잔여 <span className={'line'}/> <span>{formatNum(item.balance)}</span></span>
                    {item.expiredAmount > 0 && (
                        <span className={'credit_item'}>소멸 <span className={'line'}/> <span>{formatNegated(item.expiredAmount)}</span></span>
                    )}
                    <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                </div>
            </div>
            {(onEdit || onDelete) && (
                <div className={'service_actions'}>
                    {onEdit && (
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
            )}
        </div>
    );
}

/* ───────── PG 카드결제 카드 ───────── */
function PgCardPlanCard({plan, onUsage}: { plan: CreditPlan; onUsage: (round: CreditRound) => void }) {
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
