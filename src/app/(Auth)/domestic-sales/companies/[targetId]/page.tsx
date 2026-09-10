import '@/style/contact.scss'
import '@/style/domestic-sales.scss'
// TM 입력 드로어(제휴 회원 목록에서 가져온 것)의 스타일이 여기 있다
import '@/style/partner-dashboard-v2.scss'
import CompanyDetailPage from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/CompanyDetailPage";
import {
    loadCompanyDetail,
    loadTimeline,
    parseTimelineFilter,
} from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/companyDetail";
import {loadTags} from "@/app/(Auth)/domestic-sales/component/tagLoader";

export default async function Page({params, searchParams}: {
    params: Promise<{ targetId: string }>,
    searchParams: Promise<Record<string, string | undefined>>,
}) {
    const {targetId: raw} = await params;
    const targetId = Number(raw);
    const timelineFilter = parseTimelineFilter((await searchParams).timeline);

    // 상세 · 타임라인 · 태그목록은 서로 의존하지 않으므로 같이 받는다
    const [detail, timeline, allTags] = await Promise.all([
        loadCompanyDetail(targetId),
        loadTimeline(targetId, timelineFilter),
        loadTags(),
    ]);

    return <CompanyDetailPage targetId={targetId} detail={detail} timeline={timeline}
                              timelineFilter={timelineFilter} allTags={allTags}/>;
}
