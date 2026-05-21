'use client'

import {useEffect, useState} from "react";
import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

interface DailyPoint {
    name: string; // 일자 ("01" ~ "31")
    uv: number;   // 가입자수
}

// 이번 달 일자별 가입자수 목업 데이터 (1~9)
const buildMockData = (): DailyPoint[] => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mockCounts = [2, 4, 3, 5, 6, 4, 7, 5, 8, 6, 9, 7, 5, 6, 8, 4, 3, 5, 7, 9, 6, 4, 2, 3, 5, 7, 8, 6, 4, 3, 2];

    return Array.from({length: daysInMonth}).map((_, i) => ({
        name: String(i + 1).padStart(2, "0"),
        uv: mockCounts[i] ?? 0,
    }));
};

export default function DailySignupChart() {
    const data = buildMockData();

    const tickStyle = {fill: '#6A7075', fontSize: 11};

    // 화면 폭에 따라 X축 라벨 간격 조절 (모바일에서 31개 라벨 겹침 방지)
    const [tickInterval, setTickInterval] = useState<number>(0);
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            // 좁을수록 라벨을 듬성듬성 표시
            setTickInterval(w < 480 ? 5 : w < 768 ? 3 : w < 1024 ? 1 : 0);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div className="chart_container">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{top: 20, right: 10, left: -20, bottom: 0}}>
                    <defs>
                        <linearGradient id="dailyAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#bdd7ff" stopOpacity={1}/>
                            <stop offset="100%" stopColor="rgba(43,127,255,0)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" interval={tickInterval} tick={tickStyle} tickLine={false}
                           axisLine={false} minTickGap={4}/>
                    <YAxis allowDecimals={false} domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9]} tick={tickStyle}
                           tickLine={false} axisLine={false}/>
                    <Tooltip/>
                    <Area type="monotone" dataKey="uv" name="가입자수" stroke="#2B7FFF" fill="url(#dailyAreaFill)"
                          fillOpacity={1}/>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
