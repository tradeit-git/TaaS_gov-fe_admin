'use client'

import Link from "next/link";

interface TrialRow {
    program: string;
    domain: string;
    credit: number;
    startDate: string;
    endDate: string;
    signupCount: number;
    createdAt: string;
}

const mockData: TrialRow[] = [
    {
        program: '경기지역 FTA 통상진흥센터',
        domain: 'ggfta',
        credit: 1000,
        startDate: '2026.05.01',
        endDate: '2026.05.05',
        signupCount: 0,
        createdAt: '2026.04.30',
    },
    {
        program: '부산테크노파크',
        domain: 'btp',
        credit: 500,
        startDate: '2026.05.01',
        endDate: '2025.05.03',
        signupCount: 40,
        createdAt: '2026.04.29',
    },
];

export default function TrialTableBody() {
    return (
        <tbody>
        {mockData.map((row, i) => (
            <tr key={i}>
                <td>{mockData.length - i}</td>
                <td>{row.program}</td>
                <td>{row.domain}</td>
                <td>{row.credit.toLocaleString()}</td>
                <td>{row.startDate} ~ {row.endDate}</td>
                <td>{row.signupCount}</td>
                <td>{row.createdAt}</td>
                <td className={'td_actions'}>
                    <button type="button" className={'btn_detail'}>
                        <Link href={'/trial/userList'}>가입명단</Link>
                    </button>
                    <button type="button" className={'btn_delete'}>
                        <span className={'admin_icon icon_trash'}/>
                    </button>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
