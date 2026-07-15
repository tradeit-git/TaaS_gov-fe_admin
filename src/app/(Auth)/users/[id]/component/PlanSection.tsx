'use client';

import {useMemo, useState} from "react";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup, {OverseasPlanFormData} from "@/app/(Auth)/users/[id]/component/OverseasPlanPopup";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import CreditStatusSection from "@/app/(Auth)/users/[id]/component/CreditStatusSection";
import {CreditPlan, CreditRound, formatNum, getPlanStatus, sortByCreatedDesc} from "@/app/(Auth)/users/[id]/component/planShared";
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

const getPaymentLabel = (method: string | null) => {
    switch (method) {
        case 'GA_CONTRACT': return '하이브리드';
        case 'BANK_TRANSFER': return '커스텀';
        case 'PG_CARD': return 'PG';
        default: return '보너스';
    }
};

const getStatusLabel = (plan: CreditPlan) => {
    const s = getPlanStatus(plan);
    switch (s) {
        case 'ACTIVE': return {label: '진행', className: 'badge_active'};
        case 'SCHEDULED': return {label: '예정', className: 'badge_scheduled'};
        case 'EXPIRED': return {label: '만료', className: 'badge_expired'};
    }
};

const getPlanCreditSummary = (plan: CreditPlan) => {
    let granted = 0, used = 0, balance = 0, expired = 0;
    for (const r of plan.rounds) {
        granted += r.grantedAmount ?? 0;
        used += r.usedAmount ?? 0;
        balance += r.balance ?? 0;
        expired += r.expiredAmount ?? 0;
    }
    return {granted, used, balance, expired};
};

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

    const refreshSummary = async () => {
        const res = await callApi(`/api/admin/members/users/${userId}`, {method: 'GET', credentials: 'include'});
        if (res.result && res.data) {
            const user = (res.data as {user?: {creditSummary?: CreditSummaryType | null}}).user;
            setSummary(user?.creditSummary ?? null);
        }
    };

    const canRegisterOverseasPlan = useMemo(() => {
        if (plans.length === 0) return true;
        const lastPlan = sortByCreatedDesc(plans)[0];
        return getPlanStatus(lastPlan) === 'EXPIRED';
    }, [plans]);

    const handleOpenUsagePopup = async (plan: CreditPlan) => {
        // 첫 번째 라운드의 거래내역 조회
        const round = plan.rounds[0];
        if (!round) return;
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

    const canDeletePlan = (plan: CreditPlan) =>
        plan.rounds.length === 0 || plan.rounds.every(r => (r.status ?? 'SCHEDULED') === 'SCHEDULED');

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
            planStatus={getPlanStatus(plan)}
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

                if (isGeneral && diff !== 0 && getPlanStatus(plan) === 'ACTIVE') {
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

                const putPayload = buildEditPayload(data);
                console.log('[플랜수정] PUT 요청 payload:', putPayload);
                const res = await callApi(`/api/admin/members/users/${userId}/credit-plans/${plan.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(putPayload),
                });
                console.log('[플랜수정] PUT 응답:', res);
                if (res.result && res.data) {
                    const updated = res.data as CreditPlan;
                    console.log('[플랜수정] 라운드 상태:', updated.rounds.map(r => ({id: r.id, status: r.status, scheduledDate: r.scheduledDate})));
                    setPlans(prev => sortByCreatedDesc(prev.map(p => p.id === updated.id ? updated : p)));
                    await refreshSummary();
                    addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
                } else {
                    addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '수정에 실패했습니다.'}/>);
                }
            }}
        />);
    };

    const handleManagePlan = (plan: CreditPlan) => {
        if (plan.paymentMethod === 'PG_CARD') return;
        handleEditOverseasPlan(plan);
    };

    const sortedPlans = useMemo(() => sortByCreatedDesc(plans), [plans]);

    return (
        <div className={'company_detail_right'}>
            <CreditStatusSection userId={userId} summary={summary}/>

            <div className={'plan_table_section'}>
                <div className={'plan_table_header'}>
                    <div className={'section_title'}>
                        <span className={'admin_icon arrow_icon'}/>
                        유료플랜 이용 현황
                    </div>
                    <button type={'button'}
                            className={`btn_add_plan${!canRegisterOverseasPlan ? ' disabled' : ''}`}
                            onClick={handleOpenOverseasPlanPopup}>
                        플랜등록
                    </button>
                </div>

                <div className={'table_wrap'}>
                    <table className={'plan_usage_table'}>
                        <colgroup>
                            <col style={{width: '6%'}}/>
                            <col style={{width: '7%'}}/>
                            <col style={{width: '10%'}}/>
                            <col style={{width: '20%'}}/>
                            <col style={{width: '10%'}}/>
                            <col style={{width: '14%'}}/>
                            <col style={{width: '10%'}}/>
                            <col style={{width: '10%'}}/>
                            <col style={{width: '6%'}}/>
                        </colgroup>
                        <thead>
                        <tr>
                            <th>상태</th>
                            <th>구분</th>
                            <th>플랜명</th>
                            <th>이용기간</th>
                            <th>지급</th>
                            <th>사용</th>
                            <th>잔여</th>
                            <th>소멸</th>
                            <th>비고</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedPlans.length === 0 ? (
                            <tr>
                                <td colSpan={9} className={'empty'}>등록된 플랜이 없습니다.</td>
                            </tr>
                        ) : sortedPlans.map(plan => {
                            const status = getStatusLabel(plan);
                            const credit = getPlanCreditSummary(plan);
                            return (
                                <tr key={plan.id}>
                                    <td><span className={`plan_status_badge ${status.className}`}>{status.label}</span></td>
                                    <td>{getPaymentLabel(plan.paymentMethod)}</td>
                                    <td>{plan.planName}</td>
                                    <td>{formatDateDot(plan.startDate)} ~ {formatDateDot(plan.endDate)}</td>
                                    <td className={'num'}>{formatNum(credit.granted)}</td>
                                    <td className={'num used_cell'}>
                                        {formatNum(credit.used)}
                                        <button type={'button'} className={'btn_usage_inline'} onClick={() => handleOpenUsagePopup(plan)}>내역</button>
                                    </td>
                                    <td className={'num'}>{formatNum(credit.balance)}</td>
                                    <td className={'num'}>{formatNum(credit.expired)}</td>
                                    <td>
                                        {plan.paymentMethod !== 'PG_CARD' ? (
                                            <button type={'button'} className={'btn_manage'} onClick={() => handleManagePlan(plan)}>관리</button>
                                        ) : (
                                            <span className={'text_muted'}>-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
