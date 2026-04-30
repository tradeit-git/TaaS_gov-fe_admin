'use client'

import {formatDateDot} from "@/utill/format";
import {
    HostAdmin,
    OnboardingEditState,
    OnboardingSession,
    ONBOARDING_CLASSES,
} from "@/app/(Auth)/onboarding/component/OnboardingPage";

const statusBadgeClass = (status: string) => {
    if (status === '예정') return 'status_badge upcoming';
    return 'status_badge expired';
};

const formatSessionAt = (sessionAt: string): string => {
    if (!sessionAt) return '';
    const [date = '', rest = ''] = sessionAt.split('T');
    const time = rest.slice(0, 5);
    if (!date) return sessionAt;
    return time ? `${date} ${time}` : date;
};

interface Props {
    pageData: OnboardingSession[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    hosts: HostAdmin[];
    editingId: number | null;
    editRow: OnboardingEditState | null;
    onEdit: (row: OnboardingSession) => void;
    onCancel: () => void;
    onChange: (field: keyof OnboardingEditState, value: string | number) => void;
    onSave: () => void;
    onDelete: (id: number) => void;
}

export default function OnboardingTableBody({
                                                 pageData,
                                                 totalElements,
                                                 currentPage,
                                                 itemsPerPage,
                                                 hosts,
                                                 editingId,
                                                 editRow,
                                                 onEdit,
                                                 onCancel,
                                                 onChange,
                                                 onSave,
                                                 onDelete,
                                             }: Props) {
    return (
        <tbody>
        {pageData.map((row, i) => {
            const isEditing = editingId === row.id;
            const editClass = isEditing && editRow ? editRow.className : row.className;
            const editHostId = isEditing && editRow ? editRow.hostAdminId : row.hostAdmin.id;
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>
                        <span className={statusBadgeClass(row.status)}>{row.status}</span>
                    </td>
                    <td>
                        <input type="text" className={'cell_input'} readOnly
                               value={formatSessionAt(row.sessionAt)} onChange={() => {}}/>
                    </td>
                    <td>
                        <div className={'url_cell'}>
                            <input type="text" className={'cell_input'} readOnly
                                   value={row.url} onChange={() => {}}/>
                            <a className={'btn_link'}
                               href={row.url}
                               target="_blank" rel="noopener noreferrer"
                               title="온보딩 페이지 열기">↗</a>
                        </div>
                    </td>
                    <td>
                        {isEditing ? (
                            <select className={'cell_select'}
                                    value={editClass}
                                    onChange={e => onChange('className', e.target.value)}>
                                {ONBOARDING_CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        ) : (
                            <span className={'class_name'} title={row.className}>
                                {row.className}
                            </span>
                        )}
                    </td>
                    <td>
                        {isEditing ? (
                            <select className={'cell_select'}
                                    value={editHostId}
                                    onChange={e => onChange('hostAdminId', Number(e.target.value))}>
                                {hosts.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span>{row.hostAdmin.name}</span>
                        )}
                    </td>
                    <td>{formatDateDot(row.createdAt)}</td>
                    <td className={'td_actions'}>
                        <div className={'actions_wrap'}>
                            {isEditing ? (
                                <>
                                    <button type="button" className={'btn_save'}
                                            onClick={onSave}>저장
                                    </button>
                                    <button type="button" className={'btn_cancel'}
                                            onClick={onCancel}>취소
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className={'btn_detail'}
                                            disabled={editingId !== null}
                                            onClick={() => onEdit(row)}>수정
                                    </button>
                                    <button type="button" className={'btn_delete'}
                                            disabled={editingId !== null}
                                            onClick={() => onDelete(row.id)}>
                                        <span className={'admin_icon icon_trash'}/>
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
