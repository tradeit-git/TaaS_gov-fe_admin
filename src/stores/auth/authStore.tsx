import {create} from 'zustand';
import {AdminType} from "@/types/auth/admin";

export interface AuthStore {
    auth: AdminType | null; // 유저 정보
    setAuth: (admin: AdminType | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    auth: null,
    setAuth: (auth) => {
        set((state) => ({...state, auth: auth}));
    },
}));