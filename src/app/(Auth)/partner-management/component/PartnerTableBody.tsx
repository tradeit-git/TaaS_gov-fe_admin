'use client'

import {useRouter} from "next/navigation";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/types";

interface Props {
    data: PartnerRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
    onEdit: (row: PartnerRow) => void;
    onToggleFavorite: (row: PartnerRow) => void;
    basePath: string;
    /** 목록의 현재 검색조건. 가입명단에서 "목록으로" 가 이 상태로 돌아오게 실어 보낸다. */
    listQuery: string;
    /** 보너스 크레딧 컬럼 노출 여부 (PoC 목록에서는 숨긴다) */
    showCredit?: boolean;
}

const getStatus = (startDate: string, endDate: string): { label: string; className: string } => {
    const today = new Date().toISOString().slice(0, 10);
    if (startDate > today) return {label: '예정', className: 'upcoming'};
    if (today <= endDate) return {label: '진행', className: 'active'};
    return {label: '종료', className: 'expired'};
};

export default function PartnerTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDelete, onEdit, onToggleFavorite, basePath, listQuery, showCredit = true}: Props) {
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
                    <td style={{textAlign: 'center'}}>
                        <button type="button"
                                className={`btn_favorite ${row.favorite ? 'on' : ''}`}
                                title={row.favorite ? '즐겨찾기 해제' : '즐겨찾기'}
                                onClick={() => onToggleFavorite(row)}>{row.favorite ? '★' : '☆'}</button>
                    </td>
                    <td style={{textAlign: 'center'}}>{rowNum}</td>
                    <td>
                        <span className={`status_badge ${status.className}`}>{status.label}</span>
                    </td>
                    <td className={'td_logo'}>
                        {row.logoUrl
                            ? <img src={row.logoUrl} alt={row.partnerName} className={'partner_logo'}/>
                            : <span className={'partner_logo_empty'}/>}
                    </td>
                    <td className={'td_ellipsis'} title={row.partnerName}>{row.partnerName}</td>
                    <td className={'td_ellipsis'} title={row.partnerKey}>
                        <span className={'partner_key'}>{row.partnerKey}</span>
                    </td>
                    <td>{formatDate(row.startDate)} ~ {formatDate(row.endDate)}</td>
                    <td>{row.maxMembers === 0 ? '인원제한없음' : `${row.maxMembers.toLocaleString()}`}</td>
                    {showCredit && <td>{row.creditAmount}%</td>}
                    <td className={'td_ellipsis'} title={row.dashboardCode || ''}>{row.dashboardCode || '-'}</td>
                    <td>{row.usedCount.toLocaleString()}</td>
                    <td>{row.approvedCount.toLocaleString()}</td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_action btn_dark'}
                                onClick={() => window.open(partnerBase, '_blank')}>랜딩</button>
                        <button type="button" className={'btn_action'}
                                onClick={() => window.open(`${partnerBase}/dashboard`, '_blank')}>대시보드</button>
                        <button type="button" className={'btn_action'}
                                onClick={() => router.push(
                                    `${basePath}/${row.id}/user-list${listQuery ? `?from=${encodeURIComponent(listQuery)}` : ''}`,
                                )}>가입명단</button>
                        <button type="button" className={'btn_action'} onClick={() => onEdit(row)}>수정</button>
                        {row.usedCount === 0 && (
                            <button type="button" className={'btn_action btn_delete_text'}
                                    onClick={() => onDelete(row.id)}>삭제</button>
                        )}
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
