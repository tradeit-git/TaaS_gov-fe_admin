import '@/style/client.scss'
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import OnboardingPage, {OnboardingListResponse} from "@/app/(Auth)/onboarding/component/OnboardingPage";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: OnboardingListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    try {
        const res = await callApi(`/api/admin/onboarding-sessions?page=0&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as OnboardingListResponse;
        }
    } catch (e) {
        console.error(e);
    }

    return <OnboardingPage initialData={initialData}/>;
}
