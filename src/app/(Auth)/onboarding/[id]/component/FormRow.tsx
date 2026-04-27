'use client';

import {formatNumber} from "@/utill/format";

interface FormRowProps {
    rowNumber: number;
    date: string;
    credit: string;
    paid: boolean;
    minDate: string;
    maxDate: string;
    onDelete: () => void;
    onDateChange: (date: string) => void;
    onCreditChange: (credit: string) => void;
}

export default function FormRow({rowNumber, date, credit, paid, minDate, maxDate, onDelete, onDateChange, onCreditChange}: FormRowProps) {
    return (
        <tr className={'form_row'}>
            <td>{String(rowNumber).padStart(2, '0')}회차</td>
            <td>
                <input
                    type="date"
                    value={date}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    disabled={paid}
                />
            </td>
            <td>
                <input
                    type="text"
                    value={credit}
                    onChange={(e) => onCreditChange(formatNumber(e.target.value))}
                    disabled={paid}
                />
                크레딧
            </td>
            <td style={{textAlign: 'center'}}>
                {paid ? (
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
