// app/layout.tsx
import React from 'react';
import '@/style/admin.scss'
import '@/style/client.scss'
import '@/style/client-detail.scss'
import {AdminType} from "@/types/auth/admin";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ADMIN_LOGIN, APP_URL} from "@/lib/routes";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {AppConfigSchema, AppConfigType} from "@/types/common/appConfig";
import AppConfig from "@/app/(Auth)/components/AppConfig";
import Sidebar from "@/app/(Auth)/components/Sidebar";
import PageVisitLogger from "@/components/PageVisitLogger";

export default async function Layout({children}: { children: React.ReactNode }) {
    const options = await getServerRequestOptions();
    let auth: AdminType | null = null;

    try {
        const authRes = await callApi(`/api/admin/auth`, options);
        if (authRes.result) auth = authRes.data as AdminType;
    } catch (error) {
        redirect(ADMIN_LOGIN);
        console.log(error)
    }

    if (auth == null) redirect(ADMIN_LOGIN);

    const appConfig = AppConfigSchema.parse({});
    try {
        const apiRes = await callApi(`/api/common/settings`, options);
        if (apiRes.result) {
            const apiData = apiRes.data as AppConfigType;
            appConfig.geoCodes = apiData.geoCodes ? apiData.geoCodes : [];
            appConfig.currencyUnits = apiData.currencyUnits ? apiData.currencyUnits : [];
            appConfig.administrativeDivisions = apiData.administrativeDivisions ? apiData.administrativeDivisions : [];
            appConfig.companyClassifications = apiData.companyClassifications ? apiData.companyClassifications : [];
        } else {
            redirect(`${APP_URL}${ADMIN_LOGIN}`)
        }
    } catch (error) {
        console.log(error)
        redirect(`${APP_URL}${ADMIN_LOGIN}`)
    }

    return (
        <>
            <PageVisitLogger />
            <AppConfig auth={auth} appConfig={appConfig}/>
            <div className="section_wrap">
                <Sidebar />
                <section className="right_box">{children}</section>
            </div>
        </>
    );
}

