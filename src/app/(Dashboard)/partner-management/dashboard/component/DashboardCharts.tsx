'use client'

import {useEffect, useRef, useState} from "react";
import DailySignupChart from "@/app/(Dashboard)/partner-management/dashboard/component/DailySignupChart";
import PlanSignupChart from "@/app/(Dashboard)/partner-management/dashboard/component/PlanSignupChart";

// 올해 1월 ~ 현재월 목록 생성
const buildMonthOptions = () => {
    const today = new Date();
    const year = today.getFullYear();
    const months = today.getMonth() + 1; // 현재월 (1~12)
    return Array.from({length: months}).map((_, i) => {
        const month = i + 1;
        return {
            value: `${year}-${String(month).padStart(2, "0")}`,
            label: `${year}년 ${String(month).padStart(2, "0")}월`,
        };
    });
};

export default function DashboardCharts() {
    const monthOptions = buildMonthOptions();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(monthOptions[monthOptions.length - 1]);
    const wrapRef = useRef<HTMLDivElement>(null);

    // 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <section className={'chart_row'}>
            <div className={'chart_card area_card'}>
                <div className={'section_head'}>
                    <h2>월별가입현황</h2>
                    <div className={'period_select'} ref={wrapRef}>
                        <button type="button" className={`period ${open ? 'on' : ''}`}
                                onClick={() => setOpen(prev => !prev)}>
                            {selected.label}
                            <span className={'partner_dashboard_icon'}/>
                        </button>
                        {open && (
                            <ul className={'period_dropdown'}>
                                {monthOptions.map(opt => (
                                    <li key={opt.value}>
                                        <button type="button"
                                                className={opt.value === selected.value ? 'on' : ''}
                                                onClick={() => {
                                                    setSelected(opt);
                                                    setOpen(false);
                                                }}>
                                            {opt.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <DailySignupChart/>
            </div>

            <div className={'chart_card donut_card'}>
                <div className={'section_head'}>
                    <h2>플랜이용현황</h2>
                </div>
                <p className={'total'}>256</p>
                <div className={'graph_content'}>
                    <PlanSignupChart/>
                    <ul>
                        <li>
                            <div className={'label'}>
                                <span className={'circle free'}/>
                                Free
                            </div>
                            <span className={'number'}>30% (76명)</span>
                        </li>
                        <li>
                            <div className={'label'}>
                                <span className={'circle team'}/>
                                팀
                            </div>
                            <span className={'number'}>40% (102명)</span>
                        </li>
                        <li>
                            <div className={'label'}>
                                <span className={'circle personal'}/>
                                개인
                            </div>
                            <span className={'number'}>20% (51명)</span>

                        </li>
                        <li>
                            <div className={'label'}>
                                <span className={'circle enter'}/>
                                기업
                            </div>
                            <span className={'number'}>10% (25명)</span>

                        </li>
                    </ul>
                </div>
            </div>
        </section>
    );
}
