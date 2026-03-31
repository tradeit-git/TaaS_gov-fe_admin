import Link from "next/link";
import React from "react";
import callApi from "@/utill/apiRequest";
import {GradeSchema, GradeType} from "@/types/credit/creditInsight";
import {z} from "zod";
import PageContent from "@/app/(Auth)/credits/credit-insight/component/PageContent";
import {getServerRequestOptions} from "@/lib/serverRequest";

export default async function Page() {
    const options = await getServerRequestOptions();

    let grades: GradeType[] = [];
    let services: string[] = [];

    try {
        const [gradeRes, serviceRes] = await Promise.all([
            callApi('/api/admin/credit/insight/grades', options),
            callApi('/api/admin/credit/insight/services', options),
        ]);
        if (gradeRes.result) {
            grades = z.array(GradeSchema).parse(gradeRes.data);
        }
        if (serviceRes.result) {
            services = z.array(z.string()).parse(serviceRes.data);
        }
    } catch (error) {
        console.error("초기 데이터 조회 실패:", error);
    }

    return (
        <section className="credit_insight">
            <div className={'page_start_box'}>
                <h3 className={'title'}>
                    크레딧 인사이트
                </h3>
                <ul className={'breadcrumb'}>
                    <li><Link href={'/public'}>홈</Link></li>
                    <li><span className={'icon_admin icon_next'}></span></li>
                    <li>운영설정</li>
                    <li><span className={'icon_admin icon_next'}></span></li>
                    <li><Link href={'/operation/credit-insight'}>크레딧 인사이트</Link></li>
                </ul>
            </div>
            <PageContent grades={grades} services={services}/>
        </section>
    )
}
