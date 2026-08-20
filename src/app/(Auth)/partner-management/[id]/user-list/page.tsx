import '@/style/partner.scss'
import '@/style/partner-dashboard-v2.scss'
import UserListPage from "@/app/(Auth)/partner-management/[id]/user-list/component/UserListPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    return <UserListPage partnerId={id}/>;
}
