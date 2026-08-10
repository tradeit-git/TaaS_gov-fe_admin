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
    // demo-users: 프로필 편집 가능 + 비번 4~20 / users: 프로필 읽기전용 + 비번 8~20
    memberType: 'users' | 'demo-users';
}

// 영문 대소문자/숫자/범용 특수문자만 허용 (공백·한글 등 비 ASCII 차단)
const PASSWORD_ALLOWED = /^[!-~]+$/;
const stripDisallowed = (s: string) => s.replace(/[^!-~]/g, '');

export default function AccountInfoSection({user, memberType}: Props) {
    const isDemo = memberType === 'demo-users';   // 유일한 분기 기준
    const passwordMin = isDemo ? 4 : 8;
    const passwordPattern = useMemo(() => new RegExp(`^[!-~]{${passwordMin},20}$`), [passwordMin]);

    const {addPopup} = usePopupStore();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [name, setName] = useState(user.name ?? '');
    const [contact, setContact] = useState(user.contact ?? '');
    const [companyName, setCompanyName] = useState(user.companyName ?? '');
    const [department, setDepartment] = useState(user.department ?? '');
    const [position, setPosition] = useState(user.position ?? '');
    const [memo, setMemo] = useState(user.memo ?? '');
    const [saving, setSaving] = useState(false);

    const isValid = useMemo(() => passwordPattern.test(password), [passwordPattern, password]);
    const hasOnlyAllowed = useMemo(() => password === '' || PASSWORD_ALLOWED.test(password), [password]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(stripDisallowed(e.target.value));
    };

    const handleSave = () => {
        // 프로필 편집이 가능한 demo 계정만 이름 필수 검증
        if (isDemo && !name.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이름을 입력해주세요.'}/>);
            return;
        }
        if (password && !isValid) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={`비밀번호는 영문/숫자/특수문자 ${passwordMin}~20자로 입력해주세요.`}/>);
            return;
        }

        // 변경된 필드만 전송 (백엔드: null=미수정, ""=반영)
        const payload: Record<string, string> = {};
        if (isDemo) {
            if (name.trim() !== (user.name ?? '')) payload.name = name.trim();
            if (contact.trim() !== (user.contact ?? '')) payload.contact = contact.trim();
            if (companyName.trim() !== (user.companyName ?? '')) payload.companyName = companyName.trim();
            if (department.trim() !== (user.department ?? '')) payload.department = department.trim();
            if (position.trim() !== (user.position ?? '')) payload.position = position.trim();
        }
        if (memo !== (user.memo ?? '')) payload.memo = memo;
        if (password) payload.password = password;

        if (Object.keys(payload).length === 0) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'변경된 내용이 없습니다.'}/>);
            return;
        }

        addPopup(<AlertComponent alertType={'confirm'} infoContent={'저장하시겠습니까?'} callback={async () => {
            setSaving(true);
            try {
                const res = await callApi(`/api/admin/members/${memberType}/${user.id}`, {
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

    // 회원모드 접속 — 원-타임 티켓만 받아서 fe_crm 로그인 랜딩(/login/impersonate)으로 넘긴다.
    // 세션 발급/쿠키 처리는 fe_crm 이 담당한다. (관리자쪽에서 토큰을 직접 만지지 않음)
    const handleImpersonate = () => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={`${user.name || user.loginId} 계정으로 회원모드에 접속하시겠습니까?`} callback={async () => {
            const res = await callApi(`/api/admin/members/${memberType}/${user.id}/impersonate`, {
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
    // demo 는 편집 가능, users 는 읽기전용
    const editableProps = isDemo ? {} : {readOnly: true, disabled: true};

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
                        placeholder={`영문/숫자/특수문자 ${passwordMin}~20자 (한글·공백 불가)`}
                        value={password}
                        onChange={handlePasswordChange}
                        maxLength={20}
                    />
                    {showError && (
                        <p className={'form_error'} style={{color: '#E74C3C', fontSize: 12, marginTop: 4}}>
                            영문/숫자/범용 특수문자 {passwordMin}~20자로 입력해주세요.
                        </p>
                    )}
                </li>
                <li className={'form_row'}>
                    <div className={'form_item'}>
                        <p className={'form_label'}>이름</p>
                        <input type="text" value={name} maxLength={20}
                               onChange={e => setName(e.target.value)} {...editableProps}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>전화번호</p>
                        <input type="text" value={contact}
                               onChange={e => setContact(e.target.value)} {...editableProps}/>
                    </div>
                </li>
                <li className={'form_row'}>
                    <div className={'form_item'}>
                        <p className={'form_label'}>회사명</p>
                        <input type="text" value={companyName}
                               onChange={e => setCompanyName(e.target.value)} {...editableProps}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>부서</p>
                        <input type="text" value={department}
                               onChange={e => setDepartment(e.target.value)} {...editableProps}/>
                    </div>
                    <div className={'form_item'}>
                        <p className={'form_label'}>직함</p>
                        <input type="text" value={position}
                               onChange={e => setPosition(e.target.value)} {...editableProps}/>
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
