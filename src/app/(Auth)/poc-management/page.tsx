import '@/style/partner.scss'
import PartnerPage from "@/app/(Auth)/partner-management/component/PartnerPage";
import {loadPartnerList, parsePartnerFilters} from "@/app/(Auth)/partner-management/component/partnerList";

// PoC 전용 목록. 화면에 카테고리 필터를 두지 않고 페이지가 category=POC 를 고정으로 넘긴다.
export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const filters = parsePartnerFilters(await searchParams);
    const data = await loadPartnerList(filters, 'POC');

    return <PartnerPage data={data} filters={filters} category={'POC'} title={'PoC 관리'} basePath={'/poc-management'}/>;
}
