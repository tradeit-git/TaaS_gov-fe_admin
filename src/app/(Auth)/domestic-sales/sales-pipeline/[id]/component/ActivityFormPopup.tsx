'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

interface Props {
    uId?: string;
    pipelineId: number;
    initialData?: {
        id: number;
        content: string;
        activityDate: string;
    };
    onSuccess?: () => void;
}

export default function ActivityFormPopup({uId, pipelineId, initialData, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const [saving, setSaving] = useState(false);

    const [activityDate, setActivityDate] = useState(initialData?.activityDate?.slice(0, 10) ?? '');
    const [content, setContent] = useState(initialData?.content ?? '');

    const handleSave = async () => {
        if (!activityDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'활동일자를 입력해주세요.'}/>);
            return;
        }
        if (!content.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'주요내용을 입력해주세요.'}/>);
            return;
        }

        setSaving(true);
        const payload = {
            activityDate,
            content: content.trim(),
        };

        const url = isEdit
            ? `/api/admin/sales/pipelines/${pipelineId}/activities/${initialData!.id}`
            : `/api/admin/sales/pipelines/${pipelineId}/activities`;

        const res = await callApi(url, {
            method: isEdit ? 'PUT' : 'POST',
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
                <h4>{isEdit ? '영업활동 수정' : '영업활동 등록'}</h4>

                <div className={'popup_body'}>
                    <div className={'popup_field'}>
                        <label className={'label_required'}>활동일자 <span className={'required'}>*</span></label>
                        <input type="date" value={activityDate}
                               onChange={e => setActivityDate(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>주요내용 <span className={'required'}>*</span></label>
                        <textarea value={content}
                                  placeholder={'영업활동 주요내용을 입력해주세요'}
                                  onChange={e => setContent(e.target.value)}/>
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
