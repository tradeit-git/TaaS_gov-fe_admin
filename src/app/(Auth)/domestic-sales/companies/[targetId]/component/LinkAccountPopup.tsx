'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {
    ACCOUNT_TYPE_LABELS,
    API_BASE,
    CandidateRow,
    EMPTY,
    formatDateShort,
} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    uId?: string;
    targetId: number;
    companyName: string;
    /** 사업자번호가 없는 기업은 자동 연결이 불가능하다. 경고 문구가 달라진다 */
    hasBizNo: boolean;
    onSuccess?: () => void;
}

/**
 * 계정 연결 팝업 — 기업 → 계정 방향이다 (기획서 5.3).
 * <p>
 * 낯선 계정을 미연결 큐에서 보면 누구 건지 모르지만, 그 기업을 영업한 담당자는 안다.
 * <p>
 * 추천 후보는 <b>회사명 정규화 일치</b>일 뿐 같은 회사라는 보장이 없다.
 * 그래서 원본 표기와 이메일을 그대로 보여주고 고르는 것은 사람에게 맡긴다.
 */
export default function LinkAccountPopup({uId, targetId, companyName, hasBizNo, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();

    const [candidates, setCandidates] = useState<CandidateRow[]>([]);
    const [searchResults, setSearchResults] = useState<CandidateRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);

    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');

    // 추천과 검색을 오가도 고른 것은 유지돼야 한다. 행 자체를 들고 있어야 선택 목록을 그릴 수 있다
    const [selected, setSelected] = useState<Map<number, CandidateRow>>(new Map());

    const searchReqRef = useRef(0);

    // 팝업을 여는 순간 추천 후보를 자동 조회한다. 담당자는 아무것도 치지 않는다
    useEffect(() => {
        (async () => {
            const res = await callApi(`${API_BASE}/companies/${targetId}/link-candidates`, {
                method: 'GET',
                credentials: 'include',
            });
            setLoading(false);
            if (res.result && res.data) setCandidates(res.data as CandidateRow[]);
        })();
    }, [targetId]);

    const runSearch = useCallback(async () => {
        if (!keyword.trim()) {
            setSearchResults([]);
            return;
        }
        const myReqId = ++searchReqRef.current;
        setSearching(true);

        const res = await callApi(`${API_BASE}/unlinked-accounts?keyword=${encodeURIComponent(keyword.trim())}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== searchReqRef.current) return;

        setSearching(false);
        if (res.result && res.data) setSearchResults(res.data as CandidateRow[]);
    }, [keyword]);

    useEffect(() => { runSearch(); }, [runSearch]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setKeyword(keywordInput), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [keywordInput]);

    const toggle = (row: CandidateRow) => {
        setSelected(prev => {
            const next = new Map(prev);
            if (next.has(row.userId)) next.delete(row.userId);
            else next.set(row.userId, row);
            return next;
        });
    };

    const handleSave = async () => {
        if (selected.size === 0) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'연결할 계정을 선택해주세요.'}/>);
            return;
        }

        setSaving(true);
        const res = await callApi(`${API_BASE}/companies/${targetId}/accounts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({userIds: Array.from(selected.keys())}),
        });
        setSaving(false);

        if (res.result) {
            closePopup(uId ?? '');
            onSuccess?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '연결에 실패했습니다.'}/>);
        }
    };

    const showingSearch = keyword.trim().length > 0;
    const rows = showingSearch ? searchResults : candidates;

    const renderRow = (row: CandidateRow) => {
        const checked = selected.has(row.userId);
        return (
            <label key={row.userId} className={`ds_candidate${checked ? ' on' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(row)}/>
                <span className={`ds_type_badge type_${row.accountType.toLowerCase()}`}>
                    {ACCOUNT_TYPE_LABELS[row.accountType] ?? row.accountType}
                </span>
                <div className={'ds_candidate_main'}>
                    <div>
                        <span className={'ds_account_name'}>{row.name}</span>
                        {/* 정규화 값이 아니라 원본 표기를 보여준다. 안 그러면 구분할 근거가 사라진다 */}
                        <span className={'ds_sub'}> · {row.companyName}</span>
                    </div>
                    <div className={'ds_account_email'}>{row.email}</div>
                    <div className={'ds_account_sub'}>
                        {[row.department, row.position].filter(Boolean).join(' · ') || EMPTY}
                        {row.businessNumber && <span className={'ds_num'}> | {row.businessNumber}</span>}
                        {' | '}가입 {formatDateShort(row.createdAt)}
                    </div>
                </div>
            </label>
        );
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup ds_link_popup'}>
                <h4>계정 연결 — {companyName}</h4>

                <div className={'popup_body'}>
                    <div className={'ds_link_notice'}>
                        {hasBizNo
                            ? '회사명이 비슷한 계정을 모아 보여줍니다. 표기는 원본 그대로이니 이메일 도메인으로 같은 회사인지 확인하세요.'
                            : '이 기업은 사업자번호가 없어 자동 연결이 되지 않습니다. 아래 추천은 회사명만 맞춰본 참고용이니 이메일 도메인을 꼭 확인하세요.'}
                    </div>

                    <input type="text" className={'ds_link_search'} value={keywordInput}
                           onChange={e => setKeywordInput(e.target.value)}
                           placeholder={'이름 · 이메일 · 회사명으로 전체 미연결 계정 검색'}/>

                    <div className={'ds_link_section_label'}>
                        {showingSearch
                            ? <>검색 결과 <b>{searchResults.length}</b>건{searching && ' · 검색 중'}</>
                            : <>추천 계정 <b>{candidates.length}</b>건 · 회사명이 같아 보이는 미연결 계정</>}
                    </div>

                    <div className={'ds_candidate_list'}>
                        {loading && !showingSearch ? (
                            <div className={'ds_section_empty'}>불러오는 중입니다.</div>
                        ) : rows.length === 0 ? (
                            <div className={'ds_section_empty'}>
                                {showingSearch
                                    ? '검색 결과가 없습니다.'
                                    : '회사명이 비슷한 미연결 계정이 없습니다. 위에서 직접 검색해 주세요.'}
                            </div>
                        ) : rows.map(renderRow)}
                    </div>

                    {/* 검색으로 넘어가면 추천에서 고른 게 화면에서 사라진다. 여기서 계속 보이게 한다 */}
                    {selected.size > 0 && (
                        <div className={'ds_selected_box'}>
                            <span className={'ds_sub'}>선택 {selected.size}명</span>
                            <div className={'ds_selected_chips'}>
                                {Array.from(selected.values()).map(row => (
                                    <button key={row.userId} type="button" className={'ds_selected_chip'}
                                            onClick={() => toggle(row)}>
                                        {row.name} <span>×</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving || selected.size === 0}
                            onClick={handleSave}>
                        {saving ? '연결 중...' : `${selected.size}명 연결`}
                    </button>
                </div>
            </div>
        </div>
    );
}
