function Sparkline({color = '#5B8DEF', up = true}: { color?: string; up?: boolean }) {
    const path = up
        ? 'M0 26 L12 22 L24 24 L36 16 L48 18 L60 10 L72 12 L84 5 L96 7'
        : 'M0 8 L12 12 L24 9 L36 16 L48 14 L60 20 L72 17 L84 24 L96 22';
    return (
        <svg className={'sparkline'} viewBox="0 0 96 32" preserveAspectRatio="none" fill="none">
            <path d={path} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

export default function SummaryCards() {
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
                        <strong className={'value'}>256</strong>
                        <p>
                            <span className={'partner_dashboard_icon trend up'}/>
                            14% this week
                        </p>
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
                        <strong className={'value'}>9</strong>
                        <p>
                            <span className={'partner_dashboard_icon trend down'}/>
                            5% this week
                        </p>
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
                        <strong className={'value'}>5,000,000원</strong>
                        <p>
                            <span className={'partner_dashboard_icon trend down'}/>
                            21% this week
                        </p>
                    </div>
                    <div className={'partner_dashboard_icon summary_bg bg_03'}/>
                </div>
            </div>
        </section>
    );
}
