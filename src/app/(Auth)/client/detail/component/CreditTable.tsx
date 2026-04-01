'use client';

import { useState } from 'react';
import FormRow from './FormRow';
import FormAdd from './FormAdd';

export default function CreditTable() {
    const [rows, setRows] = useState<number[]>([]);

    const handleAdd = () => {
        setRows([...rows, rows.length + 1]);
    };

    const handleDelete = (index: number) => {
        setRows(rows.filter((_, i) => i !== index));
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
            {rows.map((row, index) => (
                    <FormRow
                        key={index}
                        rowNumber={row}
                        onDelete={() => handleDelete(index)}
                    />
                ))}
                <FormAdd onAdd={handleAdd} />
            </tbody>
        </table>
    );
}