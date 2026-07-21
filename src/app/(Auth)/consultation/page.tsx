import '@/style/contact.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ConsultationPage, {ConsultationListResponse} from "@/app/(Auth)/consultation/component/ConsultationPage";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: ConsultationListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    try {
        const res = await callApi(`/api/admin/consultations?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as ConsultationListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <ConsultationPage initialData={initialData} />;
}
