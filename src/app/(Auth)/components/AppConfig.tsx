'use client'

import {AdminType} from "@/types/auth/admin";
import {useEffect} from "react";
import {useAuthStore} from "@/stores/auth/authStore";
import {useRouter} from "next/navigation";
import {ADMIN_LOGIN} from "@/lib/routes";
import {AppConfigType} from "@/types/common/appConfig";
import {useAppConfigStore} from "@/stores/common/appConfigStore";

export default function AppConfig (props :{
    auth : AdminType,
    appConfig : AppConfigType,
}) {
    const router = useRouter();
    const {setAuth} = useAuthStore();
    const {setAppConfig} = useAppConfigStore();
    useEffect(() => {
        if(props.auth === undefined) router.push(ADMIN_LOGIN)
        setAuth(props.auth);
    }, [props.auth, setAuth, router]);

    useEffect(() => {
        setAppConfig(props.appConfig);
    }, [props.appConfig, setAppConfig]);


    return (<></>);
}