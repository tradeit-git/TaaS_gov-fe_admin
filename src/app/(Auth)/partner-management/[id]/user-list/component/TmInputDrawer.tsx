'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import callApi from "@/utill/apiRequest";
import {
    ADOPTION_TIMING_LABEL,
    AdoptionTiming,
    CustomerGrade,
    TM_LEVEL_LABEL,
    TmContact,
    TmDetailResponse,
    TmDrawerRow,
    TmLevel,
    TmProfile,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

const LEVELS: TmLevel[] = ['HIGH', 'MID', 'LOW'];
const TIMINGS: AdoptionTiming[] = ['IMMEDIATE', 'M1', 'M3', 'M6', 'HOLD'];
const GRADES: CustomerGrade[] = ['A', 'B', 'C', 'D', 'E'];

// 요구사항 §2-2. 자동 산정하지 않고 판단 근거만 보여준다.
const GRADE_CRITERIA: Record<CustomerGrade, { step: string; desc: string }> = {
    A: {step: '계약 추진', desc: '도입의사가 명확하고 즉시 계약 추진 가능'},
    B: {step: '단기 전환', desc: '도입의사가 있으며 1개월 내 계약 가능'},
    C: {step: '중기 전환', desc: '관심은 있으나 3~6개월 검토 필요'},
    D: {step: '보류', desc: '필요성은 있으나 시기·예산·내부사정 등으로 보류'},
    E: {step: '미도입', desc: '도입의사가 없거나 서비스 적합성이 낮음'},
};

const EMPTY_PROFILE: TmProfile = {
    exportNeeds: null,
    buyerFit: null, buyerFitComment: null,
    serviceValue: null, serviceValueComment: null,
    adoptionIntent: null, adoptionIntentComment: null,
    blocker: null,
    adoptionTiming: null, adoptionTimingComment: null,
    customerGrade: null, customerGradeComment: null,
    lastContactedOn: null,
    version: null,
};

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (d: string | null) => {
    if (!d) return '-';
    return d.slice(0, 10).replace(/-/g, '.');
};

/** 코멘트를 달 수 있는 선택형 항목의 키 (자유입력 1·5 는 대상 아님) */
type CommentKey = 'buyerFitComment' | 'serviceValueComment' | 'adoptionIntentComment'
    | 'adoptionTimingComment' | 'customerGradeComment';

interface Props {
    partnerId: string;
    // 사용량 요약은 목록 행이 이미 갖고 있어 다시 조회하지 않는다.
    // 사용량 없이 여는 화면(국내 영업 관리)도 있어 집계는 선택값이다
    row: TmDrawerRow;
    onClose: () => void;
    onSaved: () => void; // 목록의 등급·최근접촉 갱신용
}

export default function TmInputDrawer({partnerId, row, onClose, onSaved}: Props) {
    const [profile, setProfile] = useState<TmProfile>(EMPTY_PROFILE);
    // 저장 시점의 값. 이것과 다르면 미저장 변경으로 본다.
    const [baseline, setBaseline] = useState<TmProfile>(EMPTY_PROFILE);
    const [contacts, setContacts] = useState<TmContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [conflict, setConflict] = useState(false);
    const [error, setError] = useState('');
    // 코멘트는 값이 있을 때만 펼친 상태로 시작하고, 나머지는 💬 로 펼친다.
    const [openComments, setOpenComments] = useState<Set<CommentKey>>(new Set());
    const [gradeHelpOpen, setGradeHelpOpen] = useState(false);

    // 접촉이력 입력
    const [contactDate, setContactDate] = useState(today());
    const [contactComment, setContactComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const applyDetail = useCallback((body: TmDetailResponse) => {
        const next = {...EMPTY_PROFILE, ...body.profile};
        setProfile(next);
        setBaseline(next);
        setContacts(body.contacts ?? []);
        setOpenComments(new Set(
            (['buyerFitComment', 'serviceValueComment', 'adoptionIntentComment',
                'adoptionTimingComment', 'customerGradeComment'] as CommentKey[])
                .filter(k => body.profile?.[k]),
        ));
    }, []);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-members/${row.id}`, {
            method: 'GET', credentials: 'include',
        });
        if (res.result && res.data) applyDetail(res.data as unknown as TmDetailResponse);
        else setError(res.message || 'TM 정보를 불러오지 못했습니다.');
        setLoading(false);
    }, [partnerId, row.id, applyDetail]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const set = <K extends keyof TmProfile>(key: K, value: TmProfile[K]) =>
        setProfile(prev => ({...prev, [key]: value}));

    // 미저장 변경: 7항목 수정분 + 아직 [추가] 하지 않은 접촉이력 초안
    const dirty = JSON.stringify(profile) !== JSON.stringify(baseline) || contactComment.trim() !== '';

    /**
     * 닫기 요청. 미저장 변경이 있으면 확인을 받는다.
     * 오버레이 클릭으로도 닫히므로 실수로 날아가는 경우가 실제로 생긴다.
     */
    const requestClose = () => {
        if (dirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) return;
        onClose();
    };

    /**
     * 오버레이 클릭으로 닫기.
     * 드로어 안에서 텍스트를 드래그하다 바깥에서 버튼을 떼면 click 이 오버레이에서 발생해 닫혀버린다.
     * 눌렀을 때와 뗐을 때가 **둘 다** 오버레이여야 닫는다.
     */
    const overlayPressed = useRef(false);
    const handleOverlayMouseDown = (e: React.MouseEvent) => {
        overlayPressed.current = e.target === e.currentTarget;
    };
    const handleOverlayMouseUp = (e: React.MouseEvent) => {
        const shouldClose = overlayPressed.current && e.target === e.currentTarget;
        overlayPressed.current = false;
        if (shouldClose) requestClose();
    };

    const toggleComment = (key: CommentKey) => {
        setOpenComments(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-members/${row.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(profile),
        });
        setSaving(false);

        if (res.code === 'partner.TM_STALE_DATA') {
            setConflict(true);
            return;
        }
        if (!res.result) {
            setError(res.message || '저장에 실패했습니다.');
            return;
        }
        setConflict(false);
        onSaved();

        // 접촉이력은 [추가] 시점에 이미 저장되므로, 작성 중인 초안만 날아간다.
        if (contactComment.trim()
            && !window.confirm('작성 중인 접촉 이력은 저장되지 않았습니다. 닫으시겠습니까?')) {
            if (res.data) applyDetail(res.data as unknown as TmDetailResponse);
            return;
        }
        onClose();
    };

    /** 접촉이력 추가/수정/삭제는 응답으로 프로필까지 통째로 돌려받아 version 을 최신으로 유지한다. */
    const submitContactResult = (res: Awaited<ReturnType<typeof callApi>>) => {
        if (!res.result) {
            setError(res.message || '접촉이력 처리에 실패했습니다.');
            return false;
        }
        if (res.data) applyDetail(res.data as unknown as TmDetailResponse);
        setError('');
        setConflict(false);
        onSaved();
        return true;
    };

    const handleAddContact = async () => {
        if (!contactComment.trim()) {
            setError('상담 코멘트를 입력해 주세요.');
            return;
        }
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-members/${row.id}/contacts`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contactedOn: contactDate, comment: contactComment}),
        });
        if (submitContactResult(res)) {
            setContactComment('');
            setContactDate(today());
        }
    };

    const handleUpdateContact = async (id: number) => {
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-contacts/${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contactedOn: contactDate, comment: contactComment}),
        });
        if (submitContactResult(res)) {
            setEditingId(null);
            setContactComment('');
            setContactDate(today());
        }
    };

    const handleDeleteContact = async (id: number) => {
        if (!window.confirm('이 접촉이력을 삭제하시겠습니까?')) return;
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/tm-contacts/${id}`, {
            method: 'DELETE', credentials: 'include',
        });
        submitContactResult(res);
    };

    const startEdit = (c: TmContact) => {
        setEditingId(c.id);
        setContactDate(c.contactedOn);
        setContactComment(c.comment);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setContactComment('');
        setContactDate(today());
    };

    const levelField = (
        label: string,
        valueKey: 'buyerFit' | 'serviceValue' | 'adoptionIntent',
        commentKey: CommentKey,
    ) => (
        <div className={'tm_field'}>
            <div className={'tm_field_head'}>
                <label>{label}</label>
                <button type="button" className={`tm_comment_toggle ${openComments.has(commentKey) ? 'on' : ''}`}
                        title={'코멘트'} onClick={() => toggleComment(commentKey)}>💬</button>
            </div>
            <div className={'tm_segment'}>
                {LEVELS.map(lv => (
                    <button key={lv} type="button"
                            className={profile[valueKey] === lv ? 'on' : ''}
                            onClick={() => set(valueKey, profile[valueKey] === lv ? null : lv)}>
                        {TM_LEVEL_LABEL[lv]}
                    </button>
                ))}
            </div>
            {openComments.has(commentKey) && (
                <textarea className={'tm_comment'} rows={2} placeholder={'판단 근거 (선택)'}
                          value={profile[commentKey] ?? ''}
                          onChange={e => set(commentKey, e.target.value)}/>
            )}
        </div>
    );

    return (
        <div className={'tm_drawer_overlay'}
             onMouseDown={handleOverlayMouseDown}
             onMouseUp={handleOverlayMouseUp}>
            <aside className={'tm_drawer'}>
                <header className={'tm_drawer_head'}>
                    <div>
                        <strong>{row.companyName}</strong>
                        <span className={'tm_drawer_sub'}>{row.name || '-'} · {row.contact || '-'}</span>
                    </div>
                    <button type="button" className={'tm_drawer_close'} onClick={requestClose}>✕</button>
                </header>

                {/* 자동 집계 — TM 이 입력하는 값이 아니라 통화 중 근거자료다.
                    사용량을 안 들고 연 화면에서는 이 줄 자체를 빼는 게 낫다.
                    0 으로 채우면 「안 쓴 회원」 으로 읽혀서 통화 중 판단을 흐린다 */}
                {row.visitDays != null && (
                    <div className={'tm_usage'}>
                        <span>최근접속 <b>{formatDate(row.lastLoginAt ?? null)}</b></span>
                        <span>접속 <b>{row.visitDays}</b>일</span>
                        <span>Enrich <b>{row.buyerEnrich}</b></span>
                        <span>Buyer Fit <b>{row.buyerFit}</b></span>
                        <span>바이어 <b>{row.buyerTotal}</b></span>
                    </div>
                )}

                {conflict && (
                    <div className={'tm_conflict'}>
                        불러온 뒤 <b>다른 관리자가 먼저 저장</b>했습니다. 최신 내용을 확인한 뒤 다시 저장해 주세요.
                        <button type="button" onClick={() => {
                            setConflict(false);
                            fetchDetail();
                        }}>최신 내용 불러오기
                        </button>
                    </div>
                )}
                {error && <div className={'tm_error'}>{error}</div>}

                {loading ? <div className={'tm_loading'}>불러오는 중…</div> : (
                    <div className={'tm_drawer_body'}>
                      <div className={'tm_col_main'}>
                        <div className={'tm_field'}>
                            <div className={'tm_field_head'}><label>1. 수출 니즈</label></div>
                            <textarea rows={3} placeholder={'제품 / 목표국가 / 희망 바이어 등'}
                                      value={profile.exportNeeds ?? ''}
                                      onChange={e => set('exportNeeds', e.target.value)}/>
                        </div>

                        {levelField('2. 바이어 적합도', 'buyerFit', 'buyerFitComment')}
                        {levelField('3. 서비스 가치', 'serviceValue', 'serviceValueComment')}
                        {levelField('4. 도입 의향', 'adoptionIntent', 'adoptionIntentComment')}

                        <div className={'tm_field'}>
                            <div className={'tm_field_head'}><label>5. 장애요인</label></div>
                            <textarea rows={2} placeholder={'도입을 방해하는 핵심 사유'}
                                      value={profile.blocker ?? ''}
                                      onChange={e => set('blocker', e.target.value)}/>
                        </div>

                        <div className={'tm_field'}>
                            <div className={'tm_field_head'}>
                                <label>6. 도입 시기</label>
                                <button type="button"
                                        className={`tm_comment_toggle ${openComments.has('adoptionTimingComment') ? 'on' : ''}`}
                                        title={'코멘트'} onClick={() => toggleComment('adoptionTimingComment')}>💬</button>
                            </div>
                            <div className={'tm_segment'}>
                                {TIMINGS.map(t => (
                                    <button key={t} type="button"
                                            className={profile.adoptionTiming === t ? 'on' : ''}
                                            onClick={() => set('adoptionTiming', profile.adoptionTiming === t ? null : t)}>
                                        {ADOPTION_TIMING_LABEL[t]}
                                    </button>
                                ))}
                            </div>
                            {openComments.has('adoptionTimingComment') && (
                                <textarea className={'tm_comment'} rows={2} placeholder={'판단 근거 (선택)'}
                                          value={profile.adoptionTimingComment ?? ''}
                                          onChange={e => set('adoptionTimingComment', e.target.value)}/>
                            )}
                        </div>

                        <div className={'tm_field'}>
                            <div className={'tm_field_head'}>
                                <label>7. 고객 등급</label>
                                <button type="button" className={'tm_help'} title={'등급 기준'}
                                        onClick={() => setGradeHelpOpen(prev => !prev)}>ⓘ</button>
                                <button type="button"
                                        className={`tm_comment_toggle ${openComments.has('customerGradeComment') ? 'on' : ''}`}
                                        title={'코멘트'} onClick={() => toggleComment('customerGradeComment')}>💬</button>
                            </div>
                            <div className={'tm_segment tm_segment_grade'}>
                                {GRADES.map(g => (
                                    <button key={g} type="button"
                                            className={profile.customerGrade === g ? 'on' : ''}
                                            onClick={() => set('customerGrade', profile.customerGrade === g ? null : g)}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                            {gradeHelpOpen && (
                                <ul className={'tm_grade_help'}>
                                    {GRADES.map(g => (
                                        <li key={g}>
                                            <b>{g}</b> <span className={'step'}>{GRADE_CRITERIA[g].step}</span>
                                            {GRADE_CRITERIA[g].desc}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {openComments.has('customerGradeComment') && (
                                <textarea className={'tm_comment'} rows={2} placeholder={'판단 근거 (선택)'}
                                          value={profile.customerGradeComment ?? ''}
                                          onChange={e => set('customerGradeComment', e.target.value)}/>
                            )}
                        </div>

                      </div>

                        {/* 8. 접촉 날짜 및 코멘트 — 누적이라 계속 길어진다. 좌측 7항목과 따로 스크롤되도록 우측으로 뺀다.
                            저장 버튼과 별개로 즉시 반영된다. */}
                        <aside className={'tm_col_contacts'}>
                            <div className={'tm_field_head'}>
                                <label>8. 접촉 이력</label>
                                <span className={'tm_hint'}>누적 기록 · 덮어쓰지 않음</span>
                            </div>

                            <div className={'tm_contact_form'}>
                                <input type="date" value={contactDate} max={today()}
                                       onChange={e => setContactDate(e.target.value)}/>
                                <textarea rows={2} placeholder={'상담 코멘트'}
                                          value={contactComment}
                                          onChange={e => setContactComment(e.target.value)}/>
                                <div className={'tm_contact_form_actions'}>
                                    {editingId !== null && (
                                        <button type="button" className={'btn_ghost'} onClick={cancelEdit}>수정 취소</button>
                                    )}
                                    <button type="button" className={'btn_add'}
                                            onClick={() => editingId !== null ? handleUpdateContact(editingId) : handleAddContact()}>
                                        {editingId !== null ? '수정' : '추가'}
                                    </button>
                                </div>
                            </div>

                            <ul className={'tm_timeline'}>
                                {contacts.length === 0 && <li className={'tm_timeline_empty'}>접촉 이력이 없습니다.</li>}
                                {contacts.map(c => {
                                    const lines = c.comment.split('\n');
                                    const isLong = lines.length > 3;
                                    const open = expanded.has(c.id);
                                    return (
                                        <li key={c.id}>
                                            <div className={'tm_timeline_head'}>
                                                <span className={'date'}>{formatDate(c.contactedOn)}</span>
                                                <span className={'who'}>{c.adminName}</span>
                                                {c.mine && (
                                                    <span className={'acts'}>
                                                        <button type="button" onClick={() => startEdit(c)}>수정</button>
                                                        <button type="button" onClick={() => handleDeleteContact(c.id)}>삭제</button>
                                                    </span>
                                                )}
                                            </div>
                                            <p className={'tm_timeline_body'}>
                                                {isLong && !open ? lines.slice(0, 3).join('\n') : c.comment}
                                            </p>
                                            {isLong && (
                                                <button type="button" className={'tm_more'}
                                                        onClick={() => setExpanded(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(c.id)) next.delete(c.id);
                                                            else next.add(c.id);
                                                            return next;
                                                        })}>
                                                    {open ? '접기' : '« 더보기'}
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </aside>
                    </div>
                )}

                <footer className={'tm_drawer_foot'}>
                    {dirty && <span className={'tm_dirty_flag'}>저장되지 않은 변경사항</span>}
                    <button type="button" className={'btn_cancel'} onClick={requestClose}>취소</button>
                    <button type="button" className={'btn_save'} disabled={loading || saving} onClick={handleSave}>
                        {saving ? '저장 중…' : '저장'}
                    </button>
                </footer>
            </aside>
        </div>
    );
}
