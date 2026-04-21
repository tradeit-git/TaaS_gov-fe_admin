'use client'

import React from "react";

export type PaymentHistoryItem = {
    id: number;
    userId: number;
    loginId: string;
    userName: string;
    transactionId: string;
    createdAt: string;
    gradeName: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: 'COMPLETED' | 'FAILED';
}

interface Props {
    pagedItems: PaymentHistoryItem[];
    totalElements: number;
    currentPage: number;
    size: number;
    onInvoice: (transactionId: string) => void;
}

export default function BillingTableBody({pagedItems, totalElements, currentPage, size, onInvoice}: Props) {
    const getRowNo = (index: number) => totalElements - ((currentPage - 1) * size) - index;

    return (
        <tbody>
        {pagedItems.length === 0 ? (
            <tr>
                <td colSpan={10} style={{textAlign: 'center', padding: '40px'}}>결제 이력이 없습니다.</td>
            </tr>
        ) : pagedItems.map((item, index) => (
            <tr key={item.id}>
                <td>{getRowNo(index)}</td>
                <td>{item.createdAt}</td>
                <td>{item.transactionId}</td>
                <td>{item.loginId}</td>
                <td>{item.userName}</td>
                <td>{item.gradeName}</td>
                <td>${item.amount.toFixed(2)}</td>
                <td>{item.paymentMethod}</td>
                <td className={item.paymentStatus === 'FAILED' ? 'status_failed' : 'status_completed'}>
                    {item.paymentStatus}
                </td>
                <td className={'td_actions'}>
                    {item.paymentStatus === 'FAILED'
                        ? <span>-</span>
                        : (
                            <button
                                type={'button'}
                                className={'btn_detail'}
                                onClick={() => onInvoice(item.transactionId)}
                            >
                                다운로드
                            </button>
                        )
                    }
                </td>
            </tr>
        ))}
        </tbody>
    );
}
