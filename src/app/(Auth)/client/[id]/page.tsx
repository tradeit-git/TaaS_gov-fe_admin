import {redirect} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {UserSchema} from "@/types/user/user";
import ClientDetailPage, {ApiUserDetailResponse} from "@/app/(Auth)/client/[id]/component/ClientDetailPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/clients/${id}`, options);

    if (!res.result || !res.data) {
        redirect('/client');
    }


    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);
    const initialCreditPlans = body.creditPlans || [];
    console.log(body);

    return <ClientDetailPage id={id} initialUser={initialUser} initialCreditPlans={initialCreditPlans}/>;
}
