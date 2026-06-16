'use client'

import Link from "next/link";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {getProjectNo, ProjectSchema, ProjectType} from "@/types/project/project";
import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useEffect} from "react";
import ProjectSearchBox from "@/app/(Auth)/project/global-sales/tracker/component/ProjectSearchBox";
import {fetchProject as fetchProjectApi} from "@/app/(Auth)/project/global-sales/tracker/component/PageComponent";

export default function ProjectBox() {

    const router = useRouter();
    const searchParams = useSearchParams();

    const {projects, selectedProject, setSelectedProject, setBuyers, setSelectedBuyerId} = useProjectTrackerStore();

    const fetchProject = useCallback(async (projectId: number) => {
        if (projectId === 0) {
            return;
        }
        const {project, buyers} = await fetchProjectApi(projectId);
        setSelectedProject(project);
        setBuyers(buyers);
        setSelectedBuyerId(0);
    }, [setSelectedProject, setBuyers, setSelectedBuyerId])
    const handleSelectProject = (selectProject: ProjectType | null) => {
        const _project = projects.find(item => item.id === selectProject?.id);
        if (_project) {
            setSelectedProject(_project);
            router.push(`/project/global-sales/tracker?projectNo=${getProjectNo(_project)}`);
        } else {
            setSelectedProject(ProjectSchema.parse({}));
            router.push(`/project/global-sales`);
        }
    }
    useEffect(() => {
        const projectNo = searchParams.get('projectNo');
        const project = projects.find(item => getProjectNo(item) === projectNo);
        if (project) {
            void fetchProject(project.id);
        } else if (projects.length > 0) {
            router.push(`/project/global-sales`);
        }
    }, [projects, searchParams, fetchProject, router])

    return (
        <div className={'tracker-project-box'}>
            <div className="contents_wrap">
                <div className={'tracker_top'}>
                    <Link href={'/project/global-sales'} className={'project_list_btn'}>
                        <span className={'icon_admin icon_prev'}/>목록
                    </Link>
                    <div className={'project_table'}>
                        <table className="contents_box">
                            <colgroup>
                                <col style={{width: '14%'}}/>
                                <col style={{width: '40%'}}/>
                                <col style={{width: '13%'}}/>
                                <col style={{width: '8%'}}/>
                                <col style={{width: '9%'}}/>
                                <col style={{width: '8%'}}/>
                                <col style={{width: '8%'}}/>
                            </colgroup>
                            <thead>
                            <tr>
                                <th>프로젝트 번호</th>
                                <th>기업명 / 프로젝트명</th>
                                <th>프로젝트 기간</th>
                                <th>바이어 리스트</th>
                                <th>활동일지수</th>
                                <th>개설자</th>
                                <th>프로젝트 개설일</th>
                            </tr>
                            </thead>
                            <tbody className="list_box">
                            <tr>
                                <td>{selectedProject.id === 0 ? 'N/A' : getProjectNo(selectedProject)}</td>
                                <td>
                                    <ProjectSearchBox item={selectedProject} setItem={handleSelectProject}
                                                      items={projects}
                                                      label={(project: ProjectType) => `${project.createUser.companyName} - ${project.name}`}/>
                                </td>
                                <td>{selectedProject.id === 0 ? 'N/A'   : (!selectedProject.startDate && !selectedProject.endDate
                                    ? 'no-related'
                                    : `${selectedProject.startDate ?? ''} ~ ${selectedProject.endDate ?? ''}`)}</td>
                                <td>{selectedProject.id === 0 ? 'N/A' : `${selectedProject.buyerCountPerStep.List ?? 0} / ${selectedProject.buyerCountPerStep.Lead ?? 0} / ${selectedProject.buyerCountPerStep.Target ?? 0} / ${selectedProject.buyerCountPerStep.Client ?? 0}`}</td>
                                <td>{selectedProject.id === 0 ? 'N/A' : selectedProject.totalSalesLogCount.toLocaleString()}</td>
                                <td>{selectedProject.id === 0 ? 'N/A' : selectedProject.createUser.name}</td>
                                <td>{selectedProject.id === 0 ? 'N/A' : selectedProject.createdAt.substring(0, 10).replaceAll("-", ".")}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}