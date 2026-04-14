'use client'

import {useRouter} from "next/navigation";
import {TrialKeyRow} from "@/app/(Auth)/trial/component/TrialPage";

interface Props {
    data: TrialKeyRow[];
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
}

const isInOperation = (startDate: string, endDate: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return startDate <= today && today <= endDate;
};

export default function TrialTableBody({data, formatDate, onDelete}: Props) {
    const router = useRouter();
    return (
        <tbody>
        {data.map((row, i) => (
            <tr key={row.id}>
                <td>{data.length - i}</td>
                <td>{row.trialName}</td>
                <td>
                    <span className={'trial_key'}>{row.trialKey}</span>
                    {isInOperation(row.startDate, row.endDate) && (
                        <a className={'btn_link'}
                           href={`https://www.tradeit.co.kr/trial-sign/${row.trialKey}`}
                           target="_blank" rel="noopener noreferrer"
                           title="체험 가입 페이지 열기">↗</a>
                    )}
                </td>
                <td>{row.creditAmount.toLocaleString()}</td>
                <td>{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</td>
                <td>{row.usedCount}</td>
                <td>{formatDate(row.createdAt)}</td>
                <td className={'td_actions'}>
                    <button type="button" className={'btn_detail'}
                            onClick={() => router.push(`/trial/${row.id}/user-list`)}>가입명단</button>
                    <button type="button" className={'btn_delete'} onClick={() => onDelete(row.id)}>
                        <span className={'admin_icon icon_trash'}/>
                    </button>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
