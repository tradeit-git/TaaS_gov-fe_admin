import LoginForm from "@/app/(Main)/component/LoginForm";
import {AdminType} from "@/types/auth/admin";
import callApi from "@/utill/apiRequest";
import {redirect} from "next/navigation";
import {ADMIN_MAIN} from "@/lib/routes";
import {getServerRequestOptions} from "@/lib/serverRequest";

export default async function Page() {

    const options = await getServerRequestOptions();

    let auth : AdminType | null = null;

    try {
        const authRes = await callApi(`/api/admin/auth`, options);
        if (authRes.result) auth = authRes.data as AdminType | null;
    }catch (error){
        console.log(error)
    }

    if(auth != null) redirect(ADMIN_MAIN);

    return <LoginForm/>
}