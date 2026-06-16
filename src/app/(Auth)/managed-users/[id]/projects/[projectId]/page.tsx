import '@/style/admin.scss'
import Link from "next/link";
import PageComponent from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";
import SetStore from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/SetStore";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";
import {ProjectSchema, ProjectType} from "@/types/project/project";
import {BuyerType} from "@/types/buyer/buyer";

interface Props {
    params: Promise<{ id: string, projectId: string }>;
}

export default async function Page({params}: Props) {
    const {id, projectId} = await params;
    const userId = Number(id);
    const pid = Number(projectId);

    const options = await getServerRequestOptions();
    let project = ProjectSchema.parse({});
    let buyers: BuyerType[] = [];
    try {
        const res = await callApi(`/api/admin/managed-users/${userId}/projects/${pid}`, options);
        if (res.result && res.data) {
            project = res.data as ProjectType;
        }
        const buyerRes = await callApi(`/api/admin/managed-users/${userId}/projects/${pid}/buyer/list`, options);
        if (buyerRes.result && buyerRes.data) {
            buyers = buyerRes.data as BuyerType[];
        }
    } catch (e) {
        console.error(e);
    }

    return (
        <div className={'admin_page standard_user project'}>
            <div className={'page_start_box'}>
                <h2>상세관리</h2>
                <ul className={'breadcrumb'}>
                    <li><Link href={'/public'}>home</Link></li>
                    <li><span className={'admin_icon icon_next'}></span></li>
                    <li><Link href={'/managed-users'}>유저프로젝트관리</Link></li>
                    <li><span className={'admin_icon icon_next'}></span></li>
                    <li>상세관리</li>
                </ul>
            </div>
            <SetStore userId={userId} projectId={pid} project={project} buyers={buyers}/>
            <PageComponent/>
        </div>
    )
}
