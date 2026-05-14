'use client'

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface Props {
    onCreated?: () => void;
}

export default function PartnerCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [partnerName, setPartnerName] = useState('');
    const [partnerKey, setPartnerKey] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDuplChecked, setIsDuplChecked] = useState(false);

    const handleReset = () => {
        setPartnerName('');
        setPartnerKey('');
        setCreditAmount('');
        setStartDate('');
        setEndDate('');
        setIsDuplChecked(false);
    };

    const handleDuplCheck = async () => {
        if (!partnerKey.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'경로를 입력해주세요.'}/>);
            return;
        }
        // 목업: 항상 사용 가능
        addPopup(<AlertComponent alertType={'alert'} infoContent={'사용 가능한 경로입니다.'}/>);
        setIsDuplChecked(true);
    };

    const handleCreate = async () => {
        if (!partnerName.trim() || !partnerKey.trim() || !creditAmount || !startDate || !endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (!isDuplChecked) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'경로 중복체크를 해주세요.'}/>);
            return;
        }
        if (startDate > endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }

        // 목업: 등록 성공
        addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        handleReset();
        onCreated?.();
    };

    return (
        <div className={'partner_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field field_name'}>
                    <label>제휴명</label>
                    <div className={'input_wrap'}>
                        <input type="text" value={partnerName} autoComplete="off" maxLength={20}
                               onChange={e => setPartnerName(e.target.value.slice(0, 20))} placeholder={'최대 20자'}/>
                    </div>
                </div>
                <div className={'form_field field_path'}>
                    <label>제휴가입 전용경로</label>
                    <div className={'input_wrap'}>
                        <span className={'domain_prefix'}>www.tradeit.co.kr/partner/</span>
                        <input type="text" value={partnerKey} autoComplete="off" maxLength={20}
                               onChange={e => {
                                   setPartnerKey(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20));
                                   setIsDuplChecked(false);
                               }}
                               placeholder={'영문 or 숫자 최대 20자'}/>
                        <button type="button" className={'btn_check'} onClick={handleDuplCheck}
                                disabled={!partnerKey.trim()}>중복체크
                        </button>
                    </div>
                </div>
                <div className={'form_field field_credit'}>
                    <label>보너스 크레딧</label>
                    <div className={'input_wrap'}>
                        <input type="text" inputMode="numeric" autoComplete="off"
                               value={creditAmount}
                               onChange={e => {
                                   const raw = e.target.value.replace(/[^0-9]/g, '');
                                   const capped = raw ? String(Math.min(Number(raw), 100)) : '';
                                   setCreditAmount(capped);
                               }}
                               placeholder={''}/>
                        <span className={'unit'}>%</span>
                    </div>
                </div>
                <div className={'form_field field_period'}>
                    <label>가입혜택기간</label>
                    <div className={'input_wrap'}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                        <span className={'date_tilde'}>-</span>
                        <input type="date" value={endDate}
                               min={startDate || undefined}
                               onChange={e => setEndDate(e.target.value)}/>
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
