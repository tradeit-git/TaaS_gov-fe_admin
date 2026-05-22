import {notFound} from "next/navigation";
import '@/style/partner-dashboard.scss';
import callApi from "@/utill/apiRequest";
import {getServerRequestOptions} from "@/lib/serverRequest";
import SummaryCards from "@/app/(Dashboard)/partner-management/dashboard/component/SummaryCards";
import DashboardCharts from "@/app/(Dashboard)/partner-management/dashboard/component/DashboardCharts";
import MemberList from "@/app/(Dashboard)/partner-management/dashboard/component/MemberList";
import {
    DailySignup,
    DashboardSummary,
    EMPTY_MEMBERS,
    MembersResponse,
    PartnerInfo
} from "@/app/(Dashboard)/partner-management/dashboard/types";

interface Props {
    searchParams: Promise<{ key?: string }>;
}

export default async function PartnerDashboardPage({searchParams}: Props) {
    const {key} = await searchParams;
    if (!key) notFound();

    const options = await getServerRequestOptions();
    const base = `/api/admin/partner-keys/common/${encodeURIComponent(key)}`;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [partnerRes,summaryRes, dailyRes, membersRes] = await Promise.all([
        callApi(base, options),
        callApi(`${base}/dashboard`, options),
        callApi(`${base}/dashboard/daily-signups?year=${year}&month=${month}`, options),
        callApi(`${base}/dashboard/members?page=1&size=10`, options),
    ]);

    // 키가 유효하지 않으면(404 등) 요약 조회 실패 → 404
    if (!partnerRes.result || !partnerRes.data) notFound();

    const partner = partnerRes.data as PartnerInfo;
    const summary = summaryRes.data as DashboardSummary;
    const initialDaily = (dailyRes.result && dailyRes.data ? dailyRes.data : []) as DailySignup[];
    const initialMembers = (membersRes.result && membersRes.data ? membersRes.data : EMPTY_MEMBERS) as MembersResponse;

    return (
        <div className={'partner_dashboard'}>
            <header className={'dashboard_header'}>
                <div className={'header_inner'}>
                    <h1>{partner.partnerName} 제휴 성과 대시보드</h1>
                    <p className={'partner_info'}>
                        결제 시 마다 +{partner.bonusCredit}% 추가 크레딧 지급 /<br className={'mo'}/>
                        {partner.startDate.replaceAll("-",".")} ~ {partner.endDate.replaceAll("-",".")}
                    </p>
                </div>
            </header>

            <main className={'dashboard_body'}>
                {/* 통계 카드 */}
                <SummaryCards summary={summary}/>

                {/* 차트 영역 */}
                <DashboardCharts
                    partnerKey={key}
                    partner={partner}
                    planUsage={summary.planUsage}
                    initialDaily={initialDaily}
                    initialYear={year}
                    initialMonth={month}
                />

                {/* 회원 가입자 명단 */}
                <MemberList partnerKey={key} initialData={initialMembers}/>
            </main>
        </div>
    );
}
