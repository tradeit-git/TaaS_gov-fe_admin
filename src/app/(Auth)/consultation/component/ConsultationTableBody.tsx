'use client'

import {useRouter} from "next/navigation";
import {ConsultationRow} from "@/app/(Auth)/consultation/component/ConsultationPage";

interface Props {
    data: ConsultationRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    statusMap: Record<string, string>;
    formatDate: (date: string | null | undefined) => string;
}

export default function ConsultationTableBody({data, totalElements, currentPage, itemsPerPage, statusMap, formatDate}: Props) {
    const router = useRouter();
    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const statusLabel = statusMap[row.status] || row.status;
            const statusClass = row.status === 'COMPLETED' ? 'done' : row.status === 'IN_PROGRESS' ? 'progress' : 'pending';

            return (
                <tr key={row.id}>
                    <td style={{textAlign: 'center'}}>{rowNum}</td>
                    <td>{row.companyName || '-'}</td>
                    <td>{row.name || '-'}</td>
                    <td>{row.department || '-'}</td>
                    <td>{row.position || '-'}</td>
                    <td>{row.phone || '-'}</td>
                    <td className={'td_email'} title={row.email || ''}>{row.email || '-'}</td>
                    <td>{row.adConsent ? '동의' : '미동의'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                        <span className={`status_badge ${statusClass}`}>
                            <span className={'admin_icon'}/> {statusLabel}
                        </span>
                    </td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}
                                onClick={() => router.push(`/consultation/${row.id}`)}>상세</button>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
