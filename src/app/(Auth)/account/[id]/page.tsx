import Link from "next/link";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ApiUserDetailResponse} from "@/app/(Auth)/client/[id]/component/ClientDetailPage";
import {UserSchema} from "@/types/user/user";
import AccountInfoSection from "@/app/(Auth)/components/AccountInfoSection";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    const options = await getServerRequestOptions();
    const res = await callApi(`/api/admin/members/demo-users/${id}`, options);
    if (!res.result || !res.data) redirect('/account');

    const body = res.data as ApiUserDetailResponse;
    const initialUser = UserSchema.parse(body.user);

    return (
        <div className={'admin_page company_detail_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/account'}>내부영업계정</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>

            <div className={'company_detail_layout'}>
                <AccountInfoSection user={initialUser} memberType={'demo-users'}/>
            </div>
        </div>
    );
}
