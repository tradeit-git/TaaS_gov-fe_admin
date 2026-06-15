'use client';

import {useMemo, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import callApi from "@/utill/apiRequest";

interface Props {
    uId?: string;
    initialData?: {
        id: number;
        companyName: string;
        businessNumber: string;
        ceoName: string;
        sidoName: string | null;
        sigunguName: string | null;
        businessField: string;
    };
    onSuccess?: () => void;
}

export default function ClientFormPopup({uId, initialData, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const {appConfig} = useAppConfigStore();
    const divisions = appConfig.administrativeDivisions;
    const isEdit = !!initialData;
    const [saving, setSaving] = useState(false);

    // 시/도 목록 (level 1)
    const sidoList = useMemo(() => divisions.filter(d => d.level === 1), [divisions]);

    // 수정 모드: sidoName/sigunguName에서 id 역산
    const initialIds = useMemo(() => {
        if (!initialData?.sidoName) return {sido: 0, sigungu: 0};
        const sido = sidoList.find(d => d.nameKr === initialData.sidoName);
        if (!sido) return {sido: 0, sigungu: 0};
        if (!initialData.sigunguName) return {sido: sido.id, sigungu: 0};
        const sigungu = divisions.find(d => d.upId === sido.id && d.nameKr === initialData.sigunguName);
        return {sido: sido.id, sigungu: sigungu?.id ?? 0};
    }, [initialData, sidoList, divisions]);

    const [companyName, setCompanyName] = useState(initialData?.companyName ?? '');
    const [businessNumber, setBusinessNumber] = useState(initialData?.businessNumber ?? '');
    const [ceoName, setCeoName] = useState(initialData?.ceoName ?? '');
    const [sidoId, setSidoId] = useState<number>(initialIds.sido);
    const [sigunguId, setSigunguId] = useState<number>(initialIds.sigungu);
    const [businessField, setBusinessField] = useState(initialData?.businessField ?? '');

    // 선택된 시/도의 시군구 목록
    const sigunguList = useMemo(() => {
        if (!sidoId) return [];
        return divisions.filter(d => d.upId === sidoId);
    }, [sidoId, divisions]);

    // 선택된 시/도 객체
    const selectedSido = useMemo(() => sidoList.find(d => d.id === sidoId), [sidoId, sidoList]);

    const handleSave = async () => {
        if (!companyName.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'고객사명을 입력해주세요.'}/>);
            return;
        }
        if (!businessNumber.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'사업자번호를 입력해주세요.'}/>);
            return;
        }
        if (!ceoName.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'대표자명을 입력해주세요.'}/>);
            return;
        }

        const payload = {
            name: companyName.trim(),
            bizNo: businessNumber.trim(),
            ceoName: ceoName.trim(),
            sidoId: sidoId || null,
            sigunguId: sigunguId || null,
            bizField: businessField.trim() || null,
        };

        setSaving(true);
        const res = isEdit
            ? await callApi(`/api/admin/sales/customers/${initialData!.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(payload),
            })
            : await callApi('/api/admin/sales/customers', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(payload),
            });
        setSaving(false);

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={isEdit ? '수정되었습니다.' : '등록되었습니다.'}/>);
            closePopup(uId ?? '');
            onSuccess?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? '고객사 수정' : '고객사 등록'}</h4>

                <div className={'popup_body'}>
                    <div className={'popup_field'}>
                        <label className={'label_required'}>고객사명 <span className={'required'}>*</span></label>
                        <input type="text" value={companyName}
                               placeholder={'고객사명을 입력해주세요'}
                               onChange={e => setCompanyName(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>사업자번호 <span className={'required'}>*</span></label>
                        <input type="text" value={businessNumber}
                               placeholder={'000-00-00000'}
                               onChange={e => setBusinessNumber(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>대표자 <span className={'required'}>*</span></label>
                        <input type="text" value={ceoName}
                               placeholder={'대표자명을 입력해주세요'}
                               onChange={e => setCeoName(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>소재지역</label>
                        <div className={'region_select_wrap'}>
                            <select value={sidoId} onChange={e => {
                                const id = Number(e.target.value);
                                setSidoId(id);
                                setSigunguId(0);
                            }}>
                                <option value={0}>시/도 선택</option>
                                {sidoList.map(d => (
                                    <option key={d.id} value={d.id}>{d.nameKr}</option>
                                ))}
                            </select>
                            <select value={sigunguId}
                                    disabled={!sidoId || !!selectedSido?.isLeaf || sigunguList.length === 0}
                                    onChange={e => setSigunguId(Number(e.target.value))}>
                                <option value={0}>시/군/구 선택</option>
                                {sigunguList.map(d => (
                                    <option key={d.id} value={d.id}>{d.nameKr}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>사업분야</label>
                        <input type="text" value={businessField}
                               placeholder={'예: IT/소프트웨어, 제조업, 무역/유통'}
                               onChange={e => setBusinessField(e.target.value)}/>
                    </div>
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={handleSave}>
                        {saving ? '저장 중...' : (isEdit ? '수정' : '등록')}
                    </button>
                </div>
            </div>
        </div>
    );
}
