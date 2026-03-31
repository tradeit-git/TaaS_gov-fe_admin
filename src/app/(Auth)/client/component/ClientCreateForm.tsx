'use client'

import {useState} from "react";

type CheckStatus = null | 'duplicate' | 'available';

// 목업: 이미 등록된 데이터
const existingData = {
    clientName: ['OOOOOOOOOOO', '테스트회사'],
    bizNo: ['000-00-00000'],
    email: ['abcedf000000@abcedfghijklmn.com'],
};

export default function ClientCreateForm() {
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

    const checkDuplicate = (field: 'clientName' | 'bizNo' | 'email') => {
        switch (field) {
            case 'clientName':
                setClientNameCheck(existingData.clientName.includes(clientName) ? 'duplicate' : 'available');
                break;
            case 'bizNo':
                setBizNoCheck(existingData.bizNo.map(v => v.replace(/[^0-9]/g, '')).includes(bizNo) ? 'duplicate' : 'available');
                break;
            case 'email':
                setEmailCheck(existingData.email.includes(email) ? 'duplicate' : 'available');
                break;
        }
    };

    return (
        <div className={'client_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 고객사명</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={clientName}
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
                        <input type="text" value={bizNo}
                               onChange={e => { setBizNo(e.target.value.replace(/[^0-9]/g, '').slice(0, 10)); setBizNoCheck(null); }}
                               placeholder={'숫자만 입력'}/>
                        {bizNoCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 정보입니다</p>}
                    </div>
                    <button type="button"
                            className={`btn_check ${bizNoCheck === 'available' ? 'disabled' : ''}`}
                            disabled={bizNoCheck === 'available'}
                            onClick={() => checkDuplicate('bizNo')}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 아이디(E-mail)</label>
                    <div className={'input_wrap'}>
                        <input type="email" value={email}
                               onChange={e => { setEmail(e.target.value); setEmailCheck(null); }}
                               placeholder={''}/>
                        {emailCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 정보입니다</p>}
                    </div>
                    <button type="button"
                            className={`btn_check ${emailCheck === 'available' ? 'disabled' : ''}`}
                            disabled={emailCheck === 'available'}
                            onClick={() => checkDuplicate('email')}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 패스워드</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={''}/>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'}>계정생성</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
