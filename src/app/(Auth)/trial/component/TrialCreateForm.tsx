'use client'

import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface Props {
    onCreated?: () => void;
}

export default function TrialCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [trialName, setTrialName] = useState('');
    const [trialKey, setTrialKey] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleReset = () => {
        setTrialName('');
        setTrialKey('');
        setCreditAmount('');
        setStartDate('');
        setEndDate('');
    };

    const handleCreate = async () => {
        if (!trialName.trim() || !trialKey.trim() || !creditAmount || !startDate || !endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/trial-keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                trialKey: trialKey.trim(),
                trialName: trialName.trim(),
                startDate,
                endDate,
                creditAmount: Number(creditAmount),
                maxUses: null,
            }),
        });

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            handleReset();
            onCreated?.();
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '등록에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'client_create_form trial_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 관련프로그램</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={trialName} autoComplete="off"
                               onChange={e => setTrialName(e.target.value)} placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 도메인</label>
                    <div className={'input_wrap domain_wrap'}>
                        <span className={'domain_prefix'}>www.tradeit.co.kr / </span>
                        <input type="text" value={trialKey} autoComplete="off"
                               onChange={e => setTrialKey(e.target.value)} placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 크레딧</label>
                    <div className={'input_wrap'}>
                        <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
                               value={creditAmount}
                               onChange={e => setCreditAmount(e.target.value.replace(/[^0-9]/g, ''))}
                               placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 운영기간</label>
                    <div className={'input_wrap date_range_wrap'}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                        <span className={'date_tilde'}>-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
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
