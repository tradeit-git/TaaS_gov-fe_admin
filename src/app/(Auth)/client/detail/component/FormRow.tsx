'use client';

import { useState } from 'react';

interface FormRowProps {
    rowNumber: number;
    onDelete: () => void;
    defaultDate?: string;
    defaultCredit?: string;
}

export default function FormRow({ rowNumber, onDelete, defaultDate = '', defaultCredit = '' }: FormRowProps) {
    const [date, setDate] = useState(defaultDate);

    const isPaid = () => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate < today;
    };

    const isCompleted = isPaid();

    return (
        <tr className={'form_row'}>
            <td>{String(rowNumber).padStart(2, '0')}회차</td>
            <td>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isCompleted}
                />
            </td>
            <td>
                <input
                    type="text"
                    defaultValue={defaultCredit}
                    disabled={isCompleted}
                />
                크레딧
            </td>
            <td style={{ textAlign: 'center' }}>
                {isCompleted ? (
                    <div>
                        <span className={'icon'}/>
                        지급완료
                    </div>
                ) : (
                    <button className={'delete_btn'} onClick={onDelete}>삭제</button>
                )}
            </td>
        </tr>
    )
}