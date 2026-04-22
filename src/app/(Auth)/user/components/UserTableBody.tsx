'use client'

import Link from "next/link";
import {UserType} from "@/types/user/user";
import {formatDateDot, STATUS_LABELS} from "@/utill/format";

interface Props {
    pagedUsers: UserType[];
    totalCount: number;
    currentPage: number;
    perPage: number;
    onDelete: (id: number) => void;
}

export default function UserTableBody({pagedUsers, totalCount, currentPage, perPage, onDelete}: Props) {
    return (
        <tbody>
        {pagedUsers.length === 0 ? (
            <tr>
                <td colSpan={15} style={{textAlign: 'center'}}>
                    회원이 없습니다.
                </td>
            </tr>
        ) : (
            pagedUsers.map((user, index) => {
                const rowNum = totalCount - ((currentPage - 1) * perPage + index);
                const noLoginDays = user.lastLoginAt
                    ? `${Math.floor((new Date(new Date().toDateString()).getTime() - new Date(new Date(user.lastLoginAt).toDateString()).getTime()) / (1000 * 60 * 60 * 24))}일`
                    : '-';

                return (
                    <tr key={user.id}>
                        <td>{rowNum}</td>
                        <td>{STATUS_LABELS[user.status] || "활성화"}</td>
                        <td>{user.loginId}</td>
                        <td>{user.companyName || '-'}</td>
                        <td>{user.name}</td>
                        <td>{user.contact || '-'}</td>
                        <td className={'text_center credit_total'}>{user.creditSummary ? user.creditSummary.granted.toLocaleString() : '-'}</td>
                        <td className={'text_center credit_used'}>{user.creditSummary ? user.creditSummary.used.toLocaleString() : '-'}</td>
                        <td className={'text_center credit_remove'}>{user.creditSummary ? user.creditSummary.expired.toLocaleString() : '-'}</td>
                        <td className={'text_center credit_remaining'}>{user.creditSummary ? user.creditSummary.balance.toLocaleString() : '-'}</td>
                        <td>{formatDateDot(user.createdAt)}</td>
                        <td>{user.lastLoginAt ? formatDateDot(user.lastLoginAt) : '-'}</td>
                        <td>{noLoginDays}</td>
                        <td className={'td_actions'}>
                            <div className={'actions_wrap'}>
                                <Link className={'btn_detail'} href={`/user/detail/${user.id}`}>상세</Link>
                                <button
                                    type={'button'}
                                    className={'btn_delete'}
                                    onClick={() => onDelete(user.id)}
                                >
                                    <span className={'admin_icon icon_trash'}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
    );
}
