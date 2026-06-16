import '@/style/contact.scss';
import UserProjectManagementPage, {UserProjectListResponse} from "@/app/(Auth)/managed-users/component/UserProjectManagementPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: UserProjectListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };
    try {
        const res = await callApi(`/api/admin/managed-users?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as UserProjectListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <UserProjectManagementPage initialData={initialData} />;
}
