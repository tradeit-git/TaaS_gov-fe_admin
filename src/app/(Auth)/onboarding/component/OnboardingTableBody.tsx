'use client'

import {formatDateDot} from "@/utill/format";
import {ONBOARDING_CLASSES, OnboardingRow} from "@/app/(Auth)/onboarding/component/OnboardingPage";

type OnboardingStatus = '예정' | '진행중' | '종료';

const DURATION_MS = 2 * 60 * 60 * 1000;

const computeStatus = (scheduledAt: string): OnboardingStatus => {
    const start = new Date(scheduledAt.replace(' ', 'T'));
    if (Number.isNaN(start.getTime())) return '예정';
    const end = new Date(start.getTime() + DURATION_MS);
    const now = new Date();
    if (now < start) return '예정';
    if (now < end) return '진행중';
    return '종료';
};

const statusBadgeClass = (s: OnboardingStatus) => {
    if (s === '진행중') return 'status_badge active';
    if (s === '예정') return 'status_badge upcoming';
    return 'status_badge expired';
};

const ONBOARDING_TIMES = ['10:00', '14:00'] as const;
const ONBOARDING_HOSTS = ['이한열', '양민지', '정유나'] as const;

const splitScheduledAt = (scheduledAt: string): { date: string; time: string } => {
    const [date = '', time = ''] = scheduledAt.split(' ');
    return {date, time};
};

interface Props {
    pageData: OnboardingRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    editingId: number | null;
    editRow: OnboardingRow | null;
    onEdit: (row: OnboardingRow) => void;
    onCancel: () => void;
    onChange: (field: keyof OnboardingRow, value: string) => void;
    onSave: () => void;
    onDelete: (id: number) => void;
}

export default function OnboardingTableBody({
                                                 pageData,
                                                 totalElements,
                                                 currentPage,
                                                 itemsPerPage,
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
            const view = isEditing && editRow ? editRow : row;
            const status = computeStatus(view.scheduledAt);
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;
            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td>
                        <span className={statusBadgeClass(status)}>{status}</span>
                    </td>
                    <td>
                        {isEditing ? (
                            <div className={'datetime_cell'}>
                                <input type="date" className={'cell_input date'}
                                       value={splitScheduledAt(view.scheduledAt).date}
                                       onChange={e => onChange('scheduledAt', `${e.target.value} ${splitScheduledAt(view.scheduledAt).time}`)}/>
                                <select className={'cell_select time'}
                                        value={splitScheduledAt(view.scheduledAt).time}
                                        onChange={e => onChange('scheduledAt', `${splitScheduledAt(view.scheduledAt).date} ${e.target.value}`)}>
                                    {ONBOARDING_TIMES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <input type="text" className={'cell_input'} readOnly
                                   value={view.scheduledAt} onChange={() => {}}/>
                        )}
                    </td>
                    <td>
                        {isEditing ? (
                            <select className={'cell_select'}
                                    value={view.onboardingClass}
                                    onChange={e => onChange('onboardingClass', e.target.value)}>
                                {ONBOARDING_CLASSES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        ) : (
                            <span className={'class_name'} title={view.onboardingClass}>
                                {view.onboardingClass}
                            </span>
                        )}
                    </td>
                    <td>
                        <div className={'url_cell'}>
                            <input type="text" className={'cell_input'} readOnly={!isEditing}
                                   value={view.url}
                                   onChange={e => onChange('url', e.target.value)}/>
                            <a className={'btn_link'}
                               href={view.url}
                               target="_blank" rel="noopener noreferrer"
                               title="온보딩 페이지 열기">↗</a>
                        </div>
                    </td>
                    <td>
                        {isEditing ? (
                            <select className={'cell_select'}
                                    value={view.host}
                                    onChange={e => onChange('host', e.target.value)}>
                                {ONBOARDING_HOSTS.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        ) : (
                            <span>{view.host}</span>
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
