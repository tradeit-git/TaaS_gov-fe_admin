'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {ActivityRow, API_BASE, RoundRow} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    uId?: string;
    /** 등록일 때 필요. 수정은 활동 id 로만 간다 */
    round?: RoundRow;
    initialData?: ActivityRow;
    onSuccess?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * 영업활동 등록 · 수정.
 * <p>
 * 폼을 잘게 쪼개지 않는다. 현장에서 미팅 한 건을 상세히 쓰고 있고 그게 굴러가는 방식이라,
 * 항목을 나누면 안 쓰게 된다. 구조화는 활동일 하나뿐이고 대상 회차는 표시만 한다 (기획서 5.2).
 */
export default function ActivityFormPopup({uId, round, initialData, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const [saving, setSaving] = useState(false);

    const [activityDate, setActivityDate] = useState(initialData?.activityDate?.slice(0, 10) ?? today());
    const [content, setContent] = useState(initialData?.content ?? '');
    const [bookMark, setBookMark] = useState(initialData?.bookMark ?? false);

    const roundNo = initialData?.roundNo ?? round?.roundNo;

    const handleSave = async () => {
        if (!activityDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'활동일을 입력해주세요.'}/>);
            return;
        }
        if (activityDate > today()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'활동일은 오늘 이후일 수 없습니다.'}/>);
            return;
        }
        if (!content.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'활동 내용을 입력해주세요.'}/>);
            return;
        }

        setSaving(true);
        const url = isEdit
            ? `${API_BASE}/activities/${initialData!.id}`
            : `${API_BASE}/rounds/${round!.id}/activities`;

        const res = await callApi(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({activityDate, content: content.trim(), bookMark}),
        });
        setSaving(false);

        if (res.result) {
            closePopup(uId ?? '');
            onSuccess?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'}
                                     infoContent={res.message || (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? '영업활동 수정' : '영업활동 등록'}</h4>

                <div className={'popup_body'}>
                    {roundNo && (
                        <div className={'popup_field'}>
                            <label>대상 회차</label>
                            <p style={{padding: '6px 0', color: '#4a4a4a'}}>{roundNo}차</p>
                        </div>
                    )}

                    <div className={'popup_field'}>
                        <label className={'label_required'}>활동일 <span className={'required'}>*</span></label>
                        <input type="date" value={activityDate} max={today()}
                               onChange={e => setActivityDate(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>활동 내용 <span className={'required'}>*</span></label>
                        <textarea value={content} rows={12}
                                  placeholder={'미팅 내용을 자유롭게 적어주세요.\n다음 약속도 여기에 그대로 쓰시면 됩니다.'}
                                  onChange={e => setContent(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                            <input type="checkbox" checked={bookMark}
                                   onChange={e => setBookMark(e.target.checked)}/>
                            중요 활동으로 표시
                        </label>
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
