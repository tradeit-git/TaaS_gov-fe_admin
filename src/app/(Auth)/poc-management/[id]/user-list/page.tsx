import '@/style/partner.scss'
import '@/style/partner-dashboard-v2.scss'
import UserListPage from "@/app/(Auth)/partner-management/[id]/user-list/component/UserListPage";
import {
    loadActivity,
    loadMembers,
    loadPartnerInfo,
    parseUserListFilters,
} from "@/app/(Auth)/partner-management/[id]/user-list/userList";

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | undefined>>;
}

// 가입명단/활동현황 화면은 협회제휴관리와 동일하다. 상단 표기와 "목록으로" 만 PoC 쪽을 가리킨다.
export default async function Page({params, searchParams}: Props) {
    const {id} = await params;
    const filters = parseUserListFilters(await searchParams);

    // 보이는 탭만 조회한다.
    const [partner, members, activity] = await Promise.all([
        loadPartnerInfo(id),
        filters.tab === 'members' ? loadMembers(id, filters) : null,
        filters.tab === 'activity' ? loadActivity(id, filters) : null,
    ]);

    return <UserListPage partnerId={id} partner={partner} filters={filters}
                         members={members} activity={activity}
                         title={'PoC 관리'} basePath={'/poc-management'}/>;
}
