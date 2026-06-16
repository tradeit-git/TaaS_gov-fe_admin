'use client'

import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {ProjectType} from "@/types/project/project";
import {BuyerType} from "@/types/buyer/buyer";
import {useEffect} from "react";

export default function SetStore(props: {
    userId: number,
    projectId: number,
    project: ProjectType,
    buyers: BuyerType[],
}) {
    const {setUserId, setProjectId, setSelectedProject, setBuyers, setSelectedBuyerId} = useProjectTrackerStore();
    useEffect(() => {
        setUserId(props.userId);
        setProjectId(props.projectId);
        setSelectedProject(props.project);
        setBuyers(props.buyers);
        setSelectedBuyerId(0);
    }, [props.userId, props.projectId, props.project, props.buyers,
        setUserId, setProjectId, setSelectedProject, setBuyers, setSelectedBuyerId])

    return (<></>)
}
