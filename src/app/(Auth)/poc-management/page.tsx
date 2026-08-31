import '@/style/partner.scss'
import PartnerPage from "@/app/(Auth)/partner-management/component/PartnerPage";

// PoC 전용 목록. 화면에 카테고리 필터를 두지 않고 페이지가 category=POC 를 고정으로 넘긴다.
export default async function Page() {
    return <PartnerPage category={'POC'} title={'PoC 관리'} basePath={'/poc-management'}/>;
}
