'use client'

import Link from "next/link";

interface ContactRow {
    id: number;
    company: string;
    name: string;
    department: string;
    position: string;
    call: string;
    phone: string;
    email: string;
    createdAt: string;
    status: string;
}

interface Props {
    data: ContactRow[];
    startIndex: number;
    totalCount: number;
    onDelete: (id: number) => void;
}

export default function ContactTableBody({data, startIndex, totalCount, onDelete}: Props) {

    return (
        <tbody>
        {data.map((row, i) => (
            <tr key={row.id}>
                <td>{totalCount - startIndex - i}</td>
                <td>{row.company}</td>
                <td>{row.name}</td>
                <td>{row.department}</td>
                <td>{row.position}</td>
                <td>{row.call}</td>
                <td>{row.phone}</td>
                <td>{row.email}</td>
                <td>{row.createdAt}</td>
                <td>
                    <span className={`status_badge ${row.status === '완료' ? 'done' : row.status === '처리중' ? 'progress' : 'pending'}`}>
                        <span className={'admin_icon'}/> {row.status}
                    </span>
                </td>
                <td className={'td_actions'}>
                    <button type="button" className={'btn_detail'}>
                        <Link href={'/contact/detail'}>상세</Link></button>
                    <button type="button" className={'btn_delete'} onClick={() => onDelete(row.id)}>
                        <span className={'admin_icon icon_trash'}/>
                    </button>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
