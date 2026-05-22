import {DashboardSummary, Metric} from "@/app/(Dashboard)/partner-management/dashboard/types";

function TrendText({metric}: { metric: Metric }) {
    if (metric.growthRate === null) {
        return <p className={'trend_new'}>신규</p>;
    }
    const up = metric.growthRate >= 0;
    return (
        <p>
            <span className={`partner_dashboard_icon trend ${up ? 'up' : 'down'}`}/>
            {Math.abs(metric.growthRate)}% this week
        </p>
    );
}

interface Props {
    summary: DashboardSummary;
}

export default function SummaryCards({summary}: Props) {
    return (
        <section className={'summary_cards'}>
            <div className={'card'}>
                <div className={'card_top'}>
                    <span className={'label'}><b>총 가입사 수</b></span>
                    <div className={'icon_box'}>
                        <span className={'partner_dashboard_icon users'}/>
                    </div>
                </div>
                <div className={'card_main'}>
                    <div className={'content'}>
                        <strong className={'value'}>{summary.signups.value.toLocaleString()}</strong>
                        <TrendText metric={summary.signups}/>
                    </div>
                    <div className={'partner_dashboard_icon summary_bg bg_01'}/>
                </div>
            </div>

            <div className={'card'}>
                <div className={'card_top'}>
                    <span className={'label'}><b>총 결제 건수</b></span>
                    <div className={'icon_box'}>
                        <span className={'partner_dashboard_icon wallet'}/>
                    </div>
                </div>
                <div className={'card_main'}>
                    <div className={'content'}>
                        <strong className={'value'}>{summary.payments.value.toLocaleString()}</strong>
                        <TrendText metric={summary.payments}/>
                    </div>
                    <div className={'partner_dashboard_icon summary_bg bg_02'}/>
                </div>
            </div>

            <div className={'card'}>
                <div className={'card_top'}>
                    <span className={'label'}><b>누적 결제 금액</b> (VAT 포함)</span>
                    <div className={'icon_box'}>
                        <span className={'partner_dashboard_icon database'}/>
                    </div>
                </div>
                <div className={'card_main'}>
                    <div className={'content'}>
                        <strong className={'value'}>{summary.amount.value.toLocaleString()}원</strong>
                        <TrendText metric={summary.amount}/>
                    </div>
                    <div className={'partner_dashboard_icon summary_bg bg_03'}/>
                </div>
            </div>
        </section>
    );
}
