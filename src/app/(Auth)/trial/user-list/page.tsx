'use client';

import Link from "next/link";
import {useCallback, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface TrialUser {
    id: number;
    loginId: string;
    name: string;
    companyName: string;
    contact: string;
    status: string;
    createdAt: string;
}

export default function UserList() {
    const searchParams = useSearchParams();
    const trialId = searchParams.get('id');
    const trialName = searchParams.get('name') || '';

    const {addPopup} = usePopupStore();
    const [data, setData] = useState<TrialUser[]>([]);
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editRow, setEditRow] = useState<TrialUser | null>(null);

    const fetchList = useCallback(async () => {
        if (!trialId) return;
        const res = await callApi(`/api/admin/trial-keys/${trialId}/users`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            setData(res.data as TrialUser[]);
        }
    }, [trialId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const handleEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditRow({...data[idx]});
    };

    const handleChange = (field: keyof TrialUser, value: string) => {
        if (!editRow) return;
        setEditRow({...editRow, [field]: value});
    };

    const handleSave = async () => {
        if (!editRow || !trialId) return;
        const res = await callApi(`/api/admin/trial-keys/${trialId}/users/${editRow.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                companyName: editRow.companyName,
                loginId: editRow.loginId,
                name: editRow.name,
                contact: editRow.contact,
            }),
        });
        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            setEditingIdx(null);
            setEditRow(null);
            fetchList();
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '수정에 실패했습니다.'}/>);
        }
    };

    const handleDelete = (userId: number) => {
        if (!trialId) return;
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 회원을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/trial-keys/${trialId}/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                fetchList();
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
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
                    <h4>{trialName}</h4>
                    <Link href={'/trial'} className={'list_button'}>목록으로</Link>
                </div>
                <table className={'client_table user_list_table'}>
                    <colgroup>
                        <col width={'50px'}/>
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
                        <th>담당자명</th>
                        <th>연락처</th>
                        <th>가입일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row, i) => {
                        const isEditing = editingIdx === i;
                        const view = isEditing && editRow ? editRow : row;
                        return (
                            <tr key={row.id}>
                                <td>{data.length - i}</td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={view.companyName}
                                           onChange={e => handleChange('companyName', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={view.loginId}
                                           onChange={e => handleChange('loginId', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={view.name}
                                           onChange={e => handleChange('name', e.target.value)}/></td>
                                <td><input type="text" className={'cell_input'} readOnly={!isEditing}
                                           value={view.contact}
                                           onChange={e => handleChange('contact', e.target.value)}/></td>
                                <td>{formatDateDot(row.createdAt)}</td>
                                <td className={'td_actions'}>
                                    <div className={'actions_wrap'}>
                                        {isEditing ? (
                                            <button type="button" className={'btn_save'}
                                                    onClick={handleSave}>저장</button>
                                        ) : (
                                            <>
                                                <button type="button" className={'btn_detail'}
                                                        disabled={editingIdx !== null}
                                                        onClick={() => handleEdit(i)}>수정
                                                </button>
                                                <button type="button" className={'btn_delete'}
                                                        disabled={editingIdx !== null}
                                                        onClick={() => handleDelete(row.id)}><span
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
