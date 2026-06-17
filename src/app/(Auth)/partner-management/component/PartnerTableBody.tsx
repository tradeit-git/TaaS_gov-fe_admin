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
    onEdit: (row: PartnerRow) => void;
}

const getStatus = (startDate: string, endDate: string): { label: string; className: string } => {
    const today = new Date().toISOString().slice(0, 10);
    if (startDate > today) return {label: '예정', className: 'upcoming'};
    if (today <= endDate) return {label: '진행', className: 'active'};
    return {label: '종료', className: 'expired'};
};

export default function PartnerTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDelete, onEdit}: Props) {
    const router = useRouter();
    const frontUrl = process.env.NEXT_PUBLIC_FRONT_URL ?? '';
    return (
        <tbody>
        {data.map((row, i) => {
            const status = getStatus(row.startDate, row.endDate);
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const partnerBase = `${frontUrl}/partner/${row.partnerKey}`;
            return (
                <tr key={row.id}>
                    <td style={{textAlign: 'center'}}>{rowNum}</td>
                    <td>
                        <span className={`status_badge ${status.className}`}>{status.label}</span>
                    </td>
                    <td>{row.partnerName}</td>
                    <td className={'td_logo'}>
                        {row.logoUrl
                            ? <img src={row.logoUrl} alt={row.partnerName} className={'partner_logo'}/>
                            : <span className={'partner_logo_empty'}>No Image</span>}
                    </td>
                    <td>
                        <span className={'partner_key'}>{row.partnerKey}</span>
                    </td>
                    <td>{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</td>
                    <td>+{row.creditAmount}%</td>
                    <td>{row.maxMembers === 0 ? '무제한' : `${row.maxMembers.toLocaleString()}명`}</td>
                    <td>{row.signupCredit.toLocaleString()}</td>
                    <td>{row.usedCount.toLocaleString()}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        <a className={'btn_action'} href={partnerBase}
                           target="_blank" rel="noopener noreferrer"
                           title="협회제휴 랜딩페이지 열기">랜딩페이지</a>
                        <a className={'btn_action'} href={`${partnerBase}/join`}
                           target="_blank" rel="noopener noreferrer"
                           title="협회제휴 가입페이지 열기">가입페이지</a>
                        <a className={'btn_action'} href={`${partnerBase}/dashboard`}
                           target="_blank" rel="noopener noreferrer"
                           title="협회제휴 대시보드 열기">대시보드</a>
                        <button type="button" className={'btn_action'} onClick={() => onEdit(row)}>수정</button>
                        {row.usedCount === 0 ? (
                            <button type="button" className={'btn_delete_text'}
                                    onClick={() => onDelete(row.id)}>삭제</button>
                        ) : (
                            <button type="button" className={'btn_action'}
                                    onClick={() => router.push(`/partner-management/${row.id}/user-list`)}>가입명단</button>
                        )}
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
