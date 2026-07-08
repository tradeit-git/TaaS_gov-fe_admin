import Link from "next/link";
import React from "react";
import PageContent from "@/app/(Auth)/users/component/[userId]/component/PageContents";
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";

type paramType = Promise<{userId : number}>;
export default async function Page (props : {params : paramType}){

    const {userId} = await props.params;
    const options = await getServerRequestOptions();

    let companyName = '';
    let initialAnalysis = null;

    const [userApiRes, analysisApiRes] = await Promise.all([
        callApi(`/api/admin/members/users/${userId}`, options),
        callApi(`/api/admin/company-analysis/user/${userId}`, options),
    ]);

    if (userApiRes.result && userApiRes.data) {
        const body = userApiRes.data as {user?: {companyName?: string}};
        companyName = body.user?.companyName || '';
    }
    if (analysisApiRes.result && analysisApiRes.data) {
        initialAnalysis = analysisApiRes.data;
    }

    return (
        <section className="analysis">
            <div className={'page_start_box'}>
                <h3 className={'title'}>분석입력</h3>
                <ul className={'breadcrumb'}>
                    <li><Link href={'/public'}>home</Link></li>
                    <li><span className={'icon_admin icon_next'}></span></li>
                    <li>데이터관리</li>
                    <li><span className={'icon_admin icon_next'}></span></li>
                    <li>기업전략분석</li>
                    <li><span className={'icon_admin icon_next'}></span></li>
                    <li><Link href={'/project/strategy/analysisInput'}>분석입력</Link></li>
                </ul>
            </div>
            <PageContent companyName={companyName} userId={userId} initialAnalysis={initialAnalysis} />
        </section>
    )
}
