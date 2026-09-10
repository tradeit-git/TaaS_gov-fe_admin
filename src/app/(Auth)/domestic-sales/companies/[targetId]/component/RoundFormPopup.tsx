'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {API_BASE, GRADE_LABELS, RESULT_LABELS, RoundRow} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    uId?: string;
    targetId: number;
    /** 없으면 새 회차 시작 */
    initialData?: RoundRow;
    onSuccess?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * 회차 생성 · 수정.
 * <p>
 * 등급은 선택이다. 명함만 받은 단계에서 강제하면 아무 값이나 찍힌다 (기획서 2.2).
 * 결과를 고르면 회차가 닫히고, 비우면 다시 진행중이 된다.
 */
export default function RoundFormPopup({uId, targetId, initialData, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const [saving, setSaving] = useState(false);

    const [salesGrade, setSalesGrade] = useState(initialData?.salesGrade ?? '');
    const [salesType, setSalesType] = useState(initialData?.salesType ?? '');
    const [startedOn, setStartedOn] = useState(initialData?.startedOn?.slice(0, 10) ?? today());
    const [endedOn, setEndedOn] = useState(initialData?.endedOn?.slice(0, 10) ?? '');
    const [result, setResult] = useState(initialData?.result ?? '');

    const handleSave = async () => {
        if (!startedOn) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'시작일을 입력해주세요.'}/>);
            return;
        }
        if (endedOn && endedOn < startedOn) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'종료일은 시작일보다 앞설 수 없습니다.'}/>);
            return;
        }

        setSaving(true);
        const url = isEdit ? `${API_BASE}/rounds/${initialData!.id}` : `${API_BASE}/companies/${targetId}/rounds`;

        const res = await callApi(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                salesGrade: salesGrade || null,
                salesType: salesType.trim() || null,
                startedOn,
                endedOn: endedOn || null,
                result: result || null,
            }),
        });
        setSaving(false);

        if (res.result) {
            closePopup(uId ?? '');
            onSuccess?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '저장에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? `${initialData!.roundNo}차 정보 수정` : '새 회차 시작'}</h4>

                <div className={'popup_body'}>
                    <div className={'popup_field'}>
                        <label>영업등급</label>
                        <select value={salesGrade} onChange={e => setSalesGrade(e.target.value)}>
                            <option value={''}>미정</option>
                            {Object.entries(GRADE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={'popup_field'}>
                        <label>영업유형</label>
                        <input type="text" value={salesType} placeholder={'예) 전시회 리드, 소개, 콜드콜'}
                               onChange={e => setSalesType(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>시작일 <span className={'required'}>*</span></label>
                        <input type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label>결과</label>
                        <select value={result} onChange={e => setResult(e.target.value)}>
                            <option value={''}>진행중</option>
                            {Object.entries(RESULT_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {result && (
                        <div className={'popup_field'}>
                            <label>종료일</label>
                            <input type="date" value={endedOn} min={startedOn}
                                   onChange={e => setEndedOn(e.target.value)}/>
                            <p className={'ds_sub'} style={{marginTop: 4}}>비워두면 오늘로 저장됩니다.</p>
                        </div>
                    )}
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={handleSave}>
                        {saving ? '저장 중...' : (isEdit ? '수정' : '시작')}
                    </button>
                </div>
            </div>
        </div>
    );
}
