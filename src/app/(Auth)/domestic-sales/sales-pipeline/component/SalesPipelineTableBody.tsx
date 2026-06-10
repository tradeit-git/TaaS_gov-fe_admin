'use client'

import {PipelineRow, GRADE_LABELS} from "@/app/(Auth)/domestic-sales/sales-pipeline/component/SalesPipelinePage";

interface Props {
    data: PipelineRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onManage: (row: PipelineRow) => void;
}

export default function SalesPipelineTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onManage}: Props) {
    return (
        <tbody>
        {data.length === 0 ? (
            <tr>
                <td colSpan={10} style={{textAlign: 'center', padding: '40px 0', color: '#999'}}>
                    등록된 영업 데이터가 없습니다.
                </td>
            </tr>
        ) : (
            data.map((row, i) => {
                const rowNum = totalElements - (currentPage * itemsPerPage) - i;
                return (
                    <tr key={row.id}>
                        <td>{rowNum}</td>
                        <td>{GRADE_LABELS[row.salesGrade] ?? row.salesGrade}</td>
                        <td>{row.customerName}</td>
                        <td>{row.salesType}</td>
                        <td>{row.bizNo}</td>
                        <td>{row.ceoName}</td>
                        <td>{row.activityCount}</td>
                        <td>{row.salesManager}</td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td className={'td_actions'}>
                            <div className={'actions_wrap'}>
                                <button type="button" className={'btn_detail'}
                                        onClick={() => onManage(row)}>관리</button>
                            </div>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
    );
}
