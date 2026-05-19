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

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
};

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
            const period = formatPeriod(row);
            const deptPosition = formatDeptPosition(row);
            return (
                <tr key={row.id} style={isFree ? {backgroundColor: '#F5F5F5'} : undefined}>
                    <td style={ellipsisStyle} title={String(rowNum)}>{rowNum}</td>
                    <td style={ellipsisStyle} title={row.companyName}>{row.companyName}</td>
                    <td style={ellipsisStyle} title={row.loginId}>{row.loginId}</td>
                    <td style={ellipsisStyle} title={row.name}>{row.name}</td>
                    <td style={ellipsisStyle} title={deptPosition}>{deptPosition}</td>
                    <td style={ellipsisStyle} title={row.planName || '-'}>{row.planName || '-'}</td>
                    <td style={ellipsisStyle} title={row.paymentMethod || '-'}>{row.paymentMethod || '-'}</td>
                    <td style={ellipsisStyle} title={period}>{period}</td>
                    <td style={ellipsisStyle} title={row.affiliationName || '-'}>{row.affiliationName || '-'}</td>
                    <td style={ellipsisStyle} title={formatDate(row.createdAt)}>{formatDate(row.createdAt)}</td>
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