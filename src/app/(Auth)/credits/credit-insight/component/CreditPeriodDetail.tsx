'use client'

import React, {useEffect, useState} from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import callApi from "@/utill/apiRequest";
import {z} from 'zod';
import {
    MonthlyUsageByServiceSchema,
    MonthlyUsageByServiceType,
    GradeType,
} from "@/types/credit/creditInsight";

// 서비스별 표시명 (알려진 타입만 매핑, 없으면 자동 변환)
const SERVICE_NAMES: Record<string, string> = {
    'BL_SEARCH': 'B/L Tracking',
    'AI_CORE': 'AI Core',
    'BUYER_FIT': 'Buyer Fit',
    'MAIL_BOX': 'Mail Box',
    'APOLLO_ORG_SEARCH': 'Organization Search',
    'APOLLO_ORG_ENRICH': 'Organization Enrichment',
    'APOLLO_PEOPLE_ENRICH': 'People Enrichment',
    'APOLLO_PHONE_REVEAL': 'People phone_number',
    'BUYER_ENRICH': 'AI Enrichment',
};

// BUYER_ENRICH -> Buyer Enrich
const toDisplayName = (key: string) =>
    SERVICE_NAMES[key] || key.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

// 색상 팔레트 (서비스 타입이 늘어나도 순서대로 할당)
const COLOR_PALETTE = [
    '#9df081', '#ff9e76', '#A38BF3', '#7ACBC1',
    '#FF8A80', '#82B1FF', '#FFD740', '#ff88eb',
    '#84FFFF', '#CCFF90', '#FF80AB', '#A7FFEB',
];

const getServiceColor = (index: number) => COLOR_PALETTE[index % COLOR_PALETTE.length];

const formatNumber = (num: number) => num.toLocaleString('ko-KR');

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const getEmptyChartData = (periodTab: 'yearly' | 'monthly', year: number, month: number) => {
    if (periodTab === 'yearly') {
        return MONTH_LABELS.map(label => ({label}));
    }
    const days = getDaysInMonth(year, month);
    return Array.from({length: days}, (_, i) => ({label: String(i + 1)}));
};

export default function CreditPeriodDetail({grades, services}: { grades: GradeType[], services: string[] }) {
    const allGrades = [...grades].sort((a, b) => a.displayOrder - b.displayOrder);

    const [periodTab, setPeriodTab] = useState<'yearly' | 'monthly'>('yearly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedGradeCode, setSelectedGradeCode] = useState(allGrades[0]?.gradeCode || '');
    const [rawData, setRawData] = useState<MonthlyUsageByServiceType[]>([]);

    // 사용량 데이터 조회
    useEffect(() => {
        if (!selectedGradeCode) return;
        (async () => {
            const options: RequestInit = {method: "GET", credentials: "include"};
            const url = periodTab === 'yearly'
                ? `/api/admin/credit/insight/usage-by-service/yearly?year=${selectedYear}`
                : `/api/admin/credit/insight/usage-by-service/monthly?year=${selectedYear}&month=${selectedMonth}`;
            const apiRes = await callApi(url, options);
            if (apiRes.result) {
                const parsed = z.array(MonthlyUsageByServiceSchema).parse(apiRes.data);
                setRawData(parsed);
            }
        })();
    }, [periodTab, selectedYear, selectedMonth]);

    // 네비게이션
    const handlePrev = () => {
        if (periodTab === 'yearly') {
            setSelectedYear(prev => prev - 1);
        } else {
            if (selectedMonth === 1) {
                setSelectedYear(prev => prev - 1);
                setSelectedMonth(12);
            } else {
                setSelectedMonth(prev => prev - 1);
            }
        }
    };

    const handleNext = () => {
        if (periodTab === 'yearly') {
            setSelectedYear(prev => prev + 1);
        } else {
            if (selectedMonth === 12) {
                setSelectedYear(prev => prev + 1);
                setSelectedMonth(1);
            } else {
                setSelectedMonth(prev => prev + 1);
            }
        }
    };

    // 선택된 등급으로 필터
    const filteredData = rawData.filter(item => item.gradeCode === selectedGradeCode);

    // recharts용 데이터 변환 (데이터 없으면 빈 차트용 라벨)
    const chartData = filteredData.length > 0
        ? filteredData.map(item => {
            const row: Record<string, string | number> = {label: item.label};
            services.forEach(key => {
                row[key] = item.usageByService[key] || 0;
            });
            return row;
        })
        : getEmptyChartData(periodTab, selectedYear, selectedMonth);

    // 파이차트 데이터 (서비스별 합계)
    const pieData = services.map((key, index) => ({
        name: toDisplayName(key),
        value: filteredData.reduce((sum, item) => sum + (item.usageByService[key] || 0), 0),
        color: getServiceColor(index),
    }));

    return (
        <div className={'period_detail_wrap'}>
            <h4 className="section_title">기간별 이용권 크레딧 사용 세부현황</h4>
            <div className="tab_menu">
                <label className={`tab_item ${periodTab === 'yearly' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="periodTab"
                        checked={periodTab === 'yearly'}
                        onChange={() => setPeriodTab('yearly')}
                    />
                    <span className="radio_circle"></span>
                    연도별
                </label>
                <label className={`tab_item ${periodTab === 'monthly' ? 'active' : ''}`}>
                    <input
                        type="radio"
                        name="periodTab"
                        checked={periodTab === 'monthly'}
                        onChange={() => setPeriodTab('monthly')}
                    />
                    <span className="radio_circle"></span>
                    월별
                </label>
            </div>
            <div className={'total_usage_wrap'}>
                <div className="period_detail_section">
                    <div className="period_content">
                        {/* 좌측: 컨트롤 + 도넛차트 + 범례 */}
                        <div className="left_area">
                            <div className="controls">
                                <div className="year_selector">
                                    <button className="nav_btn prev" onClick={handlePrev}>
                                        <span className={'reversion_admin'}/>
                                    </button>
                                    <span className="current">
                                        {periodTab === 'yearly'
                                            ? selectedYear
                                            : `${selectedYear}. ${String(selectedMonth).padStart(2, '0')}`}
                                    </span>
                                    <button className="nav_btn next" onClick={handleNext}>
                                        <span className={'reversion_admin'}/>
                                    </button>
                                </div>
                                <select
                                    className="plan_select"
                                    value={selectedGradeCode}
                                    onChange={(e) => setSelectedGradeCode(e.target.value)}
                                >
                                    {allGrades.map((grade) => (
                                        <option key={grade.gradeCode} value={grade.gradeCode}>
                                            {grade.gradeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 우측: 스택바차트 */}
                        <div className="right_area">
                            {periodTab === 'yearly' && (
                                <div className="pie_chart_area">
                                    <ResponsiveContainer width={280} height={180}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color}/>
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="category_legend">
                                        {pieData.map((item, index) => (
                                            <div key={index} className="legend_item">
                                                <span className="dot" style={{backgroundColor: item.color}}></span>
                                                <span className="name">{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="stacked_bar_chart">
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={chartData}
                                        margin={{top: 20, right: 30, left: 20, bottom: 5}}
                                        barSize={20}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                        <XAxis
                                            dataKey="label"
                                            tick={{fontSize: 11}}
                                            interval={0}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{fontSize: 11}}
                                            tickFormatter={(value) => formatNumber(value)}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{fill: 'rgba(0, 0, 0, 0.03)'}}
                                            content={({active, payload, label}) => {
                                                if (!active || !payload?.length) return null;
                                                return (
                                                    <div style={{backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px'}}>
                                                        <p style={{fontWeight: 'bold', marginBottom: '5px'}}>{label}</p>
                                                        {payload.map((entry, i) => (
                                                            <div key={i} style={{display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0'}}>
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    width: 10, height: 10,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: entry.color,
                                                                }}/>
                                                                <span>{toDisplayName(String(entry.dataKey))}</span>
                                                                <span style={{marginLeft: 'auto', fontWeight: 'bold'}}>{formatNumber(Number(entry.value))}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }}
                                        />
                                        {services.map((key, index) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                stackId="a"
                                                fill={getServiceColor(index)}
                                                stroke="#fff"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
