'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {API_BASE} from "@/app/(Auth)/domestic-sales/companies/types";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";
import TagPicker from "@/app/(Auth)/domestic-sales/component/TagPicker";

interface Props {
    uId?: string;
    /** 태그가 붙는 대상은 기준 DB 기업이다. 관리 대상(targetId) 이 아니다 */
    customerId: number;
    companyName: string;
    current: TagRow[];
    allTags: TagRow[];
    onSaved?: () => void;
}

/** 기업 하나의 태그 편집. 저장은 통째로 교체다 — 뺀 것은 빠지고 새 이름은 만들어진다 */
export default function TagEditPopup({uId, customerId, companyName, current, allTags, onSaved}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const [tags, setTags] = useState<string[]>(current.map(t => t.name));
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        const res = await callApi(`${API_BASE}/master-companies/${customerId}/tags`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({tags}),
        });
        setSaving(false);

        if (res.result) {
            closePopup(uId ?? '');
            onSaved?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '저장에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup ds_link_popup'}>
                <h4>태그 편집</h4>

                <div className={'popup_body'}>
                    <div className={'ds_link_notice'}>
                        <b>{companyName}</b> 에 붙일 태그입니다. 목록에서 이 태그로 기업을 찾을 수 있습니다.
                    </div>

                    <TagPicker value={tags} onChange={setTags} allTags={allTags} autoFocus/>
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={save}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
