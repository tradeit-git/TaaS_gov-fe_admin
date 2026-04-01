'use client';

import { useState } from 'react';
import FormRow from './FormRow';
import FormAdd from './FormAdd';

interface CreditRow {
    id: number;
    rowNumber: number;
    date: string;
    credit: string;
}

export default function CreditTable() {
    // 임시 데이터: 1회차는 지급완료(과거 날짜), 2회차는 미지급(미래 날짜)
    const [rows, setRows] = useState<CreditRow[]>([
        { id: 1, rowNumber: 1, date: '2026-02-01', credit: '100,000' },
        { id: 2, rowNumber: 2, date: '2026-05-01', credit: '100,000' },
    ]);

    const handleAdd = () => {
        const newRowNumber = rows.length > 0 ? Math.max(...rows.map(r => r.rowNumber)) + 1 : 1;
        setRows([...rows, { id: Date.now(), rowNumber: newRowNumber, date: '', credit: '' }]);
    };

    const handleDelete = (id: number) => {
        setRows(rows.filter(row => row.id !== id));
    };

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
                        onDelete={() => handleDelete(row.id)}
                        defaultDate={row.date}
                        defaultCredit={row.credit}
                    />
                ))}
                <FormAdd onAdd={handleAdd} />
            </tbody>
        </table>
    );
}