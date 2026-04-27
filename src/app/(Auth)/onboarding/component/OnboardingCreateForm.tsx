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

export default function OnboardingCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [clientName, setClientName] = useState('');
    const [bizNo, setBizNo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [bizNoCheck, setBizNoCheck] = useState<CheckStatus>(null);
    const [emailCheck, setEmailCheck] = useState<CheckStatus>(null);

    const handleReset = () => {
        setClientName('');
        setBizNo('');
        setEmail('');
        setPassword('');
        setBizNoCheck(null);
        setEmailCheck(null);
    };

    const checkDuplicate = async (field: 'email') => {
        const options: RequestInit = { method: 'GET', credentials: 'include' };

        switch (field) {
            case 'email': {
                if (!email.trim()) return;
                if (!isValidEmail(email.trim())) {
                    setEmailCheck('invalid');
                    return;
                }
                const res = await callApi(`/api/admin/members/clients/check-login-id?loginId=${encodeURIComponent(email.trim())}`, options);
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
        if (!isValidBusinessNumber(bizNo)) {
            setBizNoCheck('invalid');
            return;
        }
        if (emailCheck !== 'available') {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'중복체크를 완료해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/members/clients`, {
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
        <div className={'client_create_form onboarding_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 일시</label>
                    <div className={'input_wrap'}>
                        <input type="date" placeholder={''}/>
                        {emailCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 일시입니다</p>}
                        <select>
                            <option>선택</option>
                            <option>10:00</option>
                            <option>14:00</option>
                        </select>
                    </div>
                    <button type="button"
                            className={`btn_check ${emailCheck === 'available' ? 'disabled' : ''}`}
                            disabled={emailCheck === 'available'}
                            onClick={() => checkDuplicate('email')}>중복체크
                    </button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 온보딩 클래스</label>
                    <select>
                        <option>선택</option>
                        <option>우리 제품의 실제 해외 바이어 찾기 기본 실습</option>
                        <option>산업별 실제 해외 바이어 발굴 실습 '화장품, 뷰티'</option>
                        <option>산업별 실제 해외 바이어 발굴 실습 '식품, K-Food'</option>
                        <option>산업별 실제 해외 바이어 발굴 실습 '자동차부품'</option>
                        <option>산업별 실제 해외 바이어 발굴 실습 '기계, 산업제'</option>
                        <option>산업별 실제 해외 바이어 발굴 실습 '생활 소비재, 기타 소비재'</option>
                    </select>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 접속 URL</label>
                    <input type="text" placeholder={''}/>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 진행자</label>
                    <select>
                        <option>선택</option>
                        <option>이한열</option>
                        <option>양민지</option>
                        <option>정유나</option>
                    </select>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'} onClick={handleCreate}>등록</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
