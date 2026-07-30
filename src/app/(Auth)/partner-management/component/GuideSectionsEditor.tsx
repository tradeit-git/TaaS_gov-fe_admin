'use client'

import React, {useState} from 'react';

export interface GuideRow {
    label: string;
    value: string;
    visible: boolean;
}

export interface GuideCard {
    title: string;
    visible: boolean;
    rows: GuideRow[];
}

/** 서버(JSON) → 편집용 정규화 (visible 기본 true, null 방어) */
export function normalizeGuideSections(raw: unknown): GuideCard[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((c) => {
        const card = c as Partial<GuideCard>;
        return {
            title: card.title ?? '',
            visible: card.visible !== false,
            rows: Array.isArray(card.rows)
                ? card.rows.map((r) => {
                    const row = r as Partial<GuideRow>;
                    return {label: row.label ?? '', value: row.value ?? '', visible: row.visible !== false};
                })
                : [],
        };
    });
}

// ── 기본폼 빌더 (변경 전 기획: 신청안내/운영안내/제공혜택) + 오른쪽 값 데이터 연동 ──
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '26.07.20(월) 형태. yearless=true 면 07.20(월) (기간 종료일용) */
function fmtDate(iso?: string, yearless = false): string | null {
    if (!iso) return null;
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const w = WEEKDAYS[d.getDay()];
    return yearless ? `${mm}.${dd}(${w})` : `'${yy}.${mm}.${dd}(${w})`;
}

function toNum(v?: string | number): number {
    if (v == null) return 0;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
}

/**
 * 기본폼 생성 — 변경 전 기획대로 3카드 구성. 값은 폼 데이터와 연동, 없거나 0이면 틀만 채움.
 */
export function buildDefaultGuideSections(p: {
    partnerName?: string;
    startDate?: string;
    endDate?: string;
    maxMembers?: string | number;
    totalScheduleCredit?: string | number;
    bonusPercent?: string | number;
    systemStartDate?: string;
} = {}): GuideCard[] {
    const start = fmtDate(p.startDate);
    const end = fmtDate(p.endDate, true);
    let weeks = 0;
    if (p.startDate && p.endDate) {
        const s = new Date(`${p.startDate}T00:00:00`).getTime();
        const e = new Date(`${p.endDate}T00:00:00`).getTime();
        if (!isNaN(s) && !isNaN(e) && e >= s) weeks = Math.max(1, Math.ceil((e - s) / (7 * 86400000)));
    }
    const period = (start && end)
        ? `${start} ~ ${end} ※${weeks}주간`
        : `'yy.mm.dd(D) ~ yy.mm.dd(D) ※0주간`;

    const members = toNum(p.maxMembers);
    const scale = members > 0 ? `${members.toLocaleString()}개사` : `0개사`;

    const sysDate = fmtDate(p.systemStartDate) ?? `'yy.mm.dd(D)`;

    const totalCredit = toNum(p.totalScheduleCredit);
    const freeCredit = `총 크레딧 ${totalCredit.toLocaleString()} 지급`;

    const bonus = toNum(p.bonusPercent);
    const bonusCredit = `유료 플랜 결제 시 크레딧 ${bonus}% 추가 지급`;

    const org = (p.partnerName ?? '').trim();

    const row = (label: string, value: string): GuideRow => ({label, value, visible: true});

    return [
        {
            title: '신청안내', visible: true, rows: [
                row('신청기간', period),
                row('신청대상', org ? `${org} 회원사` : '회원사'),
                row('신청규모', scale),
            ],
        },
        {
            title: '운영안내', visible: true, rows: [
                row('선정방법', org ? `${org} 내부 기준에 따라 선정` : '내부 기준에 따라 선정'),
                row('선정결과', '개별 안내 예정'),
                row('온보딩 교육', ''),
                row('시스템 접속가능일', sysDate),
            ],
        },
        {
            title: '제공혜택', visible: true, rows: [
                row('무료 크레딧', freeCredit),
                row('보너스 크레딧', bonusCredit),
            ],
        },
    ];
}

// 노출/숨김 토글 아이콘 (비밀번호 표시 토글과 동일한 눈 모양)
const EyeIcon = ({on}: {on: boolean}) => (
    on ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
    )
);

// 기본폼 생성 버튼 (폼 우측 상단에서 사용) — 노출 pill(on)과 통일된 톤
export const defaultFormBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4, height: 30, padding: '0 14px',
    border: '1px solid #2b7fff', borderRadius: 999, background: '#eff6ff', color: '#2b7fff',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
};

const s: Record<string, React.CSSProperties> = {
    card: {border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, background: '#fafafa'},
    cardHead: {display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10},
    collapse: {display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 32, border: '1px solid #d0d5dd', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#667085', fontSize: 11, flexShrink: 0},
    title: {flex: 1, minWidth: 0, height: 32, padding: '0 10px', border: '1px solid #d0d5dd', borderRadius: 8, fontWeight: 600},
    delCard: {height: 32, padding: '0 12px', border: '1px solid #fecdca', borderRadius: 8, background: '#fff', color: '#d92d20', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0},
    row: {display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6},
    label: {width: 120, height: 32, padding: '0 8px', border: '1px solid #d0d5dd', borderRadius: 8, flexShrink: 0},
    value: {flex: 1, minWidth: 0, height: 32, padding: '0 8px', border: '1px solid #d0d5dd', borderRadius: 8},
    delRow: {display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 32, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#98a2b3', fontSize: 15, flexShrink: 0},
    addRow: {height: 30, padding: '0 12px', border: '1px dashed #d0d5dd', borderRadius: 8, background: '#fff', color: '#475467', fontSize: 12, cursor: 'pointer', marginTop: 4},
    addCard: {width: '100%', height: 38, border: '1px dashed #b2ccff', borderRadius: 10, background: '#fff', color: '#2b7fff', fontWeight: 700, cursor: 'pointer'},
    dimmed: {opacity: 0.55},

    // 노출/숨김 토글 (눈 아이콘 버튼)
    visBase: {display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0},
    visOn: {background: '#eff6ff', border: '1px solid #2b7fff', color: '#2b7fff'},
    visOff: {background: '#f2f4f7', border: '1px solid #d0d5dd', color: '#98a2b3'},
    cardVisSize: {width: 32, height: 32, padding: 0},
    rowVisSize: {width: 32, height: 32, padding: 0},
    disabledBtn: {opacity: 0.4, cursor: 'not-allowed'},
};

interface Props {
    sections: GuideCard[];
    onChange: (next: GuideCard[]) => void;
}

/** 가입 페이지 좌측 안내 - 동적 카드/로우 편집기 */
export default function GuideSectionsEditor({sections, onChange}: Props) {
    const [collapsed, setCollapsed] = useState<boolean[]>([]);
    const toggleCollapse = (ci: number) =>
        setCollapsed((prev) => {
            const next = [...prev];
            next[ci] = !next[ci];
            return next;
        });

    const updateCard = (ci: number, patch: Partial<GuideCard>) =>
        onChange(sections.map((c, i) => (i === ci ? {...c, ...patch} : c)));
    const updateRow = (ci: number, ri: number, patch: Partial<GuideRow>) =>
        updateCard(ci, {rows: sections[ci].rows.map((r, i) => (i === ri ? {...r, ...patch} : r))});
    const addCard = () => onChange([...sections, {title: '', visible: true, rows: [{label: '', value: '', visible: true}]}]);
    const removeCard = (ci: number) => onChange(sections.filter((_, i) => i !== ci));
    const addRow = (ci: number) => updateCard(ci, {rows: [...sections[ci].rows, {label: '', value: '', visible: true}]});
    const removeRow = (ci: number, ri: number) => updateCard(ci, {rows: sections[ci].rows.filter((_, i) => i !== ri)});

    return (
        <div>
            {sections.map((card, ci) => {
                const isCollapsed = !!collapsed[ci];
                const hidden = card.visible === false;
                return (
                    <div style={{...s.card, ...(hidden ? s.dimmed : {})}} key={ci}>
                        <div style={s.cardHead}>
                            <button type="button" style={s.collapse} title={isCollapsed ? '펼치기' : '접기'}
                                    onClick={() => toggleCollapse(ci)}>{isCollapsed ? '▸' : '▾'}</button>
                            <button type="button" title={card.visible !== false ? '카드 노출 중 (클릭 시 숨김)' : '카드 숨김 (클릭 시 노출)'}
                                    style={{...s.visBase, ...s.cardVisSize, ...(card.visible !== false ? s.visOn : s.visOff)}}
                                    onClick={() => updateCard(ci, {visible: card.visible === false})}>
                                <EyeIcon on={card.visible !== false}/>
                            </button>
                            <input style={s.title} placeholder="카드 제목 (예: 신청안내)" value={card.title}
                                   disabled={hidden}
                                   onChange={e => updateCard(ci, {title: e.target.value})}/>
                            <button type="button" style={s.delCard} onClick={() => removeCard(ci)}>카드 삭제</button>
                        </div>

                        {!isCollapsed && (
                            <>
                                {card.rows.map((row, ri) => {
                                    const rowHidden = row.visible === false;
                                    // 카드 숨김이면 하위 로우 전체 disable, 아니면 개별 로우 숨김 시 해당 로우만 disable
                                    const rowInputsDisabled = hidden || rowHidden;
                                    return (
                                    <div style={{...s.row, ...(!hidden && rowHidden ? s.dimmed : {})}} key={ri}>
                                        <button type="button" title={rowHidden ? '로우 숨김 (클릭 시 노출)' : '로우 노출 중 (클릭 시 숨김)'}
                                                disabled={hidden}
                                                style={{...s.visBase, ...s.rowVisSize, ...(!rowHidden ? s.visOn : s.visOff), ...(hidden ? s.disabledBtn : {})}}
                                                onClick={() => updateRow(ci, ri, {visible: rowHidden})}>
                                            <EyeIcon on={!rowHidden}/>
                                        </button>
                                        <input style={s.label} placeholder="라벨" value={row.label}
                                               disabled={rowInputsDisabled}
                                               onChange={e => updateRow(ci, ri, {label: e.target.value})}/>
                                        <input style={s.value} placeholder="안내 문구" value={row.value}
                                               disabled={rowInputsDisabled}
                                               onChange={e => updateRow(ci, ri, {value: e.target.value})}/>
                                        <button type="button" style={{...s.delRow, ...(hidden ? s.disabledBtn : {})}} title="로우 삭제"
                                                disabled={hidden}
                                                onClick={() => removeRow(ci, ri)}>×</button>
                                    </div>
                                    );
                                })}
                                <button type="button" style={{...s.addRow, ...(hidden ? s.disabledBtn : {})}}
                                        disabled={hidden} onClick={() => addRow(ci)}>+ 추가</button>
                            </>
                        )}
                    </div>
                );
            })}
            <button type="button" style={s.addCard} onClick={addCard}>+ 카드 추가</button>
        </div>
    );
}
