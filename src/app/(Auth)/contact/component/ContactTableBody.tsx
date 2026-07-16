'use client'

import {useRouter} from "next/navigation";
import {InquiryRow} from "@/app/(Auth)/contact/component/ContactPage";
import {formatDateTimeDot} from "@/utill/format";

interface Props {
    data: InquiryRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    statusMap: Record<string, string>;
    typeMap: Record<string, string>;
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
}

export default function ContactTableBody({data, totalElements, currentPage, itemsPerPage, statusMap, typeMap, formatDate, onDelete}: Props) {
    const router = useRouter();
    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const statusLabel = statusMap[row.status] || row.status;
            const statusClass = row.status === 'COMPLETED' ? 'done' : row.status === 'IN_PROGRESS' ? 'progress' : 'pending';
            const isCrm = row.inquiryType === 'CRM_1ON1';
            const typeLabel = typeMap[row.inquiryType] || row.inquiryType;

            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td><span className={`type_badge ${isCrm ? 'crm' : 'partnership'}`}>{typeLabel}</span></td>
                    <td>{row.companyName || '-'}</td>
                    <td>{row.name || '-'}</td>
                    <td>{row.department || '-'}</td>
                    <td>{row.position || '-'}</td>
                    <td>{row.phone || '-'}</td>
                    <td>{row.mobile || '-'}</td>
                    <td>{row.email || '-'}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.readAt ? formatDateTimeDot(row.readAt) : '-'}</td>
                    <td>
                        <span className={`status_badge ${statusClass}`}>
                            <span className={'admin_icon'}/> {statusLabel}
                        </span>
                    </td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}
                                onClick={() => router.push(`/contact/${row.id}`)}>상세</button>
                        <button type="button" className={'btn_delete'} onClick={() => onDelete(row.id)}>
                            <span className={'admin_icon icon_trash'}/>
                        </button>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}