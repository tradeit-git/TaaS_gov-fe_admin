'use client';

import {useEffect, useState} from "react";
import ReactDOM from "react-dom/client";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {ProjectReportType} from "@/types/project/projectReport";
import PopupProjectReport from "@/app/(Auth)/managed-users/component/PopupProjectReport";
import '@/style/report.scss';

type ProjectOptionType = {
    id: number;
    name: string;
}

export default function PopupProjectReportSelector(props: {
    uId?: string,
    userId: number,
    companyName: string
}) {
    const {addPopup, closePopup} = usePopupStore();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [projects, setProjects] = useState<ProjectOptionType[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number>(0);

    useEffect(() => {
        const fetchProjects = async () => {
            const res = await callApi(`/api/admin/managed-users/${props.userId}/projects`, {method: 'GET', credentials: 'include'});
            console.log('[ReportSelector] projects API response:', res);
            if (res.result && Array.isArray(res.data)) {
                const list = res.data as ProjectOptionType[];
                setProjects(list);
                if (list.length > 0) setSelectedProjectId(list[0].id);
            }
        };
        fetchProjects();
    }, [props.userId]);

    const handleSubmit = async () => {
        // if (!selectedProjectId) {
        //     addPopup(<AlertComponent alertType={'alert'} infoContent={'프로젝트를 선택해주세요.'}/>);
        //     return;
        // }
        // if (!startDate || !endDate) {
        //     addPopup(<AlertComponent alertType={'alert'} infoContent={'기간을 선택해주세요.'}/>);
        //     return;
        // }
        //
        // const res = await callApi(
        //     `/api/admin/projects/${selectedProjectId}/report?startDate=${startDate}&endDate=${endDate}`,
        //     {method: 'GET', credentials: 'include'}
        // );
        //
        // if (res.result) {
        //     const projectReport = res.data as ProjectReportType;
        //     if (!projectReport?.companyAnalysis && projectReport.buyers.length === 0) {
        //         addPopup(<AlertComponent alertType={'alert'} infoContent={'출력할 데이터가 없습니다.'}/>);
        //         return;
        //     }
        //     openPopupProjectReport(projectReport, startDate, endDate);
        // } else {
        //     addPopup(<AlertComponent alertType={'alert'} infoContent={'리포트 조회에 실패했습니다.'}/>);
        // }
        if (!startDate || !endDate) {
            addPopup(<AlertComponent alertType={"alert"} infoContent={'기간을 선택해주세요.'}/>);
            return;
        }

        const options: RequestInit = { method: "GET", credentials: "include" };
        //console.log('selectedProjectId :: ', selectedProjectId);
        const apiRes = await callApi(
            `/api/admin/projects/${selectedProjectId}/report?startDate=${startDate}&endDate=${endDate}`,
            options
        );

        if (apiRes.result) {
            const projectReport = apiRes.data as ProjectReportType;
            if(!projectReport?.companyAnalysis && projectReport.buyers.length === 0){
                addPopup(<AlertComponent alertType={"alert"} infoContent={'출력할 데이터가 없습니다.'}/>);
                return false
            }

            openPopupProjectReport(projectReport, startDate, endDate);
        } else {
            alert("리포트 조회 실패");
        }
    };

    const openPopupProjectReport = (projectReport: ProjectReportType, start: string, end: string) => {
        const width = 1440;
        const height = 960;

        const popupWindow = window.open(
            "",
            "popupWindow",
            `width=${width},height=${height},top=0,left=0,scrollbars=yes`
        );
        if (!popupWindow) return;

        popupWindow.document.body.innerHTML = `<div id="popup-root"></div>`;
        popupWindow.document.title = "프로젝트 리포트";

        Array.from(document.styleSheets).forEach((styleSheet) => {
            try {
                if (styleSheet.href) {
                    const link = popupWindow.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = styleSheet.href;
                    popupWindow.document.head.appendChild(link);
                } else if (styleSheet.cssRules) {
                    const style = popupWindow.document.createElement("style");
                    Array.from(styleSheet.cssRules).forEach((rule) => {
                        style.appendChild(document.createTextNode(rule.cssText));
                    });
                    popupWindow.document.head.appendChild(style);
                }
            } catch (e) {
                console.warn("스타일 복사 실패", e);
            }
        });

        const popupRoot = popupWindow.document.getElementById("popup-root");
        if (!popupRoot) return;

        const root = ReactDOM.createRoot(popupRoot);
        root.render(<PopupProjectReport projectReport={projectReport} startDate={start} endDate={end} companyName={props.companyName}/>);
    };

    return (
        <div className={'popupSection reportSelector'}>
            <div className={'popupContainer'}>
                <h4>영업활동 현황보고서 조회 기간을 선택하세요.</h4>
                <p>* 필수항목</p>
                <table>
                    <tbody>
                    <tr>
                        <th>고객사</th>
                        <td>{props.companyName}</td>
                    </tr>
                    <tr>
                        <th>프로젝트 선택</th>
                        <td>
                            <select className={'project_select'} value={selectedProjectId}
                                    onChange={e => setSelectedProjectId(Number(e.target.value))}>
                                {projects.length === 0 && (
                                    <option value={0}>프로젝트가 없습니다</option>
                                )}
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>조회기간 *</th>
                        <td>
                            <input className={'start_date'} type="date" value={startDate}
                                   onChange={e => setStartDate(e.target.value)}/>
                            - <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <div className={'btn_box'}>
                    <button onClick={() => closePopup(props.uId ?? '')}>닫기</button>
                    <button className={'report_btn'} onClick={handleSubmit}>보고서 생성</button>
                </div>
            </div>
        </div>
    );
}
