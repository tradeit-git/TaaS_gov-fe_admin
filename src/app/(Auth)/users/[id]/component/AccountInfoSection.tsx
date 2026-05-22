'use client';

import Link from "next/link";
import React, {useMemo, useState} from "react";
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
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const isValid = useMemo(() => PASSWORD_PATTERN.test(password), [password]);
    const hasOnlyAllowed = useMemo(() => password === '' || PASSWORD_ALLOWED.test(password), [password]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(stripDisallowed(e.target.value));
    };

    const handleSave = () => {
        if (!password) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호를 입력해주세요.'}/>);
            return;
        }
        if (!isValid) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호는 영문/숫자/특수문자 8~20자로 입력해주세요.'}/>);
            return;
        }
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'비밀번호를 변경하시겠습니까?'} callback={async () => {
            setSaving(true);
            try {
                const res = await callApi(`/api/admin/members/users/${user.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({password}),
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

    const showError = password !== '' && (!hasOnlyAllowed || !isValid);

    return (
        <div className={'company_detail_left'}>
            <div className={'section_title'}>
                <span className={'admin_icon arrow_icon'}/>
                계정정보
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
                <li className={'form_item'}>
                    <p className={'form_label'}>이름</p>
                    <input type="text" readOnly disabled value={user.name}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>전화번호</p>
                    <input type="text" readOnly disabled value={user.contact}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>회사명</p>
                    <input type="text" readOnly disabled value={user.companyName}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>부서</p>
                    <input type="text" readOnly disabled value={user.department || '-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>직함</p>
                    <input type="text" readOnly disabled value={user.position || '-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>회원가입일</p>
                    <input type="text" readOnly disabled value={formatDateDot(user.createdAt)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>최근접속일</p>
                    <input type="text" readOnly disabled value={user.lastLoginAt ? formatDateDot(user.lastLoginAt) : '-'}/>
                </li>
            </ul>

            <div className={'btn_wrap'}>
                <Link href="/users" className={'cancel_btn'}>취소</Link>
                <button type="button" className={'save_btn'} onClick={handleSave} disabled={saving || !isValid}>저장</button>
            </div>
        </div>
    );
}
