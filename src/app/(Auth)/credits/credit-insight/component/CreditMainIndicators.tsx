'use client'

import React, {useEffect, useState} from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import callApi from "@/utill/apiRequest";
import {
    CreditInsightResponseSchema,
    CreditInsightResponseType,
    GradeChangeType,
    GradeType,
} from "@/types/credit/creditInsight";

// 등급별 색상 팔레트 (displayOrder 순서대로 할당)
const GRADE_COLOR_PALETTE: { pie: string; bar: string }[] = [
    { pie: '#5956FF', bar: '#ACABFF' },
    { pie: '#FFD503', bar: '#FFEA81' },
    { pie: '#53DCB1', bar: '#A9EED8' },
    { pie: '#00AEEE', bar: '#80D7F7' },
    { pie: '#FF6B6B', bar: '#FFA8A8' },
    { pie: '#FF9F43', bar: '#FECA8B' },
    { pie: '#A55EEA', bar: '#CDA4F3' },
    { pie: '#2ED573', bar: '#7BED9F' },
];

const getGradeColor = (index: number) =>
    GRADE_COLOR_PALETTE[index % GRADE_COLOR_PALETTE.length];

const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
};

// 기본 날짜: 올해 1월 1일 ~ 오늘
const getDefaultDates = () => {
    const today = new Date();
    return {
        start: `${today.getFullYear()}-01-01`,
        end: today.toISOString().split('T')[0],
    };
};

export default function CreditMainIndicators({grades}: { grades: GradeType[] }) {
    const defaultDates = getDefaultDates();
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);
    const [data, setData] = useState<CreditInsightResponseType>(CreditInsightResponseSchema.parse({}));

    const fetchData = async (start: string, end: string) => {
        const options: RequestInit = {method: "GET", credentials: "include"};
        const apiRes = await callApi(
            `/api/admin/credit/insight?startDate=${start}&endDate=${end}`,
            options
        );
        if (apiRes.result) {
            const parsed = CreditInsightResponseSchema.parse(apiRes.data);
            setData(parsed);
        }
    };

    useEffect(() => {
        fetchData(startDate, endDate);
    }, []);

    const handleSearch = () => {
        if (!startDate || !endDate) return;
        fetchData(startDate, endDate);
    };

    const handleRefresh = () => {
        const defaults = getDefaultDates();
        setStartDate(defaults.start);
        setEndDate(defaults.end);
        fetchData(defaults.start, defaults.end);
    };

    // --- 이용권 현황 ---
    const totalUserCount = data.gradeDistribution.reduce((sum, g) => sum + g.userCount, 0);

    // --- 등급 목록: displayOrder 순 정렬 ---
    const allGrades = [...grades].sort((a, b) => a.displayOrder - b.displayOrder);
    const gradeNames = allGrades.map(g => g.gradeName);
    const gradeColorIndex = new Map(allGrades.map((g, i) => [g.gradeCode, i]));

    // --- 서비스 이용권 변경: flat list → matrix 변환 ---
    const gradeOrderMap = new Map<string, number>();
    allGrades.forEach(g => gradeOrderMap.set(g.gradeName, g.displayOrder));

    const isUpgrade = (from: string, to: string) => {
        return (gradeOrderMap.get(to) ?? 0) > (gradeOrderMap.get(from) ?? 0);
    };

    const changeMap = new Map<string, GradeChangeType>();
    data.gradeChanges.forEach(g => {
        changeMap.set(`${g.fromGradeName}->${g.toGradeName}`, g);
    });

    let upgradeCount = 0;
    let downgradeCount = 0;
    data.gradeChanges.forEach(g => {
        if (isUpgrade(g.fromGradeName, g.toGradeName)) upgradeCount += g.count;
        else downgradeCount += g.count;
    });

    // --- 크레딧 전체 사용현황: grades 기준으로 매핑 (데이터 없는 등급도 표시) ---
    const usageMap = new Map(data.usageByGrade.map(g => [g.gradeCode, g]));
    const usageByGradeAll = allGrades.map(grade => usageMap.get(grade.gradeCode) || {
        gradeCode: grade.gradeCode,
        gradeName: grade.gradeName,
        totalGranted: 0,
        totalUsed: 0,
        usedRate: 0,
        totalRemaining: 0,
        remainingRate: 0,
    });
    const maxGranted = Math.max(...usageByGradeAll.map(g => g.totalGranted), 1);

    return (
        <>
            {/* 상단 안내 및 검색 */}
            <h4 className="section_title">주요 크레딧 사용지표</h4>
            <div className="top_section">
                <div className="info_text">
                    {/*<p className="note">* 데이터는 매일 전일 23:59 기준으로 집계되며, 주간 데이터는 전주(일~토), 월간 데이터는 전월*/}
                    {/*    말일까지 반영됩니다.</p>*/}
                </div>
                <div className="date_filter">
                    <div className="date_inputs">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                        <span>~</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                    </div>
                    <button className="search_btn" onClick={handleSearch}>검색</button>
                    <button className="refresh_btn" onClick={handleRefresh}>
                        <span className="reversion_admin"/>
                    </button>
                </div>
            </div>

            {/* 주요 크레딧 사용지표 */}
            <div className="main_indicators">
                {/* 이용권 현황 */}
                <div className="card subscription_status">
                    <h5>이용권 현황</h5>
                    <div className="card_content">
                        <div className="chart_area">
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={data.gradeDistribution.map(g => ({
                                            name: g.gradeName,
                                            value: g.userCount,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {data.gradeDistribution.map((g, index) => (
                                            <Cell key={`cell-${index}`} fill={getGradeColor(gradeColorIndex.get(g.gradeCode) ?? index).pie}/>
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="center_label">
                                <span className="total_value"
                                      style={{fontFamily: 'Cafe24Anemone'}}>{formatNumber(totalUserCount)}</span>
                                <span className="total_text">Total</span>
                            </div>
                        </div>
                        <ul className="legend_list">
                            {data.gradeDistribution.map((item, index) => (
                                <li key={index}>
                                    <span className="color_dot"
                                          style={{backgroundColor: getGradeColor(gradeColorIndex.get(item.gradeCode) ?? 0).pie}}></span>
                                    <span className="name">{item.gradeName}</span>
                                    <span className="value">{formatNumber(item.userCount)}</span>
                                    <span className="percentage">{item.percentage.toFixed(1)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 서비스 이용권 변경 */}
                <div className="card service_change">
                    <h5>서비스 이용권 변경</h5>
                    <div className="card_content">
                        <div className="change_summary">
                            <div className="summary_item upgrade">
                                <span className="arrow_icon reversion_admin"/>
                                <span className="label">업그레이드</span>
                                <span className={'line'}/>
                                <span className="count">{formatNumber(upgradeCount)}건</span>
                            </div>
                            <div className="summary_item downgrade">
                                <span className="arrow_icon reversion_admin"/>
                                <span className="label">다운그레이드</span>
                                <span className={'line'}/>
                                <span className="count">{formatNumber(downgradeCount)}건</span>
                            </div>
                        </div>
                        <table className="change_matrix">
                            <thead>
                            <tr>
                                <th className="corner">
                                    <span className="before">before</span>
                                    <span className="after">after</span>
                                </th>
                                {gradeNames.map((name, i) => (
                                    <th key={i}>{name}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {gradeNames.map((fromName, rowIdx) => (
                                <tr key={rowIdx}>
                                    <td className="row_header">{fromName}</td>
                                    {gradeNames.map((toName, colIdx) => {
                                        if (fromName === toName) {
                                            return <td key={colIdx} className="disabled">-</td>;
                                        }
                                        const change = changeMap.get(`${fromName}->${toName}`);
                                        const count = change ? change.count : 0;
                                        const upgraded = isUpgrade(fromName, toName);
                                        return (
                                            <td key={colIdx}
                                                className={upgraded ? 'upgrade_cell' : 'downgrade_cell'}>
                                                <span
                                                    className={upgraded ? 'reversion_admin arrow_up' : 'reversion_admin arrow_down'}/>
                                                {' '}{count}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 무료 크레딧 */}
                <div className={'column_wrap'}>
                    <div className="card free_credit">
                        <h5>무료 크레딧</h5>
                        <div className="card_content">
                            <div className={'flex'}>
                                <div className="stats_area">
                                    <div className="stat_item">
                                        <span className="label">평균 소진기간</span>
                                        <span
                                            className="value"><strong>{data.freeCreditStats.avgConsumptionDays}</strong> days</span>
                                    </div>
                                    <div className="stat_item">
                                        <span className="label">소멸 빈도</span>
                                        <span
                                            className="value"><strong>{formatNumber(data.freeCreditStats.expireCount)}</strong>({data.freeCreditStats.expireRate.toFixed(1)}%)</span>
                                    </div>
                                    <div className="stat_item">
                                        <span className="label">평균 소멸량</span>
                                        <span className="value"><strong
                                            className="highlight">{formatNumber(data.freeCreditStats.avgExpireAmount)}</strong> credits</span>
                                    </div>
                                </div>
                                <div className="period_chart">
                                    {(() => {
                                        const maxValue = Math.max(...data.freeCreditStats.periodDistribution.map(d => d.count), 1);
                                        return data.freeCreditStats.periodDistribution.map((item, index) => {
                                        const height = (item.count / maxValue) * 100;
                                        const barColor = item.period === '소멸' ? '#FF6B6B' : (height < 50 ? '#BDBDBD' : '#53DCB1');
                                        return (
                                            <div key={index} className="bar_item">
                                                <div className="bar_wrapper">
                                                    <div
                                                        className="bar"
                                                        style={{
                                                            height: `${height}%`,
                                                            backgroundColor: barColor
                                                        }}
                                                    >
                                                        <span className="bar_tooltip">{item.count}</span>
                                                    </div>
                                                </div>
                                                <span className="label">{item.period}</span>
                                            </div>
                                        );
                                    });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card period_avg">
                        <h5>기간별 평균 크레딧 사용량</h5>
                        <div className="avg_values">
                            <div className="avg_item">
                                <span className="label">일 평균</span>
                                <span className="value">{formatNumber(data.averageUsage.dailyAverage)}</span>
                            </div>
                            <div className="avg_item">
                                <span className="label">주 평균</span>
                                <span className="value">{formatNumber(data.averageUsage.weeklyAverage)}</span>
                            </div>
                            <div className="avg_item">
                                <span className="label">월 평균</span>
                                <span
                                    className="value highlight">{formatNumber(data.averageUsage.monthlyAverage)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 크레딧 전체 사용현황 */}
            <div className={'total_usage_wrap'}>
                <h5>크레딧 전체 사용현황</h5>
                <div className="total_usage_section">
                    <div className="bar_chart_area">
                        {usageByGradeAll.map((item, index) => (
                            <div key={index} className="usage_bar_row">
                                <span className="plan_name">{item.gradeName}</span>
                                <div className="bar_container">
                                    <div
                                        className="usage_bar"
                                        style={{
                                            width: `${(item.totalUsed / maxGranted) * 100}%`,
                                            backgroundColor: getGradeColor(index).bar
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        <div className="x_axis">
                            {Array.from({length: 10}, (_, i) => Math.round((maxGranted / 9) * i)).map((val, i) => (
                                <span key={i}>{formatNumber(val)}</span>
                            ))}
                        </div>
                    </div>
                    <div className="usage_table_area">
                        <table className="usage_table">
                            <thead>
                            <tr>
                                <th>이용권</th>
                                <th>총지급</th>
                                <th>사용량</th>
                                <th>잔여량</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usageByGradeAll.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <span className="color_dot"
                                              style={{backgroundColor: getGradeColor(index).bar}}></span>
                                        {item.gradeName}
                                    </td>
                                    <td>{formatNumber(item.totalGranted)}</td>
                                    <td>{formatNumber(item.totalUsed)} ({item.usedRate.toFixed(1)}%)</td>
                                    <td>{formatNumber(item.totalRemaining)} ({item.remainingRate.toFixed(1)}%)</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
