import CompanyDetailPage from "@/app/(Auth)/users/[id]/component/CompanyDetailPage";
import {CreditPlan} from "@/app/(Auth)/users/[id]/component/PlanSection";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ApiUserDetailResponse} from "@/app/(Auth)/client/[id]/component/ClientDetailPage";
import {UserSchema} from "@/types/user/user";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/users/${id}`, options);
    if (!res.result || !res.data) redirect('/users');

    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);
    const initialPlans = (body.creditPlans as unknown as CreditPlan[] | undefined) ?? [];

    return <CompanyDetailPage id={id} initialUser={initialUser} initialPlans={initialPlans}/>;
}
