import '@/style/client.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import TrialPage, {TrialKeyRow} from "@/app/(Auth)/trial/component/TrialPage";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: TrialKeyRow[] = [];

    try {
        const res = await callApi(`/api/admin/trial-keys`, options);
        if (res.result && res.data) {
            initialData = res.data as TrialKeyRow[];
        }
    } catch (e) {
        console.error(e);
    }

    return <TrialPage initialData={initialData}/>;
}
