'use client'

import {useState} from "react";
import {createPortal} from "react-dom";
import {useRouter} from "next/navigation";
import {UserProjectRow} from "@/app/(Auth)/managed-users/component/UserProjectManagementPage";
import {accountTypeLabel} from "@/utill/accountType";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import PopupProjectReportSelector from "@/app/(Auth)/managed-users/component/PopupProjectReportSelector";
import ProjectMenuPopup from "@/app/(Auth)/managed-users/component/ProjectMenuPopup";

interface Props {
    data: UserProjectRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onDeleted: () => void;
}

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
    textAlign: 'left',
};

export default function UserProjectManagementTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDeleted}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const [menu, setMenu] = useState<{ userId: number; top: number; right: number } | null>(null);

    const openMenu = (userId: number, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenu({userId, top: rect.bottom + 4, right: window.innerWidth - rect.right});
    };

    const formatDeptPosition = (row: UserProjectRow) => {
        const parts = [row.department, row.position].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    // 관리 대상 사용자 제거 (soft delete)
    const handleDelete = (userId: number, name: string) => {
        addPopup(<AlertComponent alertType={'confirm'}
                                 infoContent={`'${name || '해당'}' 사용자를 관리 대상에서 제거하시겠습니까?`}
                                 callback={async () => {
                                     const res = await callApi(`/api/admin/managed-users/${userId}`, {
                                         method: 'DELETE',
                                         credentials: 'include',
                                     });
                                     if (res.result) {
                                         addPopup(<AlertComponent alertType={'alert'} infoContent={'제거되었습니다.'}/>);
                                         onDeleted();
                                     } else {
                                         addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '제거에 실패했습니다.'}/>);
                                     }
                                 }}/>);
    };

    return (
        <>
        <tbody>
        {data.length === 0 ? (
            <tr>
                <td colSpan={14} style={{textAlign: 'center'}}>관리 중인 사용자가 없습니다.</td>
            </tr>
        ) : (
            data.map((row, i) => {
                const rowNum = totalElements - (currentPage * itemsPerPage) - i;
                const deptPosition = formatDeptPosition(row);
                return (
                    <tr key={row.id}>
                        <td style={ellipsisStyle} title={String(rowNum)}>{rowNum}</td>
                        <td style={ellipsisStyle} title={row.companyName || '-'}>{row.companyName || '-'}</td>
                        <td style={ellipsisStyle} title={accountTypeLabel(row.userType)}>{accountTypeLabel(row.userType)}</td>
                        <td style={ellipsisStyle} title={row.loginId}>{row.loginId}</td>
                        <td style={ellipsisStyle} title={row.name}>{row.name}</td>
                        <td style={ellipsisStyle} title={deptPosition}>{deptPosition}</td>
                        <td style={ellipsisStyle} title={row.planName || '-'}>{row.planName || '-'}</td>
                        <td style={ellipsisStyle} title={row.partnerName || '-'}>{row.partnerName || '-'}</td>
                        <td className={'td_projects'}>
                            <div className={'pc_wrap'}>
                                <span className={'pc_num'}>{(row.projectCount ?? 0).toLocaleString()}</span>
                                <button type="button" className={'btn_detail'} onClick={e => openMenu(row.id, e)}>관리</button>
                            </div>
                        </td>
                        <td className={'td_projects'}>
                            <div className={'pc_wrap'}>
                                <button type="button" className={'btn_detail'}
                                        onClick={() => router.push(`/managed-users/${row.id}/company-analysis`)}>작성</button>
                            </div>
                        </td>
                        <td className={'td_projects'}>
                            <div className={'pc_wrap'}>
                                <button type="button" className={'btn_detail'} onClick={() => addPopup(<PopupProjectReportSelector userId={row.id} companyName={row.companyName || ''} />)}>열람</button>
                            </div>
                        </td>
                        <td style={ellipsisStyle} title={row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'}>{row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'}</td>
                        <td style={ellipsisStyle} title={formatDate(row.managedAt ?? row.createdAt)}>{formatDate(row.managedAt ?? row.createdAt)}</td>
                        <td className={'td_actions'}>
                            <button type="button" className={'btn_delete'} onClick={() => handleDelete(row.id, row.name)}>삭제</button>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
        {menu && createPortal(
            <ProjectMenuPopup userId={menu.userId} top={menu.top} right={menu.right} onClose={() => setMenu(null)}/>,
            document.body
        )}
        </>
    );
}
