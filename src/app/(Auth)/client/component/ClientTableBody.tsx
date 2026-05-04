'use client'

import {useRouter} from "next/navigation";
import {UserRow} from "@/app/(Auth)/client/component/ClientPage";

interface Props {
    data: UserRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, currentStatus: string) => void;
}

export default function ClientTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDelete, onToggleStatus}: Props) {
    const router = useRouter();
    const formatPeriod = (row: UserRow) => {
        if (!row.planStartDate || !row.planEndDate) return '-';
        return `${formatDate(row.planStartDate)} ~ ${formatDate(row.planEndDate)} / ${row.planMonths ?? '-'}개월`;
    };
    console.log(data)
    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            const isActive = (row.userStatus ?? 'ACTIVE') === 'ACTIVE';

            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>
                        <label className={'toggle_switch'}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => onToggleStatus(row.id, row.userStatus ?? 'ACTIVE')}
                            />
                            <span className={'toggle_slider'}/>
                            <span className={`toggle_label ${isActive ? 'on' : 'off'}`}>
                                {isActive ? 'ON' : 'OFF'}
                            </span>
                        </label>
                    </td>
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
                    <td>{(row.creditBalance ?? 0).toLocaleString()}</td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        <button type="button" className={'btn_detail'}
                                onClick={() => router.push(`/client/${row.id}`)}>상세</button>
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
