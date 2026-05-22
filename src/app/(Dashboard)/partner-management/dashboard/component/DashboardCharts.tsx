'use client'

import {useEffect, useRef, useState} from "react";
import callApi from "@/utill/apiRequest";
import DailySignupChart from "@/app/(Dashboard)/partner-management/dashboard/component/DailySignupChart";
import PlanSignupChart, {PLAN_PALETTE} from "@/app/(Dashboard)/partner-management/dashboard/component/PlanSignupChart";
import {DailySignup, PartnerInfo, PlanUsage} from "@/app/(Dashboard)/partner-management/dashboard/types";

interface MonthOption {
    value: string; // "YYYY-MM"
    label: string;
    year: number;
    month: number;
}

/**
 * @param startDate 시작일 "yyyy-mm-dd"
 * @param endDate 종료일 "yyyy-mm-dd"
 */
const buildMonthOptions = (startDate: string, endDate: string): MonthOption[] => {
    const [sYear, sMonth] = startDate.split("-").map(Number);
    const [eYear, eMonth] = endDate.split("-").map(Number);

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // 1. 종료일과 현재일 중 더 빠른 날짜를 목표일로 설정
    const endObj = new Date(eYear, eMonth - 1);
    const nowObj = new Date(currentYear, currentMonth - 1);
    const targetDate = endObj < nowObj ? endObj : nowObj;

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    const options: MonthOption[] = [];
    let curY = sYear;
    let curM = sMonth;

    // 2. 시작일부터 목표일까지 순회
    while (curY < targetYear || (curY === targetYear && curM <= targetMonth)) {
        options.push({
            value: `${curY}-${String(curM).padStart(2, "0")}`,
            label: `${curY}년 ${String(curM).padStart(2, "0")}월`,
            year: curY,
            month: curM,
        });

        curM++;
        if (curM > 12) {
            curM = 1;
            curY++;
        }
    }

    return options;
};

interface Props {
    partnerKey: string;
    partner : PartnerInfo;
    planUsage: PlanUsage[];
    initialDaily: DailySignup[];
    initialYear: number;
    initialMonth: number;
}

export default function DashboardCharts({partnerKey,partner, planUsage, initialDaily, initialYear, initialMonth}: Props) {
    const monthOptions = buildMonthOptions(partner.startDate,partner.endDate);
    const initialValue = `${initialYear}-${String(initialMonth).padStart(2, "0")}`;

    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<MonthOption>(
        monthOptions.find(o => o.value === initialValue) ?? monthOptions[monthOptions.length - 1],
    );
    const [daily, setDaily] = useState<DailySignup[]>(initialDaily);
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

    const handleSelect = async (opt: MonthOption) => {
        setSelected(opt);
        setOpen(false);
        const res = await callApi(
            `/api/admin/partner-keys/common/${encodeURIComponent(partnerKey)}/dashboard/daily-signups?year=${opt.year}&month=${opt.month}`,
            {method: 'GET', credentials: 'include'},
        );
        setDaily(res.result && res.data ? res.data as DailySignup[] : []);
    };

    const total = planUsage.reduce((sum, p) => sum + p.count, 0);

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
                                                onClick={() => handleSelect(opt)}>
                                            {opt.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <DailySignupChart data={daily}/>
            </div>

            <div className={'chart_card donut_card'}>
                <div className={'section_head'}>
                    <h2>플랜이용현황</h2>
                </div>
                <p className={'total'}>{total.toLocaleString()}</p>
                <div className={'graph_content'}>
                    <PlanSignupChart planUsage={planUsage}/>
                    <ul>
                        {planUsage.map((p, i) => {
                            const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                            return (
                                <li key={p.planName}>
                                    <div className={'label'}>
                                        <span className={'circle'}
                                              style={{backgroundColor: PLAN_PALETTE[i % PLAN_PALETTE.length]}}/>
                                        {p.planName}
                                    </div>
                                    <span className={'number'}>{pct}% ({p.count.toLocaleString()}명)</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}
