'use client';

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {API_BASE, EMPTY, regionText} from "@/app/(Auth)/domestic-sales/companies/types";
import {MasterCompanyRow, MasterListResponse} from "@/app/(Auth)/domestic-sales/company-info/types";

interface Props {
    uId?: string;
    onSuccess?: () => void;
}

/** 팝업에서 훑을 양. 더 봐야 하면 기업정보조회 페이지로 보낸다 */
const SEARCH_LIMIT = 30;

/**
 * 관리기업 추가 — 기준 DB 에서 골라 담는다.
 * <p>
 * 기업 정보 자체는 여기서 만들지 않는다. 기준 DB(sales_customers)는 그대로 쓰고
 * 관리 대상만 뽑아오는 것이 이 기능의 전제다 (기획서 2.1).
 * <p>
 * 여러 건을 이어서 담을 수 있게 담은 뒤에도 팝업을 닫지 않는다.
 */
export default function AddTargetPopup({uId, onSuccess}: Props) {
    const router = useRouter();
    const {closePopup, addPopup} = usePopupStore();

    const [rows, setRows] = useState<MasterCompanyRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState<number | null>(null);

    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [unmanagedOnly, setUnmanagedOnly] = useState(true);

    // 이 팝업에서 담은 것들. 목록을 다시 읽지 않고 그 행만 바꿔치운다
    const [added, setAdded] = useState<Map<number, number>>(new Map());   // customerId → targetId
    const [addedCount, setAddedCount] = useState(0);

    const reqIdRef = useRef(0);

    const search = useCallback(async () => {
        if (!keyword.trim()) {
            setRows([]);
            setTotal(0);
            return;
        }
        const myReqId = ++reqIdRef.current;
        setLoading(true);

        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('size', String(SEARCH_LIMIT));
        params.set('keyword', keyword.trim());
        if (unmanagedOnly) params.set('unmanagedOnly', 'true');

        const res = await callApi(`${API_BASE}/master-companies?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (myReqId !== reqIdRef.current) return;

        setLoading(false);
        if (res.result && res.data) {
            const body = res.data as unknown as MasterListResponse;
            setRows(body.content);
            setTotal(body.totalElements);
        }
    }, [keyword, unmanagedOnly]);

    useEffect(() => { search(); }, [search]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setKeyword(keywordInput), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [keywordInput]);

    const addTarget = async (row: MasterCompanyRow) => {
        setAdding(row.customerId);
        const res = await callApi(`${API_BASE}/companies`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({customerId: row.customerId}),
        });
        setAdding(null);

        if (res.result) {
            const detail = res.data as { targetId?: number } | null;
            if (detail?.targetId) {
                setAdded(prev => new Map(prev).set(row.customerId, detail.targetId!));
            }
            setAddedCount(c => c + 1);
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '추가에 실패했습니다.'}/>);
        }
    };

    /** 담은 게 있으면 뒤에 있는 목록도 새로 그려야 한다 */
    const close = () => {
        closePopup(uId ?? '');
        if (addedCount > 0) {
            router.refresh();
            onSuccess?.();
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup ds_link_popup'}>
                <h4>관리기업 추가</h4>

                <div className={'popup_body'}>
                    <div className={'ds_link_notice'}>
                        국내 기업정보 기준 DB 에서 찾아 담습니다. 담으면 1차 회차가 자동으로 열립니다.
                    </div>

                    <input type="text" className={'ds_link_search'} value={keywordInput} autoFocus
                           onChange={e => setKeywordInput(e.target.value)}
                           placeholder={'기업명 · 사업자번호로 검색'}/>

                    <div className={'ds_link_section_label'} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <span>
                            {keyword.trim()
                                ? <>검색 결과 <b>{total.toLocaleString()}</b>건{loading && ' · 검색 중'}</>
                                : '검색어를 입력하세요.'}
                        </span>
                        <label style={{display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'}}>
                            <input type="checkbox" checked={unmanagedOnly}
                                   onChange={e => setUnmanagedOnly(e.target.checked)}/>
                            미등록 기업만
                        </label>
                    </div>

                    <div className={'ds_candidate_list'}>
                        {!keyword.trim() ? (
                            <div className={'ds_section_empty'}>기업명이나 사업자번호로 검색해 주세요.</div>
                        ) : rows.length === 0 ? (
                            <div className={'ds_section_empty'}>
                                조회된 기업이 없습니다.<br/>
                                기준 DB 에 없는 기업이면 고객사등록에서 먼저 만들어 주세요.
                            </div>
                        ) : rows.map(row => {
                            const justAdded = added.get(row.customerId);
                            const targetId = justAdded ?? row.targetId;
                            return (
                                <div key={row.customerId} className={'ds_candidate'} style={{cursor: 'default'}}>
                                    <div className={'ds_candidate_main'}>
                                        <div><span className={'ds_account_name'}>{row.name}</span></div>
                                        <div className={'ds_account_sub'}>
                                            {row.bizNo
                                                ? <span className={'ds_num'}>{row.bizNo}</span>
                                                : <span className={'ds_empty'}>사업자번호 미확인</span>}
                                            {' | '}{row.ceoName || EMPTY}
                                            {' | '}{regionText(row.sidoName, row.sigunguName)}
                                        </div>
                                    </div>
                                    {targetId ? (
                                        <Link href={`/domestic-sales/companies/${targetId}`}
                                              className={'ds_ghost_btn'} style={{lineHeight: '26px'}}
                                              onClick={close}>
                                            {justAdded ? '추가됨 · 상세' : '이미 등록 · 상세'}
                                        </Link>
                                    ) : (
                                        <button type="button" className={'ds_ghost_btn'}
                                                disabled={adding === row.customerId}
                                                onClick={() => addTarget(row)}>
                                            {adding === row.customerId ? '추가 중...' : '추가'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {total > SEARCH_LIMIT && (
                        <p className={'ds_sub'} style={{marginTop: 8}}>
                            {SEARCH_LIMIT}건까지만 보여줍니다. 검색어를 좁히거나{' '}
                            <Link href={'/domestic-sales/company-info'} onClick={close}
                                  style={{textDecoration: 'underline'}}>기업정보조회</Link>
                            에서 지역 필터와 함께 찾아보세요.
                        </p>
                    )}
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'save_btn'} onClick={close}>
                        {addedCount > 0 ? `완료 (${addedCount}건 추가)` : '닫기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
