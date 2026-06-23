import '@/style/contact.scss'
import VideoLibraryPage, {VideoLibraryListResponse} from "@/app/(Auth)/video-library/component/VideoLibraryPage";
import {getServerRequestOptions} from "@/lib/serverRequest";
import callApi from "@/utill/apiRequest";

export default async function Page() {
    const options = await getServerRequestOptions();
    let initialData: VideoLibraryListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 1,
    };
    try {
        const res = await callApi(`/api/admin/video-library/list?page=1&size=10`, options);
        if (res.result && res.data) {
            initialData = res.data as VideoLibraryListResponse;
        }
    } catch (e) {
        console.error(e);
    }
    console.log(initialData);
    return <VideoLibraryPage initialData={initialData}/>;
}
