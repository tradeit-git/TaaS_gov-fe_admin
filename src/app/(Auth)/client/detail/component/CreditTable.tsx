'use client';

import FormRow from './FormRow';
import FormAdd from './FormAdd';

export interface CreditRow {
    id: number;
    apiId?: number;        // 서버 PK (기존 회차)
    rowNumber: number;
    date: string;          // scheduledDate
    credit: string;        // amount (콤마 포맷)
    status: string;        // ACTIVE=지급완료, SCHEDULED=미지급
}

interface Props {
    rows: CreditRow[];
    serviceStartDate: string;
    serviceEndDate: string;
    disabled?: boolean;
    onAdd: () => void;
    onDelete: (id: number) => void;
    onDateChange: (id: number, date: string) => void;
    onCreditChange: (id: number, credit: string) => void;
}

export default function CreditTable({rows, serviceStartDate, serviceEndDate, disabled, onAdd, onDelete, onDateChange, onCreditChange}: Props) {
    return (
        <table>
            <colgroup>
                <col style={{width: 74}}/>
                <col style={{width: 158}}/>
                <col style={{width: 200}}/>
                <col style={{width: 90}}/>
            </colgroup>
            <tbody>
            {rows.map((row) => (
                <FormRow
                    key={row.id}
                    rowNumber={row.rowNumber}
                    date={row.date}
                    credit={row.credit}
                    paid={row.status !== 'SCHEDULED'}
                    minDate={serviceStartDate}
                    maxDate={serviceEndDate}
                    onDelete={() => onDelete(row.id)}
                    onDateChange={(date) => onDateChange(row.id, date)}
                    onCreditChange={(credit) => onCreditChange(row.id, credit)}
                />
            ))}
            {!disabled && <FormAdd onAdd={onAdd}/>}
            </tbody>
        </table>
    );
}
