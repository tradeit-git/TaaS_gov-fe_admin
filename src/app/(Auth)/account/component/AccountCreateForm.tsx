'use client'

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface Props {
    onCreated?: (account: {email: string; name: string}) => void;
}

// 목업: 이미 사용 중인 이메일 (API 연동 전 임시)
const MOCK_USED_EMAILS = [
    'sales01@tradeit.co.kr',
    'sales02@tradeit.co.kr',
    'admin@tradeit.co.kr',
];

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

    const handleDuplCheck = () => {
        if (!emailLocal.trim() || !emailDomain.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이메일을 입력해주세요.'}/>);
            return;
        }

        const email = `${emailLocal.trim()}@${emailDomain.trim()}`;

        // 목업: API 연동 전 클라이언트 중복 판정
        if (MOCK_USED_EMAILS.includes(email.toLowerCase())) {
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
        if (!isPasswordMatched) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'비밀번호가 일치하지 않습니다.'}/>);
            return;
        }
        if (!name.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이름을 입력해주세요.'}/>);
            return;
        }

        const email = `${emailLocal.trim()}@${emailDomain.trim()}`;
        onCreated?.({email, name: name.trim()});
        addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        handleReset();
    };

    return (
        <div className={'partner_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field field_email'}>
                    <label>ID(e-mail)</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={emailLocal} autoComplete="off"
                               onChange={e => {
                                   setEmailLocal(e.target.value);
                                   setIsDuplChecked(false);
                                   setEmailError('');
                               }}/>
                        <span className={'email_at'}>@</span>
                        <input type="text" value={emailDomain} autoComplete="off"
                               onChange={e => {
                                   setEmailDomain(e.target.value);
                                   setIsDuplChecked(false);
                                   setEmailError('');
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
                        <input type="password" value={password} autoComplete="new-password"
                               onChange={e => setPassword(e.target.value)}/>
                        <input type="password" value={passwordConfirm} autoComplete="new-password"
                               onChange={e => setPasswordConfirm(e.target.value)}/>
                        <span className={`match_status ${passwordConfirm.length > 0 ? (isPasswordMatched ? 'matched' : 'unmatched') : ''}`}>
                            {passwordConfirm.length > 0 ? (isPasswordMatched ? '일치' : '불일치') : ''}
                        </span>
                    </div>
                </div>
                <div className={'form_field field_name'}>
                    <label>이름</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={name} autoComplete="off" maxLength={20}
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
