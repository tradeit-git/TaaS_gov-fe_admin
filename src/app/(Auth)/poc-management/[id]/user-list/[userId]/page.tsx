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

// PoC 가입명단 → 회원 상세. 협회제휴 쪽과 동일 화면이며 실패 시 돌아갈 목록만 다르다.
export default async function Page({params}: Props) {
    const {id, userId} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/users/${userId}`, options);
    if (!res.result || !res.data) redirect(`/poc-management/${id}/user-list`);

    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);
    const initialPlans = (body.creditPlans as unknown as CreditPlan[] | undefined) ?? [];

    return <CompanyDetailPage id={userId} initialUser={initialUser} initialPlans={initialPlans}/>;
}
