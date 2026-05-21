'use client'

import {Cell, Pie, PieChart, ResponsiveContainer} from "recharts";

// 플랜별 가입현황 목업 데이터
const data = [
    {name: 'Free', value: 76, gradient: 'url(#planFree)'},
    {name: '팀', value: 102, gradient: 'url(#planTeam)'},
    {name: '개인', value: 51, gradient: 'url(#planPersonal)'},
    {name: '기업', value: 25, gradient: 'url(#planEnter)'},
];

export default function PlanSignupChart() {
    return (
        <div className="plan_chart_container">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        {/* free: linear-gradient(55deg, #CDD3FF, #C5CAFC) */}
                        <linearGradient id="planFree" gradientTransform="rotate(-35 0.5 0.5)">
                            <stop offset="0%" stopColor="#CDD3FF"/>
                            <stop offset="100%" stopColor="#C5CAFC"/>
                        </linearGradient>
                        {/* 팀: linear-gradient(-49deg, #BFDFB4, #B8DFB0) */}
                        <linearGradient id="planTeam" gradientTransform="rotate(-139 0.5 0.5)">
                            <stop offset="0%" stopColor="#BFDFB4"/>
                            <stop offset="100%" stopColor="#B8DFB0"/>
                        </linearGradient>
                        {/* 개인: linear-gradient(134deg, #9ECFFE, #9CCDFC) */}
                        <linearGradient id="planPersonal" gradientTransform="rotate(44 0.5 0.5)">
                            <stop offset="0%" stopColor="#9ECFFE"/>
                            <stop offset="100%" stopColor="#9CCDFC"/>
                        </linearGradient>
                        {/* 기업: linear-gradient(-107deg, #F7D9AF, #F6CE8F) */}
                        <linearGradient id="planEnter" gradientTransform="rotate(-197 0.5 0.5)">
                            <stop offset="0%" stopColor="#F7D9AF"/>
                            <stop offset="100%" stopColor="#F6CE8F"/>
                        </linearGradient>
                    </defs>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={80}
                        cornerRadius={4}
                        paddingAngle={5}
                        isAnimationActive={false}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={entry.gradient} stroke="none"/>
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
