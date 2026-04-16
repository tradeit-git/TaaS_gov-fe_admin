import {redirect} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ContactDetailPage from "@/app/(Auth)/contact/[id]/component/ContactDetailPage";
import {InquiryRow} from "@/app/(Auth)/contact/component/ContactPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/inquiries/${id}`, options);

    if (!res.result || !res.data) {
        redirect('/contact');
    }

    const initialDetail = res.data as InquiryRow;

    return <ContactDetailPage id={id} initialDetail={initialDetail}/>;
}
