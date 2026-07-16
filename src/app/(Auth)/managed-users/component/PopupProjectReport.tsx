'use client';

import {ProjectReportType} from "@/types/project/projectReport";
import React, {useRef} from 'react';
import {APP_URL} from "@/lib/routes";
import Image from "next/image";
import TxView from "@/components/txContent/TxView";
import {BuyerStepEnum} from "@/types/enums";
import {useReactToPrint} from "react-to-print";

/* eslint-disable @next/next/no-img-element */
export default function PopupProjectReport(props: {
    projectReport: ProjectReportType,
    startDate: string,
    endDate: string,
    companyName: string
}) {
    const {projectReport, startDate, endDate, companyName} = props;
    const {companyAnalysis} = projectReport;

    const sectionMeta = [
        {title: "제품 개요 및 수출 가능성 진단", subtitle: "제품의 경쟁력, 현지 적합성, 수출 잠재력을 평가하여 시장 진출 타당성을 확보합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_01.png`, color: "#E74036"},
        {title: "경쟁사 분석", subtitle: "주요 경쟁사의 강점과 약점을 파악함으로써 차별화 포인트와 전략적 우위를 도출합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_02.png`, color: "#58ABAF"},
        {title: "목표 수출 시장 개요", subtitle: "시장 규모, 성장성, 소비 트렌드를 종합 검토하여 우선 진출 국가 및 시장을 명확히 설정합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_03.png`, color: "#32C332"},
        {title: "수입 통계 및 HS CODE 분석", subtitle: "수입 데이터를 기반으로 시장 수요 구조와 무역 장벽을 사전에 확인합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_04.png`, color: "#AF5899"},
        {title: "진입 장벽 및 리스크 요소", subtitle: "관세, 인증, 규제, 문화적 차이를 포함한 다양한 위험 요소를 식별하고 대응 전략을 마련합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_05.png`, color: "#369DE7"},
        {title: "현지 유통 구조 및 유통 채널 분석", subtitle: "유통 경로와 파트너 특성을 분석하여 최적의시장 진입 방식과 효율적 공급 체계를 설계합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_06.png`, color: "#E7BE36"},
        {title: "잠재 바이어 분석", subtitle: "현지 유망 바이어 및 파트너 후보군을 발굴, 분석하여 비즈니스 기회를 창출합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_07.png`, color: "#36E7C9"},
        {title: "마케팅 및 세일즈 전략 제안", subtitle: "목표 시장 맞춤형 마케팅 접근법과 세일즈 실행 방안을 제시하여 수출 성과 극대화를 지원합니다.", imageUrl: `${APP_URL}/static/img/strategy_icon_08.png`, color: "#5B58AF"},
    ];

    const levelMapping: Record<string, {level: string; color: string; spacing: string}> = {
        [BuyerStepEnum.Enum.List]: {level: "Lv.1", color: "#FC9733", spacing: "1.0px"},
        [BuyerStepEnum.Enum.Lead]: {level: "Lv.2", color: "#6E7CE6", spacing: "-1.75px"},
        [BuyerStepEnum.Enum.Target]: {level: "Lv.3", color: "#D844EC", spacing: "-1.75px"},
        [BuyerStepEnum.Enum.Client]: {level: "Lv.4", color: "#E73033", spacing: "-3.75px"},
    };

    const printableRef = useRef(null);
    const handlePrint = useReactToPrint({contentRef: printableRef});

    let index = 1;
    return (
        <section className="reportPaperSection">
            <div className={'pdf_btn_box'}>
                <button onClick={handlePrint}>
                    <Image src={`${APP_URL}/static/img/down.png`} width={14} height={12} alt="down_btn" className={'down_icon'}/> PDF 저장하기
                </button>
                <p>※ Microsoft Print to PDF로 저장하세요.</p>
            </div>
            <div className={'printSection'}>
                <div className="reportPaperContent" ref={printableRef}>
                    <div className={'Paper cover'}>
                        <p className={'cover_info'}>Driving Growth Beyond Borders</p>
                        <div className={'title'}>
                            <p className={'title_info'}>International sales activity report</p>
                            <h2>해외영업 활동보고서</h2>
                            <p className={'company'}>{companyName}</p>
                            <span>data period &nbsp; &nbsp; {startDate} ~ {endDate}</span>
                        </div>
                        <p className={'createDate'}>{new Date().toLocaleDateString("ko-KR")}</p>
                        <Image src={`${APP_URL}/static/img/cover_logo.png`} width={70} height={17} alt="logo" className={'cover_logo'}/>
                    </div>

                    {companyAnalysis && companyAnalysis.companyAnalysisEntries.length > 0 && (
                        <>
                            <div className={'Paper color'}>
                                <h2 className={'number'}>{(index++).toString().padStart(2, '0')}</h2>
                                <h3 className={'title'}>기업전략분석</h3>
                                <div>
                                    <h5>해외영업 진출 분석 및 전략 수립의 필요성</h5>
                                    <p>해외 시장은 기회와 동시에 높은 불확실성을 지니고 있습니다.<br/>단순히 제품을 수출하는 것만으로는 성공을 보장 할 수 없으며 시장 특성을 비롯해 경쟁환경, 유통구조, 법규와<br/>같은 다양한 변수를 종합적으로 고려해야 합니다.</p>
                                </div>
                                <div>
                                    <h5>활용점 및 기대효과</h5>
                                    <p>분석을 통해 단순한 정보 수집을 넘어 즉시 활용 가능한 실행 전략을 수립할 수 있습니다.<br/>또한 사전적 리스크 관리로 안정성을 제고하고, 제품 차별화와 전략적 포지셔닝을 통해 경쟁 우위를 확보하며<br/>검증된 바이어와 유통 채널 발굴을 통해 매출 창출 기회를 극대화 할 수 있습니다.</p>
                                </div>
                                <div>
                                    <h5>분석 항목</h5>
                                    <ul>
                                        <li><span>①</span><p>제품 개요 및 수출 가능성 진단</p></li>
                                        <li><span>②</span><p>경쟁사 분석</p></li>
                                        <li><span>③</span><p>목표 수출 시장 개요</p></li>
                                        <li><span>④</span><p>수입 통계 및 HS CODE 분석</p></li>
                                        <li><span>⑤</span><p>진입장벽 및 리스크 요소</p></li>
                                        <li><span>⑥</span><p>현지 유통 구조 및 유통 채널 분석</p></li>
                                        <li><span>⑦</span><p>잠재 바이어 분석</p></li>
                                        <li><span>⑧</span><p>마케팅 및 세일즈 전략 제안</p></li>
                                    </ul>
                                </div>
                            </div>
                            <ul className={'Inlay companyAnalysisList'}>
                                {[...companyAnalysis.companyAnalysisEntries.sort((a, b) => a.seq - b.seq)].map((entry, idx) => {
                                    const meta = sectionMeta[idx] || {title: "제목 없음", subtitle: "", imageUrl: ""};
                                    return (
                                        <li key={`entry-${idx}`} className="analysis-section">
                                            <div className="section-header">
                                                <div className={'img_box'} style={{backgroundColor: meta.color}}>
                                                    <img src={meta.imageUrl} alt={meta.title} style={{maxWidth: "100%", height: "auto"}}/>
                                                </div>
                                                <div className={'text_box'}>
                                                    <h3>{meta.title}</h3>
                                                    <p>{meta.subtitle}</p>
                                                </div>
                                            </div>
                                            <TxView className="section-content" content={entry.content}/>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}

                    {projectReport.buyers.length > 0 && (
                        <>
                            <div className={'Paper color'}>
                                <h2 className={'number'}>{(index++).toString().padStart(2, '0')}</h2>
                                <h3 className={'title'}>해외영업 활동내역</h3>
                                <div>
                                    <h5>해외 진출의 발자취, 글로벌 성공의 길잡이</h5>
                                    <p>해외 영업활동은 단순한 기록을 넘어 기업의 글로벌 시장 진출 전략과 성과를 반영하는 핵심 자료입니다.<br/>축적된 내역은 의사결정과 전략 수립의 토대가 되며 새로운 기회와 위험 요인을 식별하는 나침반 역할을 합니다.<br/>또한, 시장 성과와 전략적 통찰을 담아내는 기록으로써 기업의 글로벌 경쟁력 강화를 위한 핵심 기반이 됩니다.</p>
                                </div>
                                <div>
                                    <h5>해외영업 활동의 체계적 기록과 전략적 활용</h5>
                                    <ul>
                                        <li><span>①</span><p>이메일, 화상미팅, 제안 등의 활동 유형별 기록으로 성과 분석과 업무 효율이 가능합니다.</p></li>
                                        <li><span>②</span><p>바이어 등급별 활동과 전환 현황을 기록하면 잠재 고객에서 핵심 고객으로의 전환율을 정량적으로 평가 할 수 있습니다.</p></li>
                                        <li><span>③</span><p>기록된 데이터를 기반으로 영업 전략, 우선 순위, 마케팅 접근법을 세밀하게 조정할 수 있습니다.</p></li>
                                        <li><span>④</span><p>영업 활동의 문제점을 조기에 발견하고 개선함으로써 리스크 최소화에 기여합니다.</p></li>
                                        <li><span>⑤</span><p>거래 지연, 경쟁사 움직임, 규제 문제 등 현장에서 발생하는 이슈를 즉시 기록하면 선제적 대응과 신속한 조치가 가능합니다.</p></li>
                                        <li><span>⑥</span><p>활동일지는 향후에 신규 시장 진출, 제품 전략 수립, 영업 프로세스 개선 등 장기적 의사결정의 근거 자료로 활용 가능합니다.</p></li>
                                    </ul>
                                </div>
                                <div>
                                    <h5>바이어 등급</h5>
                                    <table>
                                        <tbody>
                                        <tr><th>List</th><td>바이어 DB를 필터링하여 분류된 잠재 고객 기업</td></tr>
                                        <tr><th>Lead</th><td>마케팅 활동으로 추출된 관심 기업 및 영업 대상</td></tr>
                                        <tr><th>Target</th><td>영업 활동을 통해 분류된 기업</td></tr>
                                        <tr><th>Client</th><td>최종 계약을 체결한 기업</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className={'Inlay activityReport'}>
                                {projectReport.buyers.map((buyerReport, bIdx) => {
                                    const stepKey = buyerReport.buyer.step || BuyerStepEnum.Enum.Lead;
                                    if (stepKey === BuyerStepEnum.Enum.DB) return null;
                                    const step = levelMapping[stepKey] || levelMapping[BuyerStepEnum.Enum.Lead];
                                    return (
                                        <div key={bIdx} className={'activityReportBox'}>
                                            <div className={'buyer_info_box'} style={{backgroundColor: step.color}}>
                                                <div className={'buyer_number'}>
                                                    <p>바이어 {String(bIdx + 1).padStart(3, "0")}</p>
                                                    <span style={{letterSpacing: step.spacing}}>{step.level}</span>
                                                </div>
                                                <div className={'buyer_info'}>
                                                    <div className={'top'}>
                                                        <p className={'company'} style={{backgroundColor: step.color}}>{buyerReport.buyer.companyName || "-"}</p>
                                                        <div className={'nation'}>
                                                            {buyerReport.buyer.geoCode && (
                                                                <img src={`${APP_URL}/static/img/nation/gonfalon/${buyerReport.buyer.geoCode.isoCode}.svg`} width={16} height={11} alt="flag" className={'nation_flag'}/>
                                                            )}
                                                            {buyerReport.buyer.geoCode?.name || "-"}
                                                        </div>
                                                    </div>
                                                    <ul className={'bottom'}>
                                                        <li><span>주 &nbsp;&nbsp;소 </span>{buyerReport.buyer.googleMapAddress || "-"}</li>
                                                        <li><span>홈페이지 </span>{buyerReport.buyer.homepage ? <a href={buyerReport.buyer.homepage} target="_blank" rel="noopener noreferrer">{buyerReport.buyer.homepage}</a> : "-"}</li>
                                                        <li><span>주요품목 </span>{buyerReport.buyer.keyItems || "-"}</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className={'activityReportAll'}>
                                                {buyerReport.buyerSalesLogs.length > 0 ? (
                                                    buyerReport.buyerSalesLogs.map(log => (
                                                        <div key={log.id} className={'activityReport_content'}>
                                                            <div className={'activityTitle_box'}>
                                                                <p className={'title'}>{log.title}</p>
                                                                <div>
                                                                    <p><span>영업단계</span> {log.topic}</p>
                                                                    <p><span>작성일자</span> {log.date}</p>
                                                                </div>
                                                            </div>
                                                            <p className={'content'} dangerouslySetInnerHTML={{__html: log.content}}/>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>영업활동일지 없음</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
