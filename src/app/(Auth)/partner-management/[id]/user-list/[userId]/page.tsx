import CompanyDetailPage from "@/app/(Auth)/users/[id]/component/CompanyDetailPage";
import {CreditPlan} from "@/app/(Auth)/users/[id]/component/PlanSection";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ApiUserDetailResponse} from "@/app/(Auth)/client/[id]/component/ClientDetailPage";
import {UserSchema} from "@/types/user/user";

interface Props {
    params: Promise<{ id: string; userId: string }>;
}

// 협회제휴 가입명단 → 회원 상세. users/[id]와 동일 API(/api/admin/members/users/{userId}) 재사용.
export default async function Page({params}: Props) {
    const {id, userId} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/users/${userId}`, options);
    if (!res.result || !res.data) redirect(`/partner-management/${id}/user-list`);

    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);
    const initialPlans = (body.creditPlans as unknown as CreditPlan[] | undefined) ?? [];

    return <CompanyDetailPage id={userId} initialUser={initialUser} initialPlans={initialPlans}/>;
}
