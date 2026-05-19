'use client'

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

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
    const isComposing = useRef(false);

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

        const res = await callApi(`/api/admin/coalition-keys/check-duplicate?partnerKey=${encodeURIComponent(partnerKey.trim())}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res && res.result) {
            if (res.data as unknown as boolean) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'이미 사용 중인 경로입니다.'}/>);
                setIsDuplChecked(false);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'사용 가능한 경로입니다.'}/>);
                setIsDuplChecked(true);
            }
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res?.message || '중복체크에 실패했습니다.'}/>);
        }
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

        const res = await callApi(`/api/admin/coalition-keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerKey: partnerKey,
                partnerName: partnerName,
                bonusCredit: Number(creditAmount),
                startDate: startDate,
                endDate: endDate,
            }),
        });

        if(res && res.result) {
            // 목업: 등록 성공
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            handleReset();
            onCreated?.();
        } else {
            //  addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '수정에 실패했습니다.'}/>);
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '등록에 실패하였습니다.'}/>);
        }
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
                               onCompositionStart={() => { isComposing.current = true; }}
                               onCompositionEnd={e => {
                                   isComposing.current = false;
                                   const filtered = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
                                   setPartnerKey(filtered);
                                   setIsDuplChecked(false);
                               }}
                               onChange={e => {
                                   if (isComposing.current) {
                                       setPartnerKey(e.target.value);
                                       return;
                                   }
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
