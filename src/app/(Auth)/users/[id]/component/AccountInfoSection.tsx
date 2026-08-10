'use client';

import React, {useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {UserType} from "@/types/user/user";
import callApi from "@/utill/apiRequest";

interface Props {
    user: UserType;
}

// 영문 대소문자/숫자/범용 특수문자만 허용 (공백·한글 등 비 ASCII 차단)
const PASSWORD_ALLOWED = /^[!-~]+$/;
const PASSWORD_PATTERN = /^[!-~]{8,20}$/;
const stripDisallowed = (s: string) => s.replace(/[^!-~]/g, '');

export default function AccountInfoSection({user}: Props) {
    const {addPopup} = usePopupStore();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [memo, setMemo] = useState(user.memo ?? '');
    const [saving, setSaving] = useState(false);

    const isValid = useMemo(() => PASSWORD_PATTERN.test(password), [password]);
    const hasOnlyAllowed = useMemo(() => password === '' || PASSWORD_ALLOWED.test(password), [password]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(stripDisallowed(e.target.value));
    };

    const handleSave = () => {
        // 비밀번호는 선택 입력 — 입력했을 때만 형식 검증
        if (password && !isValid) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호는 영문/숫자/특수문자 8~20자로 입력해주세요.'}/>);
            return;
        }
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'저장하시겠습니까?'} callback={async () => {
            setSaving(true);
            try {
                const body: {memo: string; password?: string} = {memo};
                if (password) body.password = password;
                const res = await callApi(`/api/admin/members/users/${user.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(body),
                });
                if (res.result) {
                    setPassword('');
                    addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
                } else {
                    addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '저장에 실패했습니다.'}/>);
                }
            } finally {
                setSaving(false);
            }
        }}/>);
    };

    // 회원모드 접속 — 원-타임 티켓만 받아서 fe_crm 로그인 랜딩(/login/impersonate)으로 넘긴다.
    // 세션 발급/쿠키 처리는 fe_crm 이 담당한다. (관리자쪽에서 토큰을 직접 만지지 않음)
    const handleImpersonate = () => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={`${user.name || user.loginId} 계정으로 회원모드에 접속하시겠습니까?`} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${user.id}/impersonate`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.result || !res.data) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '회원모드 접속에 실패했습니다.'}/>);
                return;
            }
            const {ticket} = res.data as { ticket: string };
            const crmUrl = process.env.NEXT_PUBLIC_FRONT_URL ?? '';
            window.open(`${crmUrl}/login/impersonate?ticket=${encodeURIComponent(ticket)}`, '_blank');
        }}/>);
    };

    const showError = password !== '' && (!hasOnlyAllowed || !isValid);

    return (
        <div className={'company_detail_left'}>
            <div className={'section_title'} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span>
                    <span className={'admin_icon arrow_icon'}/>
                    계정정보
                </span>
                <button
                    type="button"
                    onClick={handleImpersonate}
                    style={{
                        backgroundColor: '#232323',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '6px 14px',
                        fontSize: 13,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >회원모드 접속</button>
            </div>

            <ul className={'form_list'}>
                <li className={'form_item'}>
                    <p className={'form_label'}>제휴가입</p>
                    <input type="text" readOnly disabled value={user.partnerName ?? '-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>아이디(e-mail)</p>
                    <input type="text" readOnly disabled value={user.loginId}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>패스워드</p>
                    <input
                        type="password"
                        autoComplete="new-password"
                        placeholder="영문/숫자/특수문자 8~20자 (한글·공백 불가)"
                        value={password}
                        onChange={handlePasswordChange}
                        maxLength={20}
                    />
                    {showError && (
                        <p className={'form_error'} style={{color: '#E74C3C', fontSize: 12, marginTop: 4}}>
                            영문/숫자/범용 특수문자 8~20자로 입력해주세요.
                        </p>
                    )}
                </li>
                <li className={'form_row'}>
                    <div className={'form_item'}>
                        <p className={'form_label'}>이름</p>
                        <input type="text" readOnly disabled value={user.name}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>전화번호</p>
                        <input type="text" readOnly disabled value={user.contact}/>
                    </div>
                </li>
                <li className={'form_row'}>
                    <div className={'form_item'}>
                        <p className={'form_label'}>회사명</p>
                        <input type="text" readOnly disabled value={user.companyName}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>부서</p>
                        <input type="text" readOnly disabled value={user.department || '-'}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>직함</p>
                        <input type="text" readOnly disabled value={user.position || '-'}/>
                    </div>
                </li>
                <li className={'form_row'}>
                    <div className={'form_item'}>
                        <p className={'form_label'}>회원가입일</p>
                        <input type="text" readOnly disabled value={formatDateDot(user.createdAt)}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>최근접속일</p>
                        <input type="text" readOnly disabled value={user.lastLoginAt ? formatDateDot(user.lastLoginAt) : '-'}/>
                    </div>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>메모</p>
                    <textarea
                        className={'user_memo_textarea'}
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                    />
                </li>
            </ul>

            <div className={'btn_wrap'}>
                <button type="button" className={'cancel_btn'} onClick={() => router.back()}>취소</button>
                <button type="button" className={'save_btn'} onClick={handleSave} disabled={saving}>저장</button>
            </div>
        </div>
    );
}
