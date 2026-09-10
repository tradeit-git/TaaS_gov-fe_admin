'use client';

import {useMemo, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import callApi from "@/utill/apiRequest";
import {MasterCompanyRow} from "@/app/(Auth)/domestic-sales/company-info/types";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";
import TagPicker from "@/app/(Auth)/domestic-sales/component/TagPicker";

interface Props {
    uId?: string;
    /** 이미 쓰이고 있는 태그. 새로 만들기 전에 먼저 보여준다 */
    allTags: TagRow[];
    /** 넘기면 수정 모드. 목록에 뜬 행을 그대로 받는다 */
    row?: MasterCompanyRow;
    /** 저장된 기업명. 등록이면 목록에서 바로 찾아 보여주려고 쓴다 */
    onSuccess?: (name: string) => void;
}

/**
 * 기준 DB 의 기업을 만들거나 고친다.
 * <p>
 * 필수는 기업명 하나다. 사업자번호는 서버가 숫자 10자리만 확인하고,
 * 모르면 비워둔 채로 둘 수 있다 (SalesCustomerService.validateRequest).
 */
export default function CompanyFormPopup({uId, allTags, row, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const {appConfig} = useAppConfigStore();
    const divisions = appConfig.administrativeDivisions;
    const [saving, setSaving] = useState(false);

    const isEdit = !!row;
    const sidoList = useMemo(() => divisions.filter(d => d.level === 1), [divisions]);

    /**
     * 목록은 지역을 이름으로만 내려준다. select 는 id 로 도니까 역산해야 한다.
     * 못 찾으면 0(미선택)으로 두고 담당자가 다시 고르게 한다 — 엉뚱한 지역을 찍는 것보다 낫다.
     */
    const initialRegion = useMemo(() => {
        if (!row?.sidoName) return {sido: 0, sigungu: 0};
        const sido = sidoList.find(d => d.nameKr === row.sidoName);
        if (!sido) return {sido: 0, sigungu: 0};
        if (!row.sigunguName) return {sido: sido.id, sigungu: 0};
        const sigungu = divisions.find(d => d.upId === sido.id && d.nameKr === row.sigunguName);
        return {sido: sido.id, sigungu: sigungu?.id ?? 0};
    }, [row, sidoList, divisions]);

    const [companyName, setCompanyName] = useState(row?.name ?? '');
    const [businessNumber, setBusinessNumber] = useState(row?.bizNo ?? '');
    const [ceoName, setCeoName] = useState(row?.ceoName ?? '');
    const [sidoId, setSidoId] = useState(initialRegion.sido);
    const [sigunguId, setSigunguId] = useState(initialRegion.sigungu);
    const [businessField, setBusinessField] = useState(row?.bizField ?? '');
    const [tags, setTags] = useState<string[]>(row?.tags.map(t => t.name) ?? []);
    const sigunguList = useMemo(() => sidoId ? divisions.filter(d => d.upId === sidoId) : [], [sidoId, divisions]);
    const selectedSido = useMemo(() => sidoList.find(d => d.id === sidoId), [sidoId, sidoList]);

    const handleSave = async () => {
        const name = companyName.trim();
        if (!name) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'기업명을 입력해주세요.'}/>);
            return;
        }

        setSaving(true);
        const res = await callApi(
            isEdit ? `/api/admin/sales/customers/${row!.customerId}` : '/api/admin/sales/customers', {
            method: isEdit ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                name,
                bizNo: businessNumber.trim() || null,
                ceoName: ceoName.trim() || null,
                sidoId: sidoId || null,
                sigunguId: sigunguId || null,
                bizField: businessField.trim() || null,
                tags,
            }),
        });
        setSaving(false);

        if (res.result) {
            closePopup(uId ?? '');
            onSuccess?.(name);
        } else {
            addPopup(<AlertComponent alertType={'alert'}
                                     infoContent={res.message || (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? '기업정보 수정' : '고객사 신규등록'}</h4>

                <div className={'popup_body'}>
                    <div className={'ds_link_notice'}>
                        {isEdit
                            ? <>국내 기업정보 기준 DB 를 고칩니다. 이 기업을 보고 있는 다른 화면에도 같이 반영됩니다.</>
                            : <>기준 DB 에 없는 기업을 직접 만듭니다. 등록하면 목록에서 바로 관리기업으로 담을 수 있습니다.</>}
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>기업명 <span className={'required'}>*</span></label>
                        <input type="text" value={companyName} autoFocus
                               placeholder={'기업명을 입력해주세요'}
                               onChange={e => setCompanyName(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>사업자번호</label>
                        <input type="text" value={businessNumber}
                               placeholder={'000-00-00000 (모르면 비워두세요)'}
                               onChange={e => setBusinessNumber(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>대표자</label>
                        <input type="text" value={ceoName}
                               placeholder={'대표자명을 입력해주세요'}
                               onChange={e => setCeoName(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>소재지역</label>
                        <div className={'region_select_wrap'}>
                            <select value={sidoId} onChange={e => {
                                setSidoId(Number(e.target.value));
                                setSigunguId(0);
                            }}>
                                <option value={0}>시/도 선택</option>
                                {sidoList.map(d => <option key={d.id} value={d.id}>{d.nameKr}</option>)}
                            </select>
                            <select value={sigunguId}
                                    disabled={!sidoId || !!selectedSido?.isLeaf || sigunguList.length === 0}
                                    onChange={e => setSigunguId(Number(e.target.value))}>
                                <option value={0}>시/군/구 선택</option>
                                {sigunguList.map(d => <option key={d.id} value={d.id}>{d.nameKr}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>사업분야</label>
                        <input type="text" value={businessField}
                               placeholder={'예: IT/소프트웨어, 제조업, 무역/유통'}
                               onChange={e => setBusinessField(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>태그</label>
                        <TagPicker value={tags} onChange={setTags} allTags={allTags}/>
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
