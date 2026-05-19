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
                return (
                    <tr key={row.id}>
                        <td>{rowNum}</td>
                        <td>{row.companyName || '-'}</td>
                        <td>{row.loginId}</td>
                        <td>{row.name}</td>
                        <td>{formatDeptPosition(row)}</td>
                        <td>{formatPlanName(row)}</td>
                        <td>{row.paymentMethodName ?? '-'}</td>
                        <td>{formatPeriod(row)}</td>
                        <td>{row.partnerName || '-'}</td>
                        <td>{formatDate(row.createdAt)}</td>
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