'use client'

import {useRouter} from "next/navigation";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/PartnerPage";

interface Props {
    data: PartnerRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
}

const getStatus = (startDate: string, endDate: string): { label: string; className: string } => {
    const today = new Date().toISOString().slice(0, 10);
    if (startDate > today) return {label: '예정', className: 'upcoming'};
    if (today <= endDate) return {label: '진행', className: 'active'};
    return {label: '종료', className: 'expired'};
};

export default function PartnerTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDelete}: Props) {
    const router = useRouter();
    return (
        <tbody>
        {data.map((row, i) => {
            const status = getStatus(row.startDate, row.endDate);
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            return (
                <tr key={row.id}>
                    <td style={{textAlign: 'center'}}>{rowNum}</td>
                    <td>
                        <span className={`status_badge ${status.className}`}>{status.label}</span>
                    </td>
                    <td>{row.partnerName}</td>
                    <td>
                        <span className={'partner_key'}>{row.partnerKey}</span>
                        <a className={'btn_link'}
                           href={`https://www.tradeit.co.kr/partner/${row.partnerKey}`}
                           target="_blank" rel="noopener noreferrer"
                           title="제휴 가입 페이지 열기">↗</a>
                    </td>
                    <td>+{row.creditAmount}%</td>
                    <td>{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</td>
                    <td>{row.usedCount.toLocaleString()}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        {row.usedCount === 0 ? (
                            <button type="button" className={'btn_delete_text'}
                                    onClick={() => onDelete(row.id)}>삭제</button>
                        ) : (
                            <button type="button" className={'btn_detail'}
                                    onClick={() => router.push(`/partner-management/${row.id}/user-list`)}>가입명단</button>
                        )}
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
