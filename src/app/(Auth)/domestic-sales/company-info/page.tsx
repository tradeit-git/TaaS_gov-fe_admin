import '@/style/contact.scss'
import '@/style/domestic-sales.scss'
import MasterListPage from "@/app/(Auth)/domestic-sales/company-info/component/MasterListPage";
import {loadMasterList, parseMasterFilters} from "@/app/(Auth)/domestic-sales/company-info/component/masterList";
import {loadTags} from "@/app/(Auth)/domestic-sales/component/tagLoader";

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const filters = parseMasterFilters(await searchParams);
    const [data, tags] = await Promise.all([loadMasterList(filters), loadTags()]);

    return <MasterListPage data={data} filters={filters} tags={tags}/>;
}
