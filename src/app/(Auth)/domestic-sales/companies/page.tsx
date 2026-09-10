import '@/style/contact.scss'
import '@/style/domestic-sales.scss'
import CompanyListPage from "@/app/(Auth)/domestic-sales/companies/component/CompanyListPage";
import {loadCompanyList, parseCompanyFilters} from "@/app/(Auth)/domestic-sales/companies/component/companyList";
import {loadTags} from "@/app/(Auth)/domestic-sales/component/tagLoader";

export default async function Page({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const filters = parseCompanyFilters(await searchParams);
    const [data, tags] = await Promise.all([loadCompanyList(filters), loadTags()]);

    return <CompanyListPage data={data} filters={filters} tags={tags}/>;
}
