'use client'
import React, {useCallback, useMemo, useRef, useState} from "react";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {usePopupStore} from "@/stores/common/popupStore";
import TopicContentForm, {
    TopicContentFormHandle
} from "@/app/(Auth)/users/component/[userId]/component/TopicContentForm";
import {replaceBase64Images} from "@/components/txContent/TxEditor";
import callApi from "@/utill/apiRequest";
import Link from "next/link";

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

type CompanyAnalysisStatus = 'NEW' | 'EXCLUDED' | 'ANALYZING' | 'COMPLETE';

interface EntryData {
    seq: number;
    topic: string;
    content: string;
}

export interface CompanyAnalysisData {
    id?: number;
    status: CompanyAnalysisStatus;
    companyAnalysisEntries: EntryData[];
}

export default function PageContent({companyName, userId, initialAnalysis}: {
    companyName: string;
    userId: number;
    initialAnalysis?: CompanyAnalysisData | null;
}) {

    const {addPopup} = usePopupStore();
    const [companyAnalysis, setCompanyAnalysis] = useState<CompanyAnalysisData>(
        initialAnalysis ?? {status: 'NEW', companyAnalysisEntries: []}
    );
    const [activeIndex, setActiveIndex] = useState(1);
    const formRef = useRef<TopicContentFormHandle>(null);

    const getEntry = useCallback((seq: number): EntryData => {
        const existing = companyAnalysis.companyAnalysisEntries.find(e => e.seq === seq);
        const topicItem = analysisTopics.find(t => t.seq === seq);
        if (existing) return {...existing};
        return {seq, topic: topicItem?.topic || '', content: ''};
    }, [companyAnalysis]);

    const activeEntry = useMemo(() => {
        return getEntry(activeIndex);
    }, [activeIndex, getEntry]);

    // 현재 에디터 내용을 entries에 병합
    const saveCurrentEntry = () => {
        if (formRef.current) {
            const entry = formRef.current.getEntry();
            const others = companyAnalysis.companyAnalysisEntries.filter(e => e.seq !== entry.seq);
            setCompanyAnalysis({...companyAnalysis, companyAnalysisEntries: [...others, entry]});
        }
    }

    // 탭 전환
    const handleSelectTopic = (seq: number) => {
        saveCurrentEntry();
        setActiveIndex(seq);
    }

    // 라디오 변경
    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const status = e.target.value as CompanyAnalysisStatus;
        saveCurrentEntry();
        if (status === 'COMPLETE') {
            let entries = [...companyAnalysis.companyAnalysisEntries];
            if (formRef.current) {
                const entry = formRef.current.getEntry();
                entries = [...entries.filter(item => item.seq !== entry.seq), entry];
            }
            const allDone = analysisTopics.every(t => {
                const found = entries.find(e => e.seq === t.seq);
                return found && found.content.trim();
            });
            if (!allDone) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'완료 상태는 모든 항목이 작성을 마쳐야 선택 가능합니다'}/>);
                return;
            }
        }
        setCompanyAnalysis({...companyAnalysis, status});
    }

    // 최종 저장
    const handleFinalSave = async () => {
        saveCurrentEntry();
        const payload = {...companyAnalysis};

        let entries = [...payload.companyAnalysisEntries];
        if (formRef.current) {
            const entry = formRef.current.getEntry();
            entries = [...entries.filter(item => item.seq !== entry.seq), entry];
        }

        // 전체 항목 입력 여부 체크
        const allDone = analysisTopics.every(t => {
            const found = entries.find(e => e.seq === t.seq);
            return found && found.content.trim();
        });
        if (!allDone) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'입력 또는 저장되지 않은 항목이 있습니다.'}/>);
            return;
        }

        // base64 이미지 업로드 치환
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].content) {
                entries[i].content = await replaceBase64Images(entries[i].content);
            }
        }
        payload.companyAnalysisEntries = entries;

        const options: RequestInit = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(payload),
        };
        const apiRes = await callApi(`/api/admin/company-analysis/user/${userId}`, options);
        if (apiRes.result) {
            addPopup(<AlertComponent alertType={"confirm"} infoContent={"저장 되었습니다."}/>);
            if (apiRes.data) {
                setCompanyAnalysis(apiRes.data as CompanyAnalysisData);
            }
        } else {
            addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message || '저장에 실패했습니다.'}/>);
        }
    }

    return (
        <>
            <div className="contents_wrap">
                <div className="company_name_box">
                    <p>기업명 : {companyName || '-'}</p>
                </div>
                <div className="analysis_list_box">
                    <ul className={'list_box'}>
                        {analysisTopics.map((analysisTopic) => {
                            const entry = getEntry(analysisTopic.seq);
                            const isDone = entry && entry.content.trim();
                            return (
                                <li
                                    key={analysisTopic.seq}
                                    className={`${analysisTopic.seq === activeIndex ? "on" : ""} ${isDone ? 'done' : ''}`}
                                    onClick={() => handleSelectTopic(analysisTopic.seq)}>
                                    {analysisTopic.seq}. {analysisTopic.topic}
                                </li>
                            )
                        })}
                    </ul>
                    <ul className="analysis_status">
                        <p>※ 분석 상태를 선택하세요.</p>
                        <li>
                            <input type="radio" id={"new"} name={'radio'} value={'NEW'}
                                   onChange={handleStatusChange}
                                   checked={companyAnalysis.status === 'NEW'} />
                            <label htmlFor="new">신규</label>
                        </li>
                        <li>
                            <input type="radio" id={"exclusion"} name={'radio'} value={'EXCLUDED'}
                                   onChange={handleStatusChange}
                                   checked={companyAnalysis.status === 'EXCLUDED'} />
                            <label htmlFor="exclusion">제외</label>
                        </li>
                        <li>
                            <input type="radio" id={"ing"} name={'radio'} value={'ANALYZING'}
                                   onChange={handleStatusChange}
                                   checked={companyAnalysis.status === 'ANALYZING'} />
                            <label htmlFor="ing">분석중</label>
                        </li>
                        <li>
                            <input type="radio" id={"finish"} name={'radio'} value={'COMPLETE'}
                                   onChange={handleStatusChange}
                                   checked={companyAnalysis.status === 'COMPLETE'} />
                            <label htmlFor="finish">완료</label>
                        </li>
                    </ul>
                </div>
                <TopicContentForm ref={formRef} entry={activeEntry} />
            </div>
            <div className={'btn_wrap'}>
                <Link href={'/users'} className={'white_btn'}>목록으로</Link>
                <button type={"button"} className={"save_btn"} style={{float: "inherit"}} onClick={handleFinalSave}>저장</button>
            </div>
        </>
    );
}
