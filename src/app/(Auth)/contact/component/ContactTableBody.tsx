'use client'

import Link from "next/link";
import {InquiryRow} from "@/app/(Auth)/contact/component/ContactPage";
import {formatDateTimeDot} from "@/utill/format";

interface Props {
    data: InquiryRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    statusMap: Record<string, string>;
    formatDate: (date: string | null | undefined) => string;
}

export default function ContactTableBody({data, totalElements, currentPage, itemsPerPage, statusMap, formatDate}: Props) {
    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const statusLabel = statusMap[row.status] || row.status;
            const statusClass = row.status === 'COMPLETED' ? 'done' : row.status === 'IN_PROGRESS' ? 'progress' : 'pending';

            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>{row.companyName}</td>
                    <td>{row.name}</td>
                    <td>{row.department}</td>
                    <td>{row.position}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.mobile}</td>
                    <td>{row.email}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.readAt ? formatDateTimeDot(row.readAt) : '-'}</td>
                    <td>
                        <span className={`status_badge ${statusClass}`}>
                            <span className={'admin_icon'}/> {statusLabel}
                        </span>
                    </td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}>
                            <Link href={`/contact/detail?id=${row.id}`}>상세</Link>
                        </button>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}