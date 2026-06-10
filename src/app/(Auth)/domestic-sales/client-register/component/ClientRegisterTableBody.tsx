'use client'

import {ClientRow} from "@/app/(Auth)/domestic-sales/client-register/component/ClientRegisterPage";

interface Props {
    data: ClientRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onEdit: (row: ClientRow) => void;
    onDelete: (id: number) => void;
}

export default function ClientRegisterTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onEdit, onDelete}: Props) {
    return (
        <tbody>
        {data.length === 0 ? (
            <tr>
                <td colSpan={8} style={{textAlign: 'center', padding: '40px 0', color: '#999'}}>
                    등록된 고객사가 없습니다.
                </td>
            </tr>
        ) : (
            data.map((row, i) => {
                const rowNum = totalElements - (currentPage * itemsPerPage) - i;
                const region = [row.sidoName, row.sigunguName].filter(Boolean).join(' ') || '-';
                return (
                    <tr key={row.id}>
                        <td>{rowNum}</td>
                        <td>{row.name}</td>
                        <td>{row.bizNo}</td>
                        <td>{row.ceoName}</td>
                        <td>{region}</td>
                        <td>{row.bizField || '-'}</td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td className={'td_actions'}>
                            <div className={'actions_wrap'}>
                                <button type="button" className={'btn_detail'}
                                        onClick={() => onEdit(row)}>수정</button>
                                <button type="button" className={'btn_detail'}
                                        onClick={() => onDelete(row.id)}>삭제</button>
                            </div>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
    );
}
