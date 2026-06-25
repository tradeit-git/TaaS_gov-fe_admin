'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface Props {
    uId?: string;
    // 지급 대상 인원 수 (제목 표기용)
    count?: number;
    // 입력값 확정 시 호출 — 실제 지급(POST 루프)은 부모가 처리
    onConfirm: (amount: number, expireDate: string | null) => Promise<void> | void;
}

const MAX_CREDIT = 100000;

const formatNumberWithComma = (value: string) => {
    const num = Math.min(Number(value.replace(/[^0-9]/g, '')) || 0, MAX_CREDIT);
    if (num === 0) return '';
    return num.toLocaleString();
};

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 디폴트 만료일: 오늘 + 1개월
const defaultExpireISO = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return toISODate(d);
};

// 만료일 최소값: 오늘 + 1일
const minExpireISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
};

export default function CreditGrantPopup({uId, count, onConfirm}: Props) {
    const {closePopup, addPopup} = usePopupStore();

    const [amount, setAmount] = useState('');
    const [expireDate, setExpireDate] = useState(defaultExpireISO());
    const [noExpire, setNoExpire] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleExpireDateChange = (value: string) => {
        if (value && value < minExpireISO()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'만료일은 내일 이후로 선택해주세요.'}/>);
            return;
        }
        setExpireDate(value);
    };

    const handleSave = async () => {
        if (!amount) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'크레딧을 입력해주세요.'}/>);
            return;
        }
        if (!noExpire && !expireDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'만료일을 입력해주세요.'}/>);
            return;
        }

        setSaving(true);
        await onConfirm(Number(amount.replace(/,/g, '')) || 0, noExpire ? null : expireDate);
        setSaving(false);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={'overseas_plan_popup service_credit_popup'}>
                <h4>크레딧 추가 지급{count && count > 1 ? ` (${count}명)` : ''}</h4>

                <div className={'popup_field'}>
                    <label className={'label_required'}>만료일 <span className={'required'}>*</span></label>
                    <div className={'date_range'}>
                        <input type="date" value={noExpire ? '' : expireDate}
                               min={minExpireISO()}
                               disabled={noExpire}
                               onChange={e => handleExpireDateChange(e.target.value)}/>
                        <label className={'no_expire_check'}>
                            <input type="checkbox" checked={noExpire}
                                   onChange={e => setNoExpire(e.target.checked)}/>
                            없음
                        </label>
                    </div>
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>크레딧 <span className={'required'}>*</span></label>
                    <input type="text" value={amount}
                           onChange={e => setAmount(formatNumberWithComma(e.target.value))}/>
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={handleSave}>
                        {saving ? '지급 중...' : '지급'}</button>
                </div>
            </div>
        </div>
    );
}
