'use client'

import {Cell, Pie, PieChart, ResponsiveContainer} from "recharts";
import {PlanUsage} from "@/app/(Dashboard)/partner-management/dashboard/types";

// 플랜 항목 색상 팔레트 (legend/도넛 공용, 인덱스 순환)
export const PLAN_PALETTE = ['#C5CAFC', '#B8DFB0', '#9CCDFC', '#F6CE8F', '#F4A8A8', '#A8D8D8', '#D9B8F0', '#F5C6E0'];

export default function PlanSignupChart({planUsage}: { planUsage: PlanUsage[] }) {
    const data = planUsage.map(p => ({name: p.planName, value: p.count}));

    return (
        <div className="plan_chart_container">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                        {data.map((entry, i) => (
                            <Cell key={entry.name} fill={PLAN_PALETTE[i % PLAN_PALETTE.length]} stroke="none"/>
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
