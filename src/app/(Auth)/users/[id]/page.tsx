import CompanyDetailPage from "@/app/(Auth)/users/[id]/component/CompanyDetailPage";
import {CreditPlan} from "@/app/(Auth)/users/[id]/component/PlanSection";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ApiUserDetailResponse} from "@/app/(Auth)/client/[id]/component/ClientDetailPage";
import {UserSchema} from "@/types/user/user";

// 목업 데이터 (플랜) - 3가지 paymentMethod 케이스
const MOCK_PLANS: CreditPlan[] = [
    {
        id: 1,
        status: 'ACTIVE',
        planName: '해외영업실행',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        months: 6,
        paymentMethod: 'GA_CONTRACT',
        paymentMethodName: 'GA 계약',
        billingDay: null,
        contractDate: '2025-12-15',
        contractAmount: 11940000,
        paymentAmount: null,
        paymentDate: null,
        managerGa: '김GA',
        managerTp: '박TP',
        createdAt: '2025-12-15T00:00:00',
        rounds: [
            {id: 11, scheduledDate: '2026-01-01', expireAt: '2026-01-31T23:59:59', grantedAmount: 30000, usedAmount: 30000, balance: 0, expiredAmount: 0, creditType: 'PAID', status: 'EXHAUSTED'},
            {id: 12, scheduledDate: '2026-02-01', expireAt: '2026-02-28T23:59:59', grantedAmount: 30000, usedAmount: 26990, balance: 3010, expiredAmount: 0, creditType: 'PAID', status: 'EXPIRED'},
            {id: 13, scheduledDate: '2026-03-01', expireAt: '2026-03-31T23:59:59', grantedAmount: 30000, usedAmount: 28800, balance: 1200, expiredAmount: 0, creditType: 'PAID', status: 'EXPIRED'},
            {id: 14, scheduledDate: '2026-04-01', expireAt: '2026-04-30T23:59:59', grantedAmount: 30000, usedAmount: 30000, balance: 0, expiredAmount: 0, creditType: 'PAID', status: 'EXHAUSTED'},
            {id: 15, scheduledDate: '2026-05-01', expireAt: '2026-05-31T23:59:59', grantedAmount: 30000, usedAmount: 10000, balance: 20000, expiredAmount: 0, creditType: 'PAID', status: 'ACTIVE'},
            {id: 16, scheduledDate: '2026-06-01', expireAt: '2026-06-30T23:59:59', grantedAmount: null, usedAmount: null, balance: null, expiredAmount: null, creditType: 'PAID', status: 'SCHEDULED'},
        ],
    },
    {
        id: 2,
        status: 'EXPIRED',
        planName: '개인',
        startDate: '2025-01-01',
        endDate: '2025-05-31',
        months: 5,
        paymentMethod: 'PG_CARD',
        paymentMethodName: '정기 카드 결제',
        billingDay: 18,
        contractDate: null,
        contractAmount: null,
        paymentAmount: 49000,
        paymentDate: '2025-01-18T14:30:00',
        managerGa: null,
        managerTp: null,
        createdAt: '2025-01-18T14:30:00',
        rounds: [
            {id: 21, scheduledDate: '2025-01-18', expireAt: '2025-02-17T23:59:59', grantedAmount: 1000, usedAmount: 200, balance: 800, expiredAmount: 800, creditType: 'PAID', status: 'EXPIRED'},
            {id: 22, scheduledDate: '2025-02-18', expireAt: '2025-03-17T23:59:59', grantedAmount: 1000, usedAmount: 300, balance: 700, expiredAmount: 700, creditType: 'PAID', status: 'EXPIRED'},
            {id: 23, scheduledDate: '2025-03-18', expireAt: '2025-04-17T23:59:59', grantedAmount: 1000, usedAmount: 500, balance: 500, expiredAmount: 500, creditType: 'PAID', status: 'EXPIRED'},
            {id: 24, scheduledDate: '2025-04-18', expireAt: '2025-05-17T23:59:59', grantedAmount: 1000, usedAmount: 0, balance: 1000, expiredAmount: 1000, creditType: 'PAID', status: 'EXPIRED'},
            {id: 25, scheduledDate: '2025-05-18', expireAt: '2025-05-31T23:59:59', grantedAmount: 1000, usedAmount: 0, balance: 1000, expiredAmount: 1000, creditType: 'PAID', status: 'EXPIRED'},
        ],
    },
    {
        id: 3,
        status: 'EXPIRED',
        planName: '팀(이관)',
        startDate: '2024-07-01',
        endDate: '2024-12-31',
        months: 6,
        paymentMethod: 'BANK_TRANSFER',
        paymentMethodName: '계좌이체',
        billingDay: null,
        contractDate: '2024-06-25',
        contractAmount: 894000,
        paymentAmount: null,
        paymentDate: null,
        managerGa: '이GA',
        managerTp: '최TP',
        createdAt: '2024-06-25T00:00:00',
        rounds: [
            {id: 31, scheduledDate: '2024-07-01', expireAt: '2024-07-31T23:59:59', grantedAmount: 15000, usedAmount: 12000, balance: 3000, expiredAmount: 3000, creditType: 'PAID', status: 'EXPIRED'},
            {id: 32, scheduledDate: '2024-08-01', expireAt: '2024-08-31T23:59:59', grantedAmount: 15000, usedAmount: 10000, balance: 5000, expiredAmount: 5000, creditType: 'PAID', status: 'EXPIRED'},
        ],
    },
];

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/users/${id}`, options);
    if (!res.result || !res.data) redirect('/users');

    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);
    const initialPlans = (body.creditPlans as unknown as CreditPlan[] | undefined) ?? MOCK_PLANS;

    return <CompanyDetailPage id={id} initialUser={initialUser} initialPlans={initialPlans}/>;
}
