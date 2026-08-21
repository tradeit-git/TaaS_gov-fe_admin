'use client'

import React from "react";
import {useRouter} from "next/navigation";
import {formatDateTimeDot} from "@/utill/format";

export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    SUCCESS: '결제완료',
    FAILED: '결제실패',
    CANCELLED: '결제취소',
    REFUNDED: '환불',
};

export type PaymentHistoryItem = {
    id: number;
    paymentDate: string | null;
    orderId: string;
    userId: number | null;
    loginId: string | null;
    userName: string | null;
    companyName: string | null;
    planName: string | null;
    totalAmount: number | null;
    paymentMethodName: string | null;
    status: PaymentStatus;
    receiptUrl: string | null;
}

interface Props {
    items: PaymentHistoryItem[];
    totalElements: number;
    currentPage: number;   // 0-based
    size: number;
}

export default function BillingTableBody({items, totalElements, currentPage, size}: Props) {
    const router = useRouter();
    const getRowNo = (index: number) => totalElements - (currentPage * size) - index;

    return (
        <tbody>
        {items.length === 0 ? (
            <tr>
                <td colSpan={12} style={{textAlign: 'center', padding: '40px'}}>결제 이력이 없습니다.</td>
            </tr>
        ) : items.map((item, index) => (
            <tr key={item.id}>
                <td>{getRowNo(index)}</td>
                <td>{formatDateTimeDot(item.paymentDate)}</td>
                <td>{item.orderId}</td>
                <td>{item.loginId ?? '-'}</td>
                <td>{item.companyName ?? '-'}</td>
                <td>{item.userName ?? '-'}</td>
                <td>{item.planName ?? '-'}</td>
                <td>{item.totalAmount !== null ? `${item.totalAmount.toLocaleString()}원` : '-'}</td>
                <td>{item.paymentMethodName ?? '-'}</td>
                <td className={item.status === 'SUCCESS' ? 'status_completed' : 'status_failed'}>
                    {PAYMENT_STATUS_LABEL[item.status] ?? item.status}
                </td>
                <td className={'td_actions'}>
                    {item.receiptUrl
                        ? (
                            <a
                                className={'btn_detail'}
                                href={item.receiptUrl}
                                target={'_blank'}
                                rel={'noopener noreferrer'}
                            >
                                영수증
                            </a>
                        )
                        : <span>-</span>
                    }
                </td>
                <td className={'td_actions'}>
                    {item.userId !== null
                        ? (
                            <button
                                type={'button'}
                                className={'btn_detail'}
                                onClick={() => router.push(`/users/${item.userId}`)}
                            >
                                상세
                            </button>
                        )
                        : <span>-</span>
                    }
                </td>
            </tr>
        ))}
        </tbody>
    );
}
