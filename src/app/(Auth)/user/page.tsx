import Link from "next/link";
import React from "react";
import '@/style/member_user.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import PageContent, {UserListResponse} from "@/app/(Auth)/user/components/PageContent";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: UserListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    try {
        const res = await callApi(`/api/admin/members/users?page=0&size=15`, options);
        if (res.result && res.data) {
            initialData = res.data as UserListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <section className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>가입계정</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/user'}>가입계정</Link></li>
                </ul>
            </div>
            <PageContent initialData={initialData}/>
        </section>
    );
}
