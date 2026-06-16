'use client'

import {useState} from "react";
import {createPortal} from "react-dom";
import {UserProjectRow} from "@/app/(Auth)/managed-users/component/UserProjectManagementPage";
import {accountTypeLabel} from "@/utill/accountType";
import ProjectMenuPopup from "@/app/(Auth)/managed-users/component/ProjectMenuPopup";

interface Props {
    data: UserProjectRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
}

const ellipsisStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
};

export default function UserProjectManagementTableBody({data, totalElements, currentPage, itemsPerPage, formatDate}: Props) {
    const [menu, setMenu] = useState<{userId: number; top: number; right: number} | null>(null);

    const openMenu = (e: React.MouseEvent<HTMLButtonElement>, userId: number) => {
        const r = e.currentTarget.getBoundingClientRect();
        setMenu({userId, top: r.bottom + 4, right: window.innerWidth - r.right});
    };

    const formatDeptPosition = (row: UserProjectRow) => {
        const parts = [row.department, row.position].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    return (
        <>
        <tbody>
        {data.length === 0 ? (
            <tr>
                <td colSpan={12} style={{textAlign: 'center'}}>관리 중인 사용자가 없습니다.</td>
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
                        <td style={ellipsisStyle} title={String(row.projectCount ?? 0)}>{(row.projectCount ?? 0).toLocaleString()}</td>
                        <td style={ellipsisStyle} title={row.partnerName || '-'}>{row.partnerName || '-'}</td>
                        <td style={ellipsisStyle} title={row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'}>{row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'}</td>
                        <td style={ellipsisStyle} title={formatDate(row.managedAt ?? row.createdAt)}>{formatDate(row.managedAt ?? row.createdAt)}</td>
                        <td className={'td_actions'}>
                            <button type="button" className={'btn_detail'}
                                    onClick={e => openMenu(e, row.id)}>관리</button>
                        </td>
                    </tr>
                );
            })
        )}
        </tbody>
        {menu && createPortal(
            <ProjectMenuPopup userId={menu.userId} top={menu.top} right={menu.right}
                              onClose={() => setMenu(null)}/>,
            document.body
        )}
        </>
    );
}
