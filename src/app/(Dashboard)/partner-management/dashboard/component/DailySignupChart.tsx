'use client'

import {useEffect, useState} from "react";
import {Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {DailySignup} from "@/app/(Dashboard)/partner-management/dashboard/types";

export default function DailySignupChart({data}: { data: DailySignup[] }) {
    const chartData = data.map(d => ({
        name: String(d.day).padStart(2, "0"),
        uv: d.count,
    }));

    const tickStyle = {fill: '#6A7075', fontSize: 11};

    // 화면 폭에 따라 X축 라벨 간격 조절 (모바일에서 31개 라벨 겹침 방지)
    const [tickInterval, setTickInterval] = useState<number>(0);
    useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            setTickInterval(w < 480 ? 5 : w < 768 ? 3 : w < 1024 ? 1 : 0);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <div className="chart_container">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{top: 20, right: 10, left: -20, bottom: 0}}>
                    <defs>
                        <linearGradient id="dailyAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#bdd7ff" stopOpacity={1}/>
                            <stop offset="100%" stopColor="rgba(43,127,255,0)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" interval={tickInterval} tick={tickStyle} tickLine={false}
                           axisLine={false} minTickGap={4}/>
                    <YAxis allowDecimals={false} domain={[0, 'auto']} tick={tickStyle}
                           tickLine={false} axisLine={false}/>
                    <Tooltip/>
                    <Area type="monotone" dataKey="uv" name="가입자수" stroke="#2B7FFF" fill="url(#dailyAreaFill)"
                          fillOpacity={1}/>
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
