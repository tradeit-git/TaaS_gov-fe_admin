'use client'

import React, {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
// import {CompanyAnalysisType} from "@/types/user/companyAnalysis";
// import {analysisTopics, CompanyAnalysisEntrySchema} from "@/types/user/companyAnalysisEntry";
// import TxView from "@/components/txContent/TxView";

const analysisTopics = [
    {seq: 1, topic: '제품 개요 및 수출 가능성 진단'},
    {seq: 2, topic: '경쟁사 분석'},
    {seq: 3, topic: '목표 수출 시장 개요'},
    {seq: 4, topic: '수입 통계 및 HS CODE 분석'},
    {seq: 5, topic: '진입장벽 및 리스크 요소'},
    {seq: 6, topic: '현지 유통 구조 및 유통 채널 분석'},
    {seq: 7, topic: '잠재 바이어 분석'},
    {seq: 8, topic: '마케팅 및 세일즈 전략 제안'},
];

export default function PopupPreview(props: {
    uId?: string;
}) {
    const {closePopup} = usePopupStore();
    const [tab, setTab] = useState(1);

    return (
        <section className={'popupSection prev_popup'}>
            <div className="popupContainer">
                <h4>기업전략분석 보고서</h4>
                <ul className={'info_box'}>
                    <li>· 대상기업 : -</li>
                    <li>· 분석담당 : -</li>
                    <li>· 분석일자 : -</li>
                </ul>
                <ul className="tab_wrap">
                    {analysisTopics.map((analysisTopic) => {
                        return (
                            <React.Fragment key={analysisTopic.seq}>
                                <li className={`tab ${analysisTopic.seq === tab ? 'on' : ''}`} onClick={() => setTab(analysisTopic.seq)}>
                                    {analysisTopic.seq}. {analysisTopic.topic}
                                </li>
                                {analysisTopic.seq < analysisTopics.length && <span className="line" />}
                            </React.Fragment>
                        )
                    })}
                </ul>
                <div className="text_box">
                    {/* TxView 영역 - 추후 연동 */}
                    <div style={{minHeight: 200}} />
                </div>
                <div className="btn_wrap">
                    <button type={"button"} className={'save_btn'} onClick={() => closePopup(props.uId ?? "")}>닫기</button>
                </div>
            </div>
        </section>
    )
}
