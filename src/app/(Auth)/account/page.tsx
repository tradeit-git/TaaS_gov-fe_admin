import '@/style/partner.scss'
import AccountPage, {AccountListResponse} from "@/app/(Auth)/account/component/AccountPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: AccountListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };
    try {
        const res = await callApi(`/api/admin/members/demo-users?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as AccountListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <AccountPage initialData={initialData}/>;
}
