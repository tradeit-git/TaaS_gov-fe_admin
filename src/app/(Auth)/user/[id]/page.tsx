import {redirect} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {UserSchema, UserType} from "@/types/user/user";
import DetailPageContent from "@/app/(Auth)/user/[id]/component/DetailPageContent";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/users/${id}`, options);

    if (!res.result || !res.data) {
        redirect('/user');
    }

    const body = res.data as Record<string, unknown>;
    const userData = (body.user ?? body) as Record<string, unknown>;

    // API credit 필드 → creditSummary 매핑
    if (!userData.creditSummary && (userData.creditTotal !== undefined)) {
        userData.creditSummary = {
            granted: userData.creditTotal ?? 0,
            used: userData.creditUsed ?? 0,
            expired: userData.creditExpired ?? 0,
            balance: userData.creditBalance ?? 0,
        };
    }

    const initialUser: UserType = UserSchema.parse(userData);

    return <DetailPageContent initialUser={initialUser}/>;
}
