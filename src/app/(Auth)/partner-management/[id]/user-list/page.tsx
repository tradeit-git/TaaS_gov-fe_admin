import '@/style/partner.scss'
import UserListPage, {PartnerUser} from "@/app/(Auth)/partner-management/[id]/user-list/component/UserListPage";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/PartnerPage";

interface Props {
    params: Promise<{ id: string }>;
}

const MOCK_PARTNERS: Record<string, PartnerRow> = {
    '1': {
        id: 1,
        partnerKey: 'mss2026',
        partnerName: '서울중소기업벤처 2026',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        creditAmount: 30,
        usedCount: 1250,
        createdAt: '2025-01-01',
    },
    '2': {
        id: 2,
        partnerKey: 'btp2026',
        partnerName: '부산테크노파크 2026',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        creditAmount: 10,
        usedCount: 3480,
        createdAt: '2026-01-15',
    },
    '3': {
        id: 3,
        partnerKey: 'ggfta',
        partnerName: '경기북서부FTA 통상진흥센터',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        creditAmount: 20,
        usedCount: 0,
        createdAt: '2026-05-10',
    },
};

const MOCK_USERS: PartnerUser[] = [
    {
        id: 1,
        companyName: '이노베이션워크스',
        loginId: 'limsj14@daum.net',
        name: '서예린',
        department: '채널영업팀',
        position: '과장',
        phone: '010-0000-0000',
        createdAt: '2026-04-05',
    },
    {
        id: 2,
        companyName: '이노베이션워크스',
        loginId: 'limsj14@daum.net',
        name: '서예린',
        department: '채널영업팀',
        position: '과장',
        phone: '010-0000-0000',
        createdAt: '2026-04-08',
    },
    {
        id: 3,
        companyName: '이노베이션워크스',
        loginId: 'limsj14@daum.net',
        name: '서예린',
        department: '채널영업팀',
        position: '과장',
        phone: '010-0000-0000',
        createdAt: '2026-04-10',
    },
];

export default async function Page({params}: Props) {
    const {id} = await params;
    const partner = MOCK_PARTNERS[id] || MOCK_PARTNERS['2'];

    return <UserListPage partnerId={id} partner={partner} initialData={MOCK_USERS}/>;
}
