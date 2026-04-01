'use client'

import Link from "next/link";
import {UserRow} from "@/app/(Auth)/client/component/ClientPage";

interface Props {
    data: UserRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
}

export default function ClientTableBody({data, totalElements, currentPage, itemsPerPage, formatDate}: Props) {
    const formatPeriod = (row: UserRow) => {
        if (!row.planStartDate || !row.planEndDate) return '-';
        return `${formatDate(row.planStartDate)} ~ ${formatDate(row.planEndDate)} / ${row.planMonths ?? '-'}개월`;
    };

    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;

            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>
                        <span className={`status_badge ${row.status === '계약' ? 'active' : 'expired'}`}>
                            {row.status}
                        </span>
                    </td>
                    <td>{row.companyName}</td>
                    <td>{row.businessNumber}</td>
                    <td>{row.loginId}</td>
                    <td>{row.password}</td>
                    <td>{row.planName || '-'}</td>
                    <td>{formatPeriod(row)}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}>
                            <Link href={`/client/detail?id=${row.id}`}>상세</Link>
                        </button>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
