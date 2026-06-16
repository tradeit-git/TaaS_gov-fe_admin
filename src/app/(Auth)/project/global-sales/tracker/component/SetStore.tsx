'use client'

import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {ProjectType} from "@/types/project/project";
import {useEffect} from "react";

export default function SetStore(props: {
    projects: ProjectType[],
}) {
    const {setProjects} = useProjectTrackerStore();
    useEffect(() => {
        setProjects(props.projects);
    }, [props.projects, setProjects])

    return (<></>)
}