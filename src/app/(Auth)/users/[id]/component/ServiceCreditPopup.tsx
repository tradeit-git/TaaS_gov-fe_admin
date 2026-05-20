'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface ServiceCreditFormData {
    startDate: string;
    endDate: string;
    credit: string;
}

interface Props {
    uId?: string;
    planName: string;
    initialData?: ServiceCreditFormData;
    /** 이용기간이 이미 시작된 경우: 시작일/크레딧 수정 불가 */
    started?: boolean;
    onSave?: (data: ServiceCreditFormData) => void;
}

const formatNumberWithComma = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default function ServiceCreditPopup({uId, planName, initialData, started, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;

    const [form, setForm] = useState<ServiceCreditFormData>(initialData ?? {
        startDate: '',
        endDate: '',
        credit: '',
    });

    const handleSave = () => {
        if (!form.startDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'이용기간 시작일을 입력해주세요.'}/>);
            return;
        }
        if (!form.endDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'이용기간 종료일을 입력해주세요.'}/>);
            return;
        }
        if (form.startDate > form.endDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }
        if (!form.credit) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'크레딧을 입력해주세요.'}/>);
            return;
        }

        onSave?.(form);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={'overseas_plan_popup service_credit_popup'}>
                <h4>서비스 크레딧{isEdit ? ' 수정' : ''}</h4>

                <div className={'popup_field'}>
                    <label className={'label_required'}>플랜구분</label>
                    <span className={'field_value'}>{planName}</span>
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>이용기간</label>
                    <div className={'date_range'}>
                        <input type="date" value={form.startDate}
                               disabled={isEdit && started}
                               onChange={e => setForm(prev => ({...prev, startDate: e.target.value}))}/>
                        <span className={'date_separator'}>-</span>
                        <input type="date" value={form.endDate}
                               onChange={e => setForm(prev => ({...prev, endDate: e.target.value}))}/>
                    </div>
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>크레딧</label>
                    <input type="text" value={form.credit}
                           disabled={isEdit && started}
                           onChange={e => setForm(prev => ({...prev, credit: formatNumberWithComma(e.target.value)}))}/>
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}