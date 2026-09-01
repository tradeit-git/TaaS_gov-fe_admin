import '@/style/partner.scss'
import PartnerPage from "@/app/(Auth)/partner-management/component/PartnerPage";
import {loadPartnerList, parsePartnerFilters} from "@/app/(Auth)/partner-management/component/partnerList";

// PoC 는 poc-management 로 분리했으므로 이 목록은 BASE 만 다룬다. 화면에 카테고리 필터는 두지 않는다.
export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const filters = parsePartnerFilters(await searchParams);
    const data = await loadPartnerList(filters, 'BASE');

    return <PartnerPage data={data} filters={filters} category={'BASE'}/>;
}
