import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import UserListPage, {TrialUser} from "@/app/(Auth)/trial/[id]/user-list/component/UserListPage";
import {TrialKeyRow} from "@/app/(Auth)/trial/component/TrialPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;
    const options = await getServerRequestOptions();
    let initialData: TrialUser[] = [];
    let trial: TrialKeyRow | null = null;

    try {
        const [usersRes, trialRes] = await Promise.all([
            callApi(`/api/admin/trial-keys/${id}/users`, options),
            callApi(`/api/admin/trial-keys/${id}`, options),
        ]);
        if (usersRes.result && usersRes.data) {
            initialData = usersRes.data as TrialUser[];
        }
        if (trialRes.result && trialRes.data) {
            trial = trialRes.data as TrialKeyRow;
        }
    } catch (e) {
        console.error(e);
    }

    return <UserListPage trialId={id} trial={trial} initialData={initialData}/>;
}
