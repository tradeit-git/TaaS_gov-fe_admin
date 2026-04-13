'use client';

import Link from "next/link";
import {useState} from "react";

interface TrialUser {
    company: string;
    loginId: string;
    password: string;
    manager: string;
    phone: string;
    createdAt: string;
}

const initialData: TrialUser[] = [
    {
        company: '○○○산업',
        loginId: 'abcdeft@gamil.com',
        password: 'abcdef',
        manager: '이홍구',
        phone: '010-0000-0000',
        createdAt: '2026.04.30',
    },
    {
        company: '○○○○기술',
        loginId: '12345@naver.com',
        password: 'zwdff22',
        manager: '박성열',
        phone: '070-0000-0000',
        createdAt: '2026.04.29',
    },
];

export default function UserList() {
    const [data, setData] = useState<TrialUser[]>(initialData);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);

    const handleChange = (idx: number, field: keyof TrialUser, value: string) => {
        setData(prev => prev.map((row, i) => i === idx ? {...row, [field]: value} : row));
    };

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>가입명단</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/trial'}>체험계정</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>가입명단</li>
                </ul>
            </div>
            <div className={'table_wrap'}>
                <div className={'table_title'}>
                    <h4>경기지역 FTA 통상진흥센터</h4>
                    <Link href={'/trial'} className={'list_button'} >목록으로</Link>
                </div>
                <table className={'client_table user_list_table'}>
                    <colgroup>
                        <col width={'50px'}/>
                        <col/>
                        <col/>
                        <col/>
                        <col/>
                        <col/>
                        <col width={'110px'}/>
                        <col width={'140px'}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>체험기업</th>
                        <th>아이디</th>
                        <th>비밀번호</th>
                        <th>담당자명</th>
                        <th>연락처</th>
                        <th>가입일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row, i) => {
                        const isEditing = editingIdx === i;
                        return (
                            <tr key={i}>
                                <td>{data.length - i}</td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={row.company}
                                           onChange={e => handleChange(i, 'company', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={row.loginId}
                                           onChange={e => handleChange(i, 'loginId', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={row.password}
                                           onChange={e => handleChange(i, 'password', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={row.manager}
                                           onChange={e => handleChange(i, 'manager', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing} value={row.phone}
                                           onChange={e => handleChange(i, 'phone', e.target.value)}/></td>
                                <td>{row.createdAt}</td>
                                <td className={'td_actions'}>
                                    <div className={'actions_wrap'}>
                                        {isEditing ? (
                                            <button type="button" className={'btn_save'}
                                                    onClick={() => setEditingIdx(null)}>저장</button>
                                        ) : (
                                            <>
                                                <button type="button" className={'btn_detail'}
                                                        disabled={editingIdx !== null}
                                                        onClick={() => setEditingIdx(i)}>수정
                                                </button>
                                                <button type="button" className={'btn_delete'}
                                                        disabled={editingIdx !== null}><span
                                                    className={'admin_icon icon_trash'}/></button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div className={'table_bottom_button_wrap'}>
                <Link href={'/trial'} className={'list_button'}>목록으로</Link>
            </div>
        </div>
    );
}
