'use client'

import Link from "next/link";

interface ClientRow {
    id: number;
    status: string;
    name: string;
    bizNo: string;
    email: string;
    password: string;
    plan: string;
    period: string;
    createdAt: string;
}

interface Props {
    data: ClientRow[];
}

export default function ClientTableBody({data}: Props) {
    return (
        <tbody>
        {data.map(row => (
            <tr key={row.id}>
                <td>{row.id}</td>
                <td>
                    <span className={`status_badge ${row.status === '계약' ? 'active' : 'expired'}`}>
                        {row.status}
                    </span>
                </td>
                <td>{row.name}</td>
                <td>{row.bizNo}</td>
                <td>{row.email}</td>
                <td>{row.password}</td>
                <td>{row.plan}</td>
                <td>{row.period}</td>
                <td>{row.createdAt}</td>
                <td className={'td_actions'}>
                    <button type="button" className={'btn_detail'}>
                        <Link href={'/client/detail'}>상세</Link></button>
                    <button type="button" className={'btn_delete'}>
                        <span className={'admin_icon icon_trash'}/>
                    </button>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
