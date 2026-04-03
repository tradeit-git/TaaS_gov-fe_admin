'use client'

import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatBusinessNumber, isValidBusinessNumber, isValidEmail} from "@/utill/format";

type CheckStatus = null | 'duplicate' | 'available' | 'invalid';

interface Props {
    onCreated?: () => void;
}

export default function ClientCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [clientName, setClientName] = useState('');
    const [bizNo, setBizNo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [clientNameCheck, setClientNameCheck] = useState<CheckStatus>(null);
    const [bizNoCheck, setBizNoCheck] = useState<CheckStatus>(null);
    const [emailCheck, setEmailCheck] = useState<CheckStatus>(null);

    const handleReset = () => {
        setClientName('');
        setBizNo('');
        setEmail('');
        setPassword('');
        setClientNameCheck(null);
        setBizNoCheck(null);
        setEmailCheck(null);
    };

    const checkDuplicate = async (field: 'clientName' | 'bizNo' | 'email') => {
        const options: RequestInit = { method: 'GET', credentials: 'include' };

        switch (field) {
            case 'clientName': {
                if (!clientName.trim()) return;
                const res = await callApi(`/api/admin/clients/check-company-name?companyName=${encodeURIComponent(clientName.trim())}`, options);
                if (res.result && res.data) {
                    const {duplicate} = res.data as { duplicate: boolean };
                    setClientNameCheck(duplicate ? 'duplicate' : 'available');
                }
                break;
            }
            case 'bizNo': {
                if (!bizNo) return;
                if (!isValidBusinessNumber(bizNo)) {
                    setBizNoCheck('invalid');
                    return;
                }
                const res = await callApi(`/api/admin/clients/check-business-number?businessNumber=${encodeURIComponent(bizNo)}`, options);
                if (res.result && res.data) {
                    const {duplicate} = res.data as { duplicate: boolean };
                    setBizNoCheck(duplicate ? 'duplicate' : 'available');
                }
                break;
            }
            case 'email': {
                if (!email.trim()) return;
                if (!isValidEmail(email.trim())) {
                    setEmailCheck('invalid');
                    return;
                }
                const res = await callApi(`/api/admin/clients/check-login-id?loginId=${encodeURIComponent(email.trim())}`, options);
                if (res.result && res.data) {
                    const {duplicate} = res.data as { duplicate: boolean };
                    setEmailCheck(duplicate ? 'duplicate' : 'available');
                }
                break;
            }
        }
    };

    const handleCreate = async () => {
        if (!clientName.trim() || !bizNo || !email.trim() || !password) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (clientNameCheck !== 'available' || bizNoCheck !== 'available' || emailCheck !== 'available') {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'중복체크를 완료해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/clients`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                companyName: clientName.trim(),
                businessNumber: bizNo,
                loginId: email.trim(),
                password,
            }),
        });

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'계정이 생성되었습니다.'}/>);
            handleReset();
            onCreated?.();
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '계정 생성에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'client_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 고객사명</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={clientName} autoComplete="off"
                               onChange={e => { setClientName(e.target.value); setClientNameCheck(null); }}
                               placeholder={''}/>
                        {clientNameCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 정보입니다</p>}
                    </div>
                    <button type="button"
                            className={`btn_check ${clientNameCheck === 'available' ? 'disabled' : ''}`}
                            disabled={clientNameCheck === 'available'}
                            onClick={() => checkDuplicate('clientName')}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 사업자번호</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={bizNo} autoComplete="off"
                               onChange={e => {
                                   setBizNo(formatBusinessNumber(e.target.value));
                                   setBizNoCheck(null);
                               }}
                               placeholder={'000-00-00000'}/>
                        {bizNoCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 정보입니다</p>}
                        {bizNoCheck === 'invalid' && <p className={'error_msg'}>사업자번호 10자리를 입력해주세요</p>}
                    </div>
                    <button type="button"
                            className={`btn_check ${bizNoCheck === 'available' ? 'disabled' : ''}`}
                            disabled={bizNoCheck === 'available'}
                            onClick={() => checkDuplicate('bizNo')}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 아이디(E-mail)</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={email} autoComplete="new-email"
                               onChange={e => { setEmail(e.target.value); setEmailCheck(null); }}
                               placeholder={''}/>
                        {emailCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 정보입니다</p>}
                        {emailCheck === 'invalid' && <p className={'error_msg'}>올바른 이메일 형식을 입력해주세요</p>}
                    </div>
                    <button type="button"
                            className={`btn_check ${emailCheck === 'available' ? 'disabled' : ''}`}
                            disabled={emailCheck === 'available'}
                            onClick={() => checkDuplicate('email')}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 패스워드</label>
                    <input type="text" value={password} autoComplete="new-password" onChange={e => setPassword(e.target.value)} placeholder={''}/>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'} onClick={handleCreate}>계정생성</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
