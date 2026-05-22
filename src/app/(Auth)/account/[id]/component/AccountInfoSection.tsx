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
const PASSWORD_PATTERN = /^[!-~]{4,20}$/;
const stripDisallowed = (s: string) => s.replace(/[^!-~]/g, '');

export default function AccountInfoSection({user}: Props) {
    const {addPopup} = usePopupStore();
    const [password, setPassword] = useState('');
    const [name, setName] = useState(user.name ?? '');
    const [contact, setContact] = useState(user.contact ?? '');
    const [companyName, setCompanyName] = useState(user.companyName ?? '');
    const [department, setDepartment] = useState(user.department ?? '');
    const [position, setPosition] = useState(user.position ?? '');
    const [saving, setSaving] = useState(false);

    const isValid = useMemo(() => PASSWORD_PATTERN.test(password), [password]);
    const hasOnlyAllowed = useMemo(() => password === '' || PASSWORD_ALLOWED.test(password), [password]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(stripDisallowed(e.target.value));
    };

    const handleSave = () => {
        if (!name.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이름을 입력해주세요.'}/>);
            return;
        }
        if (password && !isValid) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호는 영문/숫자/특수문자 4~20자로 입력해주세요.'}/>);
            return;
        }

        // 변경된 필드만 전송 (백엔드: null=미수정, ""=반영)
        const payload: Record<string, string> = {};
        if (name.trim() !== (user.name ?? '')) payload.name = name.trim();
        if (contact.trim() !== (user.contact ?? '')) payload.contact = contact.trim();
        if (companyName.trim() !== (user.companyName ?? '')) payload.companyName = companyName.trim();
        if (department.trim() !== (user.department ?? '')) payload.department = department.trim();
        if (position.trim() !== (user.position ?? '')) payload.position = position.trim();
        if (password) payload.password = password;

        if (Object.keys(payload).length === 0) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'변경된 내용이 없습니다.'}/>);
            return;
        }

        addPopup(<AlertComponent alertType={'confirm'} infoContent={'수정하시겠습니까?'} callback={async () => {
            setSaving(true);
            try {
                const res = await callApi(`/api/admin/members/demo-users/${user.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(payload),
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
                        placeholder="영문/숫자/특수문자 4~20자 (한글·공백 불가)"
                        value={password}
                        onChange={handlePasswordChange}
                        maxLength={20}
                    />
                    {showError && (
                        <p className={'form_error'} style={{color: '#E74C3C', fontSize: 12, marginTop: 4}}>
                            영문/숫자/범용 특수문자 4~20자로 입력해주세요.
                        </p>
                    )}
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>이름</p>
                    <input type="text" value={name} maxLength={20}
                           onChange={e => setName(e.target.value)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>전화번호</p>
                    <input type="text" value={contact}
                           onChange={e => setContact(e.target.value)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>회사명</p>
                    <input type="text" value={companyName}
                           onChange={e => setCompanyName(e.target.value)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>부서</p>
                    <input type="text" value={department}
                           onChange={e => setDepartment(e.target.value)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>직함</p>
                    <input type="text" value={position}
                           onChange={e => setPosition(e.target.value)}/>
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
                <Link href="/account" className={'cancel_btn'}>취소</Link>
                <button type="button" className={'save_btn'} onClick={handleSave} disabled={saving}>저장</button>
            </div>
        </div>
    );
}
