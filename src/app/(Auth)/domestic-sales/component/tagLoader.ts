import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import {API_BASE} from "@/app/(Auth)/domestic-sales/companies/types";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";

/**
 * 태그 목록의 서버 로더.
 * next/headers 를 쓰므로 <b>서버 컴포넌트에서만 import 할 것</b> (companyList.ts · masterList.ts 와 같다).
 * <p>
 * 목록 화면과 같이 서버에서 읽어 내려보낸다 — 자유 입력이라 담당자가 어떤 태그가 있는지
 * 모르는 게 출발점인데, 클라이언트에서 뒤늦게 불러오면 그 사이 필터바가 비어 보인다.
 */
export async function loadTags(): Promise<TagRow[]> {
    try {
        const options = await getServerRequestOptions();
        const res = await callApi(`${API_BASE}/tags`, options);
        if (res.result && res.data) return res.data as unknown as TagRow[];
    } catch (e) {
        console.error(e);
    }
    return [];
}
