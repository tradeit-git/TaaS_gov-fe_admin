import CompanyDetailPage, {CompanyDetailData} from "@/app/(Auth)/company-management/[id]/component/CompanyDetailPage";

// 목업 데이터
const MOCK_DETAIL: CompanyDetailData = {
    account: {
        id: 1,
        affiliationName: '대구무역협회 2026',
        loginId: 'asdfasdfasfd@gmail.com',
        password: 'tradeit21@',
        name: '윤태준',
        phone: '01015432185',
        companyName: '이노베이션워크스',
        department: '파트너영업팀',
        position: '차장',
        createdAt: '2026-04-01',
        lastLoginAt: '2026-04-01',
    },
    plans: [
        {
            id: 1,
            type: 'overseas',
            planName: '해외영업실행',
            status: 'active',
            contractStartDate: '2026-01-01',
            contractEndDate: '2026-06-30',
            contractAmount: '11,940,000원(vat포함)',
            contractMethod: 'GA계약',
            contractDate: '2025-12-15',
            credits: [
                { id: 1, status: 'completed', startDate: '2026-01-01', endDate: '2026-01-31', creditGrant: 30000, creditUsed: -30000, creditRemain: 0 },
                { id: 2, status: 'completed', startDate: '2026-02-01', endDate: '2026-02-28', creditGrant: 30000, creditUsed: -26990, creditRemain: 3010 },
                { id: 3, status: 'completed', startDate: '2026-03-01', endDate: '2026-03-31', creditGrant: 30000, creditUsed: -28800, creditRemain: 1200 },
                { id: 4, status: 'completed', startDate: '2026-04-01', endDate: '2026-04-30', creditGrant: 30000, creditUsed: -30000, creditRemain: 0 },
                { id: 5, status: 'in_progress', startDate: '2026-05-01', endDate: '2026-05-31', creditGrant: 30000, creditUsed: -10000, creditRemain: 20000 },
                { id: 6, status: 'scheduled', startDate: '2026-06-01', endDate: '2026-06-30', creditGrant: null, creditUsed: null, creditRemain: null },
            ],
        },
        {
            id: 2,
            type: 'standard',
            planName: '개인',
            status: 'expired',
            usageStartDate: '2025-01-01',
            usageEndDate: '2025-05-31',
            paymentAmount: '49,000원(vat포함)',
            paymentMethod: '정기카드결제 (매월18일)',
            paymentDate: '2025-01-18T14:30:00',
            creditSummary: {
                grant: 5000,
                used: -1000,
                remain: 4000,
                expired: -4000,
            },
        },
        {
            id: 3,
            type: 'standard',
            planName: '팀',
            status: 'expired',
            usageStartDate: '2024-07-01',
            usageEndDate: '2024-12-31',
            paymentAmount: '149,000원(vat포함)',
            paymentMethod: '정기카드결제 (매월1일)',
            paymentDate: '2024-07-01T10:15:00',
            creditSummary: {
                grant: 15000,
                used: -12000,
                remain: 3000,
                expired: -3000,
            },
        },
        {
            id: 4,
            type: 'standard',
            planName: '개인',
            status: 'expired',
            usageStartDate: '2024-01-01',
            usageEndDate: '2024-06-30',
            paymentAmount: '49,000원(vat포함)',
            paymentMethod: '정기카드결제 (매월18일)',
            paymentDate: '2024-01-18T09:00:00',
            creditSummary: {
                grant: 5000,
                used: -4500,
                remain: 500,
                expired: -500,
            },
        },
    ],
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    // TODO: API 연동 시 아래 주석 해제
    // const options = await getServerRequestOptions();
    // const res = await callApi(`/api/admin/members/companies/${id}`, options);
    // if (!res.result || !res.data) redirect('/company-management');
    // const detail = res.data as CompanyDetailData;

    return <CompanyDetailPage id={id} initialData={MOCK_DETAIL}/>;
}