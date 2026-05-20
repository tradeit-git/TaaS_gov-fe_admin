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

/* ───────── 상태 뱃지 ───────── */
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
    SCHEDULED: '예정',
    ACTIVE: '이용중',
    EXPIRED: '이용만료',
};

export const PLAN_STATUS_CLASS: Record<PlanStatus, string> = {
    SCHEDULED: 'badge_scheduled',
    ACTIVE: 'badge_active',
    EXPIRED: 'badge_expired',
};

export const ROUND_STATUS_LABEL: Record<RoundStatus, string> = {
    SCHEDULED: '예정',
    ACTIVE: '진행',
    EXPIRED: '만료',
    EXHAUSTED: '소진',
};

export const ROUND_STATUS_CLASS: Record<RoundStatus, string> = {
    SCHEDULED: 'badge_scheduled',
    ACTIVE: 'badge_progress',
    EXPIRED: 'badge_expired',
    EXHAUSTED: 'badge_completed',
};

/* ───────── 포맷 헬퍼 ───────── */
export const formatNum = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    return n.toLocaleString();
};

export const formatNegated = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    if (n === 0) return '0';
    return (-n).toLocaleString();
};

export const formatAmount = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '-';
    return `${n.toLocaleString()}원(vat포함)`;
};

export const formatPaymentMethodLabel = (plan: CreditPlan) => {
    const base = plan.paymentMethodName || '-';
    if (plan.paymentMethod === 'PG_CARD' && plan.billingDay) {
        return `${base} (매월 ${plan.billingDay}일)`;
    }
    return base;
};

export const todayISODate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getPlanStatus = (plan: CreditPlan): PlanStatus => {
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

export const sortByCreatedDesc = (list: CreditPlan[]) =>
    [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
