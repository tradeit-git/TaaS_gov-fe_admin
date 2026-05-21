import '@/style/partner-dashboard.scss';
import SummaryCards from "@/app/(Dashboard)/partner-management/dashboard/component/SummaryCards";
import DashboardCharts from "@/app/(Dashboard)/partner-management/dashboard/component/DashboardCharts";
import MemberList from "@/app/(Dashboard)/partner-management/dashboard/component/MemberList";

export default function PartnerDashboardPage() {


    return (
        <div className={'partner_dashboard'}>
            <header className={'dashboard_header'}>
                <div className={'header_inner'}>
                    <h1>제휴명 제휴 성과 대시보드</h1>
                    <p className={'partner_info'}>
                        결제 시 마다 +30% 추가 크레딧 지급 /<br className={'mo'}/> yyyy.mm.dd ~ yyyy.mm.dd
                    </p>
                </div>
            </header>

            <main className={'dashboard_body'}>
                {/* 통계 카드 */}
                <SummaryCards/>

                {/* 차트 영역 */}
                <DashboardCharts/>

                {/* 회원 가입자 명단 */}
                <MemberList/>
            </main>
        </div>
    );
}
