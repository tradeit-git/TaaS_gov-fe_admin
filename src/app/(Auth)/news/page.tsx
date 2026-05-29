import '@/style/contact.scss'
import NewsPage, {NewsListResponse} from "@/app/(Auth)/news/component/NewsPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: NewsListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 1,
    };
    try {
        const res = await callApi(`/api/admin/news/list?page=1&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as NewsListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <NewsPage initialData={initialData}/>;
}
