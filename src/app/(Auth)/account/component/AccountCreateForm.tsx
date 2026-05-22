'use client'

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {regExps} from "@/utill/regExps";

interface Props {
    onCreated?: (account: {email: string; name: string}) => void;
}

// 소문자/숫자/_.- 만 허용 (대문자·공백·허용 외 특수문자 차단)
const isValidEmail = (email: string) => regExps.email().test(email);
const LOCAL_ALLOWED = /^[a-z0-9_.-]*$/;   // 로컬파트 허용 문자
const DOMAIN_ALLOWED = /^[a-z0-9.-]*$/;   // 도메인 허용 문자
const CHAR_ERROR = '소문자/숫자/_.- 만 입력 가능합니다. (대문자·공백·특수문자 불가)';

export default function AccountCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [emailLocal, setEmailLocal] = useState('');
    const [emailDomain, setEmailDomain] = useState('');
    const [isDuplChecked, setIsDuplChecked] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [name, setName] = useState('');

    const isPasswordMatched = password.length > 0 && password === passwordConfirm;

    const handleReset = () => {
        setEmailLocal('');
        setEmailDomain('');
        setIsDuplChecked(false);
        setEmailError('');
        setPassword('');
        setPasswordConfirm('');
        setName('');
    };

    const handleDuplCheck = async () => {
        if (!emailLocal.trim() || !emailDomain.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이메일을 입력해주세요.'}/>);
            return;
        }

        const email = `${emailLocal.trim()}@${emailDomain.trim()}`;
        if (!isValidEmail(email)) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'올바른 이메일 형식이 아닙니다. (소문자/숫자/_.- 만 가능)'}/>);
            setIsDuplChecked(false);
            setEmailError('이메일 형식을 확인해주세요. (대문자·공백·특수문자 불가)');
            return;
        }
        const res = await callApi(`/api/admin/members/demo-users/check-login-id?loginId=${encodeURIComponent(email)}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (!res.result || !res.data) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '중복체크에 실패했습니다.'}/>);
            return;
        }

        const {duplicate} = res.data as {duplicate: boolean};
        if (duplicate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미 사용 중인 이메일입니다.'}/>);
            setIsDuplChecked(false);
            setEmailError('이미 사용중인 메일입니다.');
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'사용 가능한 이메일입니다.'}/>);
            setIsDuplChecked(true);
            setEmailError('');
        }
    };

    const handleCreate = () => {
        if (!emailLocal.trim() || !emailDomain.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이메일을 입력해주세요.'}/>);
            return;
        }
        if (!isDuplChecked) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이메일 중복체크를 해주세요.'}/>);
            return;
        }
        if (!password || !passwordConfirm) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호를 입력해주세요.'}/>);
            return;
        }
        if (password.length < 4) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호는 최소 4자리 이상이어야 합니다.'}/>);
            return;
        }
        if (!isPasswordMatched) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호가 일치하지 않습니다.'}/>);
            return;
        }
        if (!name.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이름을 입력해주세요.'}/>);
            return;
        }

        const email = `${emailLocal.trim()}@${emailDomain.trim()}`;
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'계정을 등록하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/demo-users`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    name: name.trim(),
                    loginId: email,
                    password,
                    userType: 0,
                }),
            });
            if (res.result) {
                onCreated?.({email, name: name.trim()});
                addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
                handleReset();
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '등록에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'partner_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field field_email'}>
                    <label>ID(e-mail)</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={emailLocal} autoComplete="off" placeholder="아이디"
                               onChange={e => {
                                   const v = e.target.value;
                                   setEmailLocal(v);
                                   setIsDuplChecked(false);
                                   setEmailError(LOCAL_ALLOWED.test(v) ? '' : CHAR_ERROR);
                               }}/>
                        <span className={'email_at'}>@</span>
                        <input type="text" value={emailDomain} autoComplete="off" placeholder="example.com"
                               onChange={e => {
                                   const v = e.target.value;
                                   setEmailDomain(v);
                                   setIsDuplChecked(false);
                                   setEmailError(DOMAIN_ALLOWED.test(v) ? '' : CHAR_ERROR);
                               }}/>
                        <button type="button" className={'btn_check'} onClick={handleDuplCheck}
                                disabled={!emailLocal.trim() || !emailDomain.trim() || isDuplChecked}>중복체크
                        </button>
                        {emailError && <span className={'error_msg'}>{emailError}</span>}
                    </div>
                </div>
                <div className={'form_field field_password'}>
                    <label>비밀번호</label>
                    <div className={'input_wrap'}>
                        <input type="password" value={password} autoComplete="new-password" placeholder="영문/숫자/특수문자 4~20자 (한글·공백 불가)"
                               onChange={e => setPassword(e.target.value)}/>
                        <input type="password" value={passwordConfirm} autoComplete="new-password" placeholder="비밀번호 확인"
                               onChange={e => setPasswordConfirm(e.target.value)}/>
                        <span className={`match_status ${passwordConfirm.length > 0 ? (isPasswordMatched ? 'matched' : 'unmatched') : ''}`}>
                            {passwordConfirm.length > 0 ? (isPasswordMatched ? '일치' : '불일치') : ''}
                        </span>
                    </div>
                </div>
                <div className={'form_field field_name'}>
                    <label>이름</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={name} autoComplete="off" maxLength={20} placeholder="이름"
                               onChange={e => setName(e.target.value.slice(0, 20))}/>
                    </div>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'} onClick={handleCreate}>등록</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
