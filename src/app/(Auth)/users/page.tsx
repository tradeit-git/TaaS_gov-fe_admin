import CompanyManagementPage, {CompanyListResponse} from "@/app/(Auth)/users/component/CompanyManagementPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: CompanyListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };
    try {
        const res = await callApi(`/api/admin/members/users?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as CompanyListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <CompanyManagementPage initialData={initialData} />;
}