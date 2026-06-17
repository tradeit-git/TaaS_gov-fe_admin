import {ProjectSchema, ProjectType} from "@/types/project/project";
import {BuyerType} from "@/types/buyer/buyer";
import {create} from "zustand";
interface ProjectTrackerStore {
    // managed-users 상세페이지: 라우트 파라미터 (READ API 경로 생성용)
    userId: number,
    setUserId: (id: number) => void,
    projectId: number,
    setProjectId: (id: number) => void,
    projects: ProjectType[],
    setProjects: (projects: ProjectType[]) => void
    selectedProject: ProjectType,
    setSelectedProject: (project: ProjectType) => void
    buyers: BuyerType[],
    setBuyers: (buyers: BuyerType[]) => void,
    selectedBuyerId  : number,
    setSelectedBuyerId: (id: number) => void,
    // 하단 바이어 정보 박스 접힘 여부 (접히면 테이블 페이지당 행 수 ↑)
    infoCollapsed: boolean,
    setInfoCollapsed: (v: boolean) => void,
}

export const useProjectTrackerStore = create<ProjectTrackerStore>((set) => ({
    userId: 0,
    setUserId: (id: number) => {
        set((state) => ({...state, userId: id}));
    },
    projectId: 0,
    setProjectId: (id: number) => {
        set((state) => ({...state, projectId: id}));
    },
    projects: [],
    setProjects: (projects: ProjectType[]) => {
        set((state) => ({...state, projects : projects}));
    },
    selectedProject: ProjectSchema.parse({}),
    setSelectedProject: (project: ProjectType) => {
        set((state) => ({...state, selectedProject : project}));
    },
    buyers: [],
    setBuyers: (buyers: BuyerType[]) => {
        set((state) => ({...state, buyers : buyers}));
    },
    selectedBuyerId  : 0,
    setSelectedBuyerId: (id: number) => {
        set((state) => ({...state, selectedBuyerId : id}));
    },
    infoCollapsed: false,
    setInfoCollapsed: (v: boolean) => {
        set((state) => ({...state, infoCollapsed: v}));
    },
}));