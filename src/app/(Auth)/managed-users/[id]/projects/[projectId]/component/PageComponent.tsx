'use client'

import ProjectBuyer from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/ProjectBuyer";
import ActivityReportBox from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/sales-log-list/ActivityReportBox";
import ProjectBox from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/ProjectBox";
import callApi from "@/utill/apiRequest";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {ProjectSchema, ProjectType} from "@/types/project/project";
import {BuyerSchema, BuyerType} from "@/types/buyer/buyer";
import {BuyerManagerType} from "@/types/buyer/buyerManager";
import {BuyerStepHistoryType} from "@/types/buyer/buyerStepHistory";
import {BuyerSalesLogSchema, BuyerSalesLogType} from "@/types/buyer/buyerSalesLog";

// managed-users READ base path. userId는 스토어(라우트 파라미터)에서 주입됨.
const readBase = (projectId: number) =>
    `/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${projectId}`;

export const fetchProject = async (projectId: number) => {
    let project = ProjectSchema.parse({});
    let buyers = [] as BuyerType[];

    if (projectId === 0) {
        return {project, buyers};
    }
    const options: RequestInit = {
        method: 'GET',
        credentials: 'include'
    }

    const projectApiRes = await callApi(readBase(projectId), options);
    if (projectApiRes.result) {
        project = projectApiRes.data as ProjectType;
    } else {
        return {project, buyers};
    }

    const buyerApiRes = await callApi(`${readBase(projectId)}/buyer/list`, options);
    if (buyerApiRes.result) {
        buyers = buyerApiRes.data as BuyerType[];
    }
    return {project, buyers};
}

export const fetchBuyerDetail = async (projectId: number, buyerId: number) => {

    let buyer = BuyerSchema.parse({});
    let buyerManagers = [] as BuyerManagerType[];
    let buyerStepHistories = [] as BuyerStepHistoryType[];

    if (projectId === 0 || buyerId === 0) {
        return {buyer, buyerManagers, buyerStepHistories}
    }

    const options: RequestInit = {
        method: 'GET',
        credentials: 'include'
    }
    const buyerDetailApiRes = await callApi(`${readBase(projectId)}/buyer/${buyerId}/detail`, options);
    if (buyerDetailApiRes.result) {
        const buyerDetailApiData = buyerDetailApiRes.data as {
            buyer: BuyerType,
            buyerManagers: BuyerManagerType[],
        };
        buyer = buyerDetailApiData.buyer;
        buyerManagers = buyerDetailApiData.buyerManagers
    } else {
        return {buyer, buyerManagers, buyerStepHistories}
    }
    const stepHistoryApiRes = await callApi(`${readBase(projectId)}/buyer/${buyerId}/buyerStepHistories`, options);
    if (stepHistoryApiRes.result) {
        buyerStepHistories = stepHistoryApiRes.data as BuyerStepHistoryType[];
    }
    return {buyer, buyerManagers, buyerStepHistories}
}

export const fetchBuyerSalesLogs = async (projectId: number, buyerId: number) => {
    let buyerSalesLogs = [] as BuyerSalesLogType[];

    if (projectId === 0 || buyerId === 0) {
        return {buyerSalesLogs}
    }

    const options: RequestInit = {
        method: 'GET',
        credentials: 'include'
    }
    const apiRes = await callApi(`${readBase(projectId)}/buyer/${buyerId}/salesLogsNoContents`, options);
    if (apiRes.result) {
        buyerSalesLogs = apiRes.data as BuyerSalesLogType[];
    }
    return {buyerSalesLogs};
}

export const fetchBuyerSalesLogDetail = async (projectId: number, buyerId: number, buyerSalesLogId: number) => {
    let buyerSalesLog = BuyerSalesLogSchema.parse({});

    if (projectId === 0 || buyerId === 0 || buyerSalesLogId === 0) {
        return {buyerSalesLog}
    }

    const options: RequestInit = {
        method: 'GET',
        credentials: 'include'
    }
    const apiRes = await callApi(`${readBase(projectId)}/buyer/${buyerId}/salesLog/${buyerSalesLogId}`, options);
    if (apiRes.result) {
        buyerSalesLog = apiRes.data as BuyerSalesLogType;
    }
    return {buyerSalesLog};
}

export default function PageComponent() {
    return (
        <>
            <ProjectBox/>
            <div className={'buyer_box'}>
                <ProjectBuyer/>
                <ActivityReportBox/>
            </div>
        </>
    )
}