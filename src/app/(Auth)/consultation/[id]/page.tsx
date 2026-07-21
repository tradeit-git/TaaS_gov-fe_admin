import '@/style/contact.scss'
import {redirect} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import ConsultationDetailPage from "@/app/(Auth)/consultation/[id]/component/ConsultationDetailPage";
import {ConsultationRow} from "@/app/(Auth)/consultation/component/ConsultationPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/consultations/${id}`, options);
    if (!res.result || !res.data) redirect('/consultation');

    return <ConsultationDetailPage id={id} initialDetail={res.data as ConsultationRow}/>;
}
