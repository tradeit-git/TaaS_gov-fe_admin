import {create} from "zustand";
import {AppConfigSchema, AppConfigType} from "@/types/common/appConfig";

interface AppConfigStore {
    appConfig : AppConfigType;
    setAppConfig : (appConfig : AppConfigType) => void;
}

export const useAppConfigStore = create<AppConfigStore>((set) => ({
    appConfig : AppConfigSchema.parse({}),
    setAppConfig : (appConfig) => {
        set( {appConfig:appConfig});
    }
}));