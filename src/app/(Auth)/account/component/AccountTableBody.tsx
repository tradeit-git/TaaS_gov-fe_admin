'use client'

import {useState} from "react";
import {useRouter} from "next/navigation";
import {AccountRow} from "@/app/(Auth)/account/component/AccountPage";

interface Props {
    data: AccountRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onCharge: (id: number, amount: number) => void;
    onDeduct: (id: number, amount: number) => void;
    onDelete: (id: number) => void;
}

interface RowProps {
    row: AccountRow;
    rowNum: number;
    formatDate: (date: string | null | undefined) => string;
    onCharge: (id: number, amount: number) => void;
    onDeduct: (id: number, amount: number) => void;
    onDelete: (id: number) => void;
}

function AccountTableRow({row, rowNum, formatDate, onCharge, onDeduct, onDelete}: RowProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');

    const handleCharge = () => {
        const value = Number(amount);
        if (!value) return;
        onCharge(row.id, value);
        setAmount('');
    };

    const handleDeduct = () => {
        const value = Number(amount);
        if (!value) return;
        onDeduct(row.id, value);
        setAmount('');
    };

    return (
        <tr>
            <td style={{textAlign: 'center'}}>{rowNum}</td>
            <td>{row.email}</td>
            <td>{row.name}</td>
            <td>{row.phone || '-'}</td>
            <td>{row.company || '-'}</td>
            <td>{row.department || '-'}</td>
            <td>{row.position || '-'}</td>
            <td>
                <div className={'credit_manage'}>
                    <span className={'credit_balance'}>{row.credit.toLocaleString()}</span>
                    <input type="text" inputMode="numeric" value={amount}
                           onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}/>
                    <button type="button" className={'btn_charge'} onClick={handleCharge} disabled={!amount}>충전</button>
                    <button type="button" className={'btn_deduct'} onClick={handleDeduct} disabled={!amount}>차감</button>
                </div>
            </td>
            <td>{formatDate(row.createdAt)}</td>
            <td className={'td_actions'}>
                <button type="button" className={'btn_detail'}
                        onClick={() => router.push(`/account/${row.id}`)}>상세</button>
                <button type="button" className={'btn_delete_text'}
                        onClick={() => onDelete(row.id)}>삭제</button>
            </td>
        </tr>
    );
}

export default function AccountTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onCharge, onDeduct, onDelete}: Props) {
    return (
        <tbody>
        {data.map((row, i) => (
            <AccountTableRow
                key={row.id}
                row={row}
                rowNum={totalElements - (currentPage * itemsPerPage) - i}
                formatDate={formatDate}
                onCharge={onCharge}
                onDeduct={onDeduct}
                onDelete={onDelete}
            />
        ))}
        </tbody>
    );
}
