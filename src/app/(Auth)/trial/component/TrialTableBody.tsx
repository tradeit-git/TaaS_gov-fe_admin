'use client'

import Link from "next/link";
import {TrialKeyRow} from "@/app/(Auth)/trial/component/TrialPage";

interface Props {
    data: TrialKeyRow[];
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
}

export default function TrialTableBody({data, formatDate, onDelete}: Props) {
    return (
        <tbody>
        {data.map((row, i) => (
            <tr key={row.id}>
                <td>{data.length - i}</td>
                <td>{row.trialName}</td>
                <td>{row.trialKey}</td>
                <td>{row.creditAmount.toLocaleString()}</td>
                <td>{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</td>
                <td>{row.usedCount}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td className={'td_actions'}>
                    <button type="button" className={'btn_detail'}>
                        <Link href={`/trial/user-list?id=${row.id}&name=${encodeURIComponent(row.trialName)}`}>가입명단</Link>
                    </button>
                    <button type="button" className={'btn_delete'} onClick={() => onDelete(row.id)}>
                        <span className={'admin_icon icon_trash'}/>
                    </button>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
