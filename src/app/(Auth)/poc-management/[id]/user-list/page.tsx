import '@/style/partner.scss'
import '@/style/partner-dashboard-v2.scss'
import UserListPage from "@/app/(Auth)/partner-management/[id]/user-list/component/UserListPage";

interface Props {
    params: Promise<{ id: string }>;
}

// 가입명단/활동현황 화면은 협회제휴관리와 동일하다. 상단 표기와 "목록으로" 만 PoC 쪽을 가리킨다.
export default async function Page({params}: Props) {
    const {id} = await params;

    return <UserListPage partnerId={id} title={'PoC 관리'} basePath={'/poc-management'}/>;
}
