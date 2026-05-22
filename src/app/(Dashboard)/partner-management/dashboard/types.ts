// 대시보드 API 응답 타입 (doc/api_admin_partner_dashboard.md 참조)

export interface PartnerInfo {
    partnerName: string;
    bonusCredit: number;
    startDate: string;
    endDate: string;
}

export interface Metric {
    value: number;
    growthRate: number | null; // 저번주 대비 상승률(%), 저번주 0이면 null
}

export interface PlanUsage {
    planName: string;
    count: number;
}

export interface DashboardSummary {
    signups: Metric;
    payments: Metric;
    amount: Metric;
    planUsage: PlanUsage[];
}

export interface DailySignup {
    day: number;
    count: number;
}

export interface MemberRow {
    id: number;
    companyName: string;
    loginId: string;
    name: string;
    department: string;
    position: string;
    contact: string;
    createdAt: string;
}

export interface MembersResponse {
    content: MemberRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export const EMPTY_MEMBERS: MembersResponse = {
    content: [],
    totalElements: 0,
    totalPages: 1,
    currentPage: 1,
};
