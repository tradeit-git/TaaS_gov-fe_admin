import {create} from 'zustand';

interface LoadingStore {
    isLoading: boolean; // 전체 프로젝트 데이터
    setIsLoading: (isLoading: boolean) => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
    isLoading : false,
    setIsLoading:(isLoading) => {
        set(() => ({isLoading: isLoading}))
    },
}));
