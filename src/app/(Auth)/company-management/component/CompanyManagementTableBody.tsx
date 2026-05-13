'use client'

import {useRouter} from "next/navigation";
import {CompanyRow} from "@/app/(Auth)/company-management/component/CompanyManagementPage";

interface Props {
    data: CompanyRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
}

export default function CompanyManagementTableBody({data, totalElements, currentPage, itemsPerPage, formatDate}: Props) {
    const router = useRouter();

    const formatPeriod = (row: CompanyRow) => {
        if (!row.planStartDate || !row.planEndDate) return '-';
        return `${formatDate(row.planStartDate)} ~ ${formatDate(row.planEndDate)}`;
    };

    const formatDeptPosition = (row: CompanyRow) => {
        const parts = [row.department, row.position].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const isFree = (row.planName || '').toLowerCase().includes('free');
            return (
                <tr key={row.id} style={isFree ? {backgroundColor: '#F5F5F5'} : undefined}>
                    <td>{rowNum}</td>
                    <td>{row.companyName}</td>
                    <td>{row.loginId}</td>
                    <td>{row.name}</td>
                    <td>{formatDeptPosition(row)}</td>
                    <td>{row.planName || '-'}</td>
                    <td>{row.paymentMethod || '-'}</td>
                    <td>{formatPeriod(row)}</td>
                    <td>{row.affiliationName || '-'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}
                                onClick={() => router.push(`/company-management/${row.id}`)}>상세</button>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}