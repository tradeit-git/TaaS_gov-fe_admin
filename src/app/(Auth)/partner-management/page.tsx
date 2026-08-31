import '@/style/partner.scss'
import PartnerPage from "@/app/(Auth)/partner-management/component/PartnerPage";

// PoC 는 poc-management 로 분리했으므로 이 목록은 BASE 만 다룬다. 화면에 카테고리 필터는 두지 않는다.
export default async function Page() {
    return <PartnerPage category={'BASE'}/>;
}
