import '@/style/client.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ClientPage from "@/app/(Auth)/client/component/ClientPage";
import {UserListResponse} from "@/app/(Auth)/client/component/ClientPage";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: UserListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    try {
        const res = await callApi(`/api/admin/clients?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as UserListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <ClientPage initialData={initialData}/>;
}
