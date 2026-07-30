'use client'

import React from 'react';

/** 파트너 크레딧 지급 스케줄 (폼 편집용). status=EXECUTED 는 이미 지급된 행 → 수정/삭제 불가. */
export interface CreditSchedule {
    id: number | null;
    creditAmount: string;   // 입력값(문자열). 제출 시 Number 변환
    startDate: string;      // 지급일 yyyy-MM-dd
    expirationDate: string; // 만료일 yyyy-MM-dd ('' = 무만료)
    status: 'PENDING' | 'EXECUTED';
}

/** GET /{id} 응답의 creditSchedules 항목 → 편집용으로 정규화 */
export function normalizeSchedules(raw: unknown): CreditSchedule[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => {
        const s = r as {
            id?: number | null; creditAmount?: number | null;
            startDate?: string | null; expirationDate?: string | null; status?: string | null;
        };
        return {
            id: s.id ?? null,
            creditAmount: s.creditAmount != null ? String(s.creditAmount) : '',
            startDate: (s.startDate ?? '').slice(0, 10),
            expirationDate: (s.expirationDate ?? '').slice(0, 10),
            status: s.status === 'EXECUTED' ? 'EXECUTED' : 'PENDING',
        };
    });
}

const st: Record<string, React.CSSProperties> = {
    wrap: {border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden'},
    table: {width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed'},
    th: {background: '#f9fafb', color: '#475467', fontWeight: 600, padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap'},
    td: {padding: '6px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle'},
    input: {width: '100%', height: 32, padding: '0 8px', border: '1px solid #d0d5dd', borderRadius: 8, boxSizing: 'border-box'},
    inputDone: {background: '#f2f4f7', color: '#98a2b3'},
    delBtn: {height: 30, padding: '0 12px', border: '1px solid #fecdca', borderRadius: 8, background: '#fff', color: '#d92d20', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'},
    doneBadge: {display: 'inline-block', padding: '3px 12px', borderRadius: 999, background: '#ecfdf3', color: '#027a48', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'},
    addBtn: {width: '100%', height: 38, border: '1px dashed #b2ccff', borderRadius: 10, background: '#fff', color: '#2b7fff', fontWeight: 700, cursor: 'pointer', marginTop: 8},
    empty: {padding: '14px 10px', textAlign: 'center', color: '#98a2b3', fontSize: 13},
};

interface Props {
    schedules: CreditSchedule[];
    onChange: (next: CreditSchedule[]) => void;
}

/** 크레딧 지급 스케줄 테이블 — 크레딧량/지급일/만료일 + 적용여부(미적용=삭제버튼) + 하단 추가버튼 */
export default function CreditScheduleEditor({schedules, onChange}: Props) {
    const update = (i: number, patch: Partial<CreditSchedule>) =>
        onChange(schedules.map((s, idx) => (idx === i ? {...s, ...patch} : s)));
    const remove = (i: number) => onChange(schedules.filter((_, idx) => idx !== i));
    const add = () => onChange([...schedules, {id: null, creditAmount: '', startDate: '', expirationDate: '', status: 'PENDING'}]);

    // 지급일 최소 선택값 = 내일. 배치가 지급일 00:00에 지급하므로 오늘/과거는 선택 불가.
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const minStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return (
        <div>
            <div style={st.wrap}>
                <table style={st.table}>
                    <colgroup>
                        <col style={{width: '25%'}}/>
                        <col style={{width: '29%'}}/>
                        <col style={{width: '29%'}}/>
                        <col style={{width: '17%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={st.th}>크레딧량</th>
                        <th style={st.th}>지급일</th>
                        <th style={st.th}>만료일</th>
                        <th style={{...st.th, textAlign: 'center'}}>실행여부</th>
                    </tr>
                    </thead>
                    <tbody>
                    {schedules.length === 0 ? (
                        <tr>
                            <td style={st.empty} colSpan={4}>등록된 지급 스케줄이 없습니다.</td>
                        </tr>
                    ) : schedules.map((s, i) => {
                        const done = s.status === 'EXECUTED';
                        return (
                            <tr key={s.id ?? `new-${i}`}>
                                <td style={st.td}>
                                    <input type="text" inputMode="numeric"
                                           value={s.creditAmount === '' ? '' : Number(s.creditAmount).toLocaleString()}
                                           disabled={done} placeholder="숫자만"
                                           style={{...st.input, ...(done ? st.inputDone : {})}}
                                           onChange={e => update(i, {creditAmount: e.target.value.replace(/[^0-9]/g, '')})}/>
                                </td>
                                <td style={st.td}>
                                    <input type="date" value={s.startDate} disabled={done}
                                           min={minStart}
                                           style={{...st.input, ...(done ? st.inputDone : {})}}
                                           onChange={e => {
                                               const v = e.target.value;
                                               // 지급일이 기존 만료일보다 뒤면 만료일 초기화
                                               const patch: Partial<CreditSchedule> = {startDate: v};
                                               if (s.expirationDate && v && s.expirationDate < v) patch.expirationDate = '';
                                               update(i, patch);
                                           }}/>
                                </td>
                                <td style={st.td}>
                                    <input type="date" value={s.expirationDate} disabled={done}
                                           min={s.startDate || minStart}
                                           style={{...st.input, ...(done ? st.inputDone : {})}}
                                           onChange={e => update(i, {expirationDate: e.target.value})}/>
                                </td>
                                <td style={{...st.td, textAlign: 'center'}}>
                                    {done
                                        ? <span style={st.doneBadge}>실행</span>
                                        : <button type="button" style={st.delBtn} onClick={() => remove(i)}>삭제</button>}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <button type="button" style={st.addBtn} onClick={add}>+ 스케줄 추가</button>
        </div>
    );
}
