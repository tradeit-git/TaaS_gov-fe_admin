'use client'

import {useRouter} from "next/navigation";
import {CompanyRow} from "@/app/(Auth)/users/component/CompanyManagementPage";

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

    const formatDeptPosition = (row: CompanyRow) => {
        const parts = [row.department, row.position].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    const isTrial = (row: CompanyRow) => {
        if (row.planStartDate && row.planEndDate) return false;
        if (!row.createdAt) return false;
        const created = new Date(row.createdAt);
        if (isNaN(created.getTime())) return false;
        const oneMonthLater = new Date(created);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        return new Date() < oneMonthLater;
    };

    const formatPlanName = (row: CompanyRow) => {
        if (row.planName === 'Free' && isTrial(row)) return 'Free(30day trial)';
        return row.planName || '-';
    };

    const formatPeriod = (row: CompanyRow) => {
        if (row.planStartDate && row.planEndDate) {
            return `${formatDate(row.planStartDate)} ~ ${formatDate(row.planEndDate)}`;
        }
        if (isTrial(row)) {
            const created = new Date(row.createdAt);
            const oneMonthLater = new Date(created);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            return `${formatDate(row.createdAt)} ~ ${formatDate(oneMonthLater.toISOString())}`;
        }
        return '-';
    };

    return (
        <tbody>
        {data.length === 0 ? (
            <tr>
                <td colSpan={11} style={{textAlign: 'center'}}>가입회원사가 없습니다.</td>
            </tr>
        ) : (
            data.map((row, i) => {
                const rowNum = totalElements - (currentPage * itemsPerPage) - i;
                const planName = formatPlanName(row);
                const period = formatPeriod(row);
                const deptPosition = formatDeptPosition(row);
                return (
                    <tr key={row.id}>
                        <td style={ellipsisStyle} title={String(rowNum)}>{rowNum}</td>
                        <td style={ellipsisStyle} title={row.companyName || '-'}>{row.companyName || '-'}</td>
                        <td style={ellipsisStyle} title={row.loginId}>{row.loginId}</td>
                        <td style={ellipsisStyle} title={row.name}>{row.name}</td>
                        <td style={ellipsisStyle} title={deptPosition}>{deptPosition}</td>
                        <td style={ellipsisStyle} title={planName}>{planName}</td>
                        <td style={ellipsisStyle} title={row.paymentMethodName ?? '-'}>{row.paymentMethodName ?? '-'}</td>
                        <td style={ellipsisStyle} title={period}>{period}</td>
                        <td style={ellipsisStyle} title={row.partnerName || '-'}>{row.partnerName || '-'}</td>
                        <td style={ellipsisStyle} title={formatDate(row.createdAt)}>{formatDate(row.createdAt)}</td>
                        <td className={'td_actions'}>
                            <button type="button" className={'btn_detail'}
                                    onClick={() => router.push(`/users/${row.id}`)}>상세</button>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
    );
}