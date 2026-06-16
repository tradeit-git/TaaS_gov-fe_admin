// app/layout.tsx
import React from 'react';
import '@/style/admin.scss'
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ADMIN_LOGIN, APP_URL} from "@/lib/routes";
import {ProjectType} from "@/types/project/project";
import SetStore from "@/app/(Auth)/project/global-sales/tracker/component/SetStore";
import {getServerRequestOptions} from "@/lib/serverRequest";

export default async function Layout({children}: { children: React.ReactNode }) {

    const options = await getServerRequestOptions();

    let projects: ProjectType[] = [];
    try {
        const apiRes = await callApi(`/api/admin/projects`, options);
        if (apiRes.result) {
            const apiData = apiRes.data as ProjectType[];
            projects = [...apiData];
        } else {
            redirect(`${APP_URL}${ADMIN_LOGIN}`)
        }
    } catch (error) {
        console.log(error)
        redirect(`${APP_URL}${ADMIN_LOGIN}`)
    }

    return (
        <>
            <SetStore projects={projects}/>
            {children}
        </>
    );
}

