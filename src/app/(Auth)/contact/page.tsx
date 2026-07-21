import '@/style/contact.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ContactPage from "@/app/(Auth)/contact/component/ContactPage";
import {InquiryListResponse} from "@/app/(Auth)/contact/component/ContactPage";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: InquiryListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
        unreadCount: 0,
    };

    try {
        const res = await callApi(`/api/admin/inquiries?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as InquiryListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <ContactPage initialData={initialData} />;
}
