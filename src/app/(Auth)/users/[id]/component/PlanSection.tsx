'use client';

import {useMemo, useRef, useState} from "react";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup, {OverseasPlanFormData} from "@/app/(Auth)/users/[id]/component/OverseasPlanPopup";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import ContractPlanCard from "@/app/(Auth)/users/[id]/component/ContractPlanCard";
import PgCardPlanCard from "@/app/(Auth)/users/[id]/component/PgCardPlanCard";
import CreditStatusSection from "@/app/(Auth)/users/[id]/component/CreditStatusSection";
import {CreditPlan, CreditRound, getPlanStatus, sortByCreatedDesc} from "@/app/(Auth)/users/[id]/component/planShared";
import {CreditSummaryType} from "@/types/user/user";
import callApi from "@/utill/apiRequest";

export type {
    PaymentMethod,
    PlanStatus,
    RoundStatus,
    CreditType,
    CreditRound,
    CreditPlan,
} from "@/app/(Auth)/users/[id]/component/planShared";

interface Props {
    userId: string;
    initialPlans: CreditPlan[];
    creditSummary: CreditSummaryType | null;
}

const parseAmount = (s: string) => Number((s || '').replace(/,/g, '')) || 0;

const buildCreatePayload = (data: OverseasPlanFormData) => {
    const isGeneral = data.planType === 'GENERAL';
    if (isGeneral) {
        return {
            planName: data.planName,
            startDate: data.planStartDate,
            endDate: data.planEndDate || null,
            months: 1,
            contractAmount: parseAmount(data.contractAmount) || null,
            paymentMethod: 'BANK_TRANSFER',
            paymentMethodName: data.contractMethod || null,
            contractDate: data.contractDate || null,
            monthlyCredit: data.totalCredit,
            managerGa: null,
            managerTp: null,
        };
    }
    return {
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
    };
};

// 수정은 startDate 변경 불가 (명세 참조)
const buildEditPayload = (data: OverseasPlanFormData) => {
    const isGeneral = data.planType === 'GENERAL';
    if (isGeneral) {
        return {
            planName: data.planName,
            startDate: data.planStartDate,
            endDate: data.planEndDate || null,
            months: 1,
            monthlyCredit: data.totalCredit,
            contractAmount: parseAmount(data.contractAmount) || null,
            paymentMethod: 'BANK_TRANSFER',
            paymentMethodName: data.contractMethod || null,
            contractDate: data.contractDate || null,
            managerGa: null,
            managerTp: null,
        };
    }
    return {
        planName: '해외영업실행',
        months: data.planMonths,
        monthlyCredit: parseAmount(data.monthlyCredit),
        contractAmount: parseAmount(data.contractAmount),
        paymentMethod: 'GA_CONTRACT',
        paymentMethodName: data.contractMethod,
        contractDate: data.contractDate,
        managerGa: data.managerGA,
        managerTp: data.managerTP,
    };
};

export default function PlanSection({userId, initialPlans, creditSummary}: Props) {
    const {addPopup} = usePopupStore();
    const [plans, setPlans] = useState<CreditPlan[]>(initialPlans);
    const [summary, setSummary] = useState<CreditSummaryType | null>(creditSummary);
    const [visiblePlans] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const planListRef = useRef<HTMLDivElement>(null);

    // 즉시 지급 등으로 크레딧이 변동되면 회원 상세를 다시 받아 크레딧 현황을 동기화한다
    const refreshSummary = async () => {
        const res = await callApi(`/api/admin/members/users/${userId}`, {method: 'GET', credentials: 'include'});
        if (res.result && res.data) {
            const user = (res.data as {user?: {creditSummary?: CreditSummaryType | null}}).user;
            setSummary(user?.creditSummary ?? null);
        }
    };

    // 플랜이 없거나, 가장 최근(createdAt) 플랜이 만료된 경우에만 신규 등록 가능
    const canRegisterOverseasPlan = useMemo(() => {
        if (plans.length === 0) return true;
        const lastPlan = sortByCreatedDesc(plans)[0];
        return getPlanStatus(lastPlan) === 'EXPIRED';
    }, [plans]);

    const handleOpenUsagePopup = async (plan: CreditPlan, round: CreditRound) => {
        const endpoint = `/api/admin/members/users/${userId}/credit-plans/${plan.id}/rounds/${round.id}/transactions`;
        const res = await callApi(`${endpoint}?page=0&size=10`, {method: 'GET', credentials: 'include'});
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup endpoint={endpoint} initialData={initialData}/>);
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
            await refreshSummary();
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
                await refreshSummary();
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
                await refreshSummary();
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
            userId={userId}
            onCreditChange={refreshSummary}
            initialData={{
                planType: plan.paymentMethod === 'GA_CONTRACT' ? 'OVERSEAS' : 'GENERAL',
                planName: plan.planName,
                planStartDate: plan.startDate,
                planEndDate: plan.endDate ?? '',
                planMonths: plan.months ?? plan.rounds.length ?? 1,
                totalCredit: plan.rounds.reduce((sum, r) => sum + (r.grantedAmount ?? 0), 0),
                contractAmount: plan.contractAmount ? formatNumberWithComma(plan.contractAmount) : '',
                contractMethod: plan.paymentMethodName ?? (plan.paymentMethod === 'GA_CONTRACT' ? 'GA 계약' : ''),
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
                const isGeneral = data.planType === 'GENERAL';
                const originalCredit = plan.rounds.reduce((sum, r) => sum + (r.grantedAmount ?? 0), 0);
                const diff = data.totalCredit - originalCredit;

                // 커스텀 플랜: 크레딧 차이가 있으면 grant/deduct API 먼저 호출
                if (isGeneral && diff !== 0) {
                    const creditEndpoint = diff > 0
                        ? `/api/admin/members/users/${userId}/credits/grant`
                        : `/api/admin/members/users/${userId}/credits/deduct`;
                    const creditBody = diff > 0
                        ? {amount: diff, expireDate: null}
                        : {amount: Math.abs(diff)};
                    const creditRes = await callApi(creditEndpoint, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        credentials: 'include',
                        body: JSON.stringify(creditBody),
                    });
                    if (!creditRes.result) {
                        addPopup(<AlertComponent alertType={'alert'} infoContent={creditRes.message || '크레딧 변경에 실패했습니다.'}/>);
                        return;
                    }
                }

                const res = await callApi(`/api/admin/members/users/${userId}/credit-plans/${plan.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(buildEditPayload(data)),
                });
                if (res.result && res.data) {
                    const updated = res.data as CreditPlan;
                    setPlans(prev => sortByCreatedDesc(prev.map(p => p.id === updated.id ? updated : p)));
                    await refreshSummary();
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
                return <ContractPlanCard plan={plan} onUsage={onUsage} onEdit={() => handleEditOverseasPlan(plan)} onDelete={onDelete} onGrant={onGrant}/>;
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
            <CreditStatusSection userId={userId} summary={summary}/>

            <div className={'plan_header'}>
                <div className={'section_title'}>
                    <span className={'admin_icon arrow_icon'}/>
                    플랜 상세정보
                </div>
                <div className={'plan_header_buttons'}>
                    <button type={'button'}
                            className={`btn_add_plan${!canRegisterOverseasPlan ? ' disabled' : ''}`}
                            onClick={handleOpenOverseasPlanPopup}>
                        + 플랜 등록
                    </button>
                </div>
            </div>

            <div ref={planListRef} className={`plan_list ${expanded ? 'expanded' : ''}`}>
                {/*<ServiceCreditSection userId={userId} activePlanName={activePlanName}/>*/}
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
