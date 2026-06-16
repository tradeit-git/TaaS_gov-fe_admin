'use client';

import React, {useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {accountTypeLabel} from "@/utill/accountType";
import {CreditSummaryType} from "@/types/user/user";

// 등록용 사용자 검색(#2 search-users) 응답 항목 = UserListDTO
export interface SelectableUser {
    id: number;
    userType: string | null;       // 계정 타입
    companyName: string | null;
    loginId: string;               // ID(이메일)
    name: string;
    department: string | null;
    position: string | null;
    planName: string | null;       // 현재 플랜
    partnerName: string | null;    // 협회제휴
    creditSummary: CreditSummaryType | null;
    lastLoginAt: string | null;    // 최근접속일
    createdAt: string | null;      // 가입일
}

interface Props {
    uId?: string;
    onSave?: (payload: {userId: number}) => void | Promise<void | boolean>;
}

export default function UserSelectPopup({uId, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const [users, setUsers] = useState<SelectableUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<SelectableUser | null>(null);
    const [saving, setSaving] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    // 미등록 사용자 검색 (keyword 서버 전달, 디바운스). keyword 생략 시 전체.
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(async () => {
            const kw = keyword.trim();
            const qs = kw ? `?keyword=${encodeURIComponent(kw)}` : '';
            const res = await callApi(`/api/admin/managed-users/search-users${qs}`, {
                method: 'GET',
                credentials: 'include',
            });
            setLoading(false);
            if (res.result && Array.isArray(res.data)) {
                setUsers(res.data as SelectableUser[]);
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [keyword]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleSelect = (user: SelectableUser) => {
        setSelected(user);
        setKeyword('');
        setOpen(false);
    };

    const handleSave = async () => {
        if (!selected) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'등록할 사용자를 선택해주세요.'}/>);
            return;
        }
        setSaving(true);
        const result = await onSave?.({userId: selected.id});
        setSaving(false);
        if (result !== false) {
            closePopup(uId ?? '');
        }
    };

    const fmt = (v: string | null | undefined) => (v && v.trim() ? v : '-');
    const deptPosition = [selected?.department, selected?.position].filter(v => v && v.trim()).join(' / ');
    const credit = selected?.creditSummary;

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup user_select_popup'}>
                <h4>관리 사용자 등록</h4>

                <div className={'popup_body'}>
                    {/* 검색형 셀렉트 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>사용자 선택 <span className={'required'}>*</span></label>
                        <div className={'search_select'} ref={wrapRef}>
                            <span className={'search_icon'}/>
                            <input
                                type="text"
                                value={keyword}
                                placeholder={'사용자명, 아이디, 기업명으로 검색'}
                                onChange={e => {
                                    setKeyword(e.target.value);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                            />
                            {open && (
                                <ul className={'search_select_list'}>
                                    {loading ? (
                                        <li className={'search_select_empty'}>불러오는 중...</li>
                                    ) : users.length === 0 ? (
                                        <li className={'search_select_empty'}>등록 가능한 사용자가 없습니다.</li>
                                    ) : (
                                        <>
                                            <li className={'search_select_head'}>
                                                <span>기업명</span>
                                                <span>이름</span>
                                                <span>로그인 ID</span>
                                            </li>
                                            {users.map(user => (
                                                <li key={user.id}
                                                    className={`search_select_item${selected?.id === user.id ? ' on' : ''}`}
                                                    onClick={() => handleSelect(user)}>
                                                    <span className={'ss_company'} title={user.companyName || '-'}>{user.companyName || '-'}</span>
                                                    <span className={'ss_name'} title={user.name || '-'}>{user.name || '-'}</span>
                                                    <span className={'ss_login'} title={user.loginId || '-'}>{user.loginId || '-'}</span>
                                                </li>
                                            ))}
                                        </>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 선택된 사용자 정보 (선택 전엔 빈 폼 유지) */}
                    <ul className={'member_info_form'}>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>계정 타입</p>
                            <span className={'mi_value'}>{accountTypeLabel(selected?.userType)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>ID(이메일)</p>
                            <span className={'mi_value'}>{fmt(selected?.loginId)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>이름</p>
                            <span className={'mi_value'}>{fmt(selected?.name)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>기업명</p>
                            <span className={'mi_value'}>{fmt(selected?.companyName)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>부서/직함</p>
                            <span className={'mi_value'}>{fmt(deptPosition)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>현재 플랜</p>
                            <span className={'mi_value'}>{fmt(selected?.planName)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>크레딧 사용현황</p>
                            {selected ? (
                                <div className={'mi_value credit_summary'}>
                                    <span>지급 {(credit?.granted ?? 0).toLocaleString()}</span>
                                    <span>사용 {(credit?.used ?? 0).toLocaleString()}</span>
                                    <span>소멸 {(credit?.expired ?? 0).toLocaleString()}</span>
                                    <span className={'cs_balance'}>잔여 {(credit?.balance ?? 0).toLocaleString()}</span>
                                </div>
                            ) : (
                                <span className={'mi_value'}>-</span>
                            )}
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>협회제휴</p>
                            <span className={'mi_value'}>{fmt(selected?.partnerName)}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>최근접속일</p>
                            <span className={'mi_value'}>{selected?.lastLoginAt ? formatDateDot(selected.lastLoginAt) : '-'}</span>
                        </li>
                        <li className={'mi_item'}>
                            <p className={'mi_label'}>가입일</p>
                            <span className={'mi_value'}>{selected?.createdAt ? formatDateDot(selected.createdAt) : '-'}</span>
                        </li>
                    </ul>
                </div>

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving || !selected} onClick={handleSave}>
                        {saving ? '등록 중...' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
}
