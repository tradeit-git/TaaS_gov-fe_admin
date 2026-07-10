'use client'

import React, {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/PartnerPage";

interface Props {
    uId?: string;
    partner: PartnerRow;
    onEdited: () => void;
}

export default function PartnerEditForm({uId, partner, onEdited}: Props) {
    const {addPopup, closePopup} = usePopupStore();

    // 가입자가 한 명이라도 있으면 보너스/가입 크레딧 수정 불가
    const hasMembers = (partner.usedCount ?? 0) > 0;

    const [partnerName, setPartnerName] = useState(partner.partnerName ?? '');
    const [creditAmount, setCreditAmount] = useState(String(partner.creditAmount ?? ''));
    const [maxMembers, setMaxMembers] = useState(String(partner.maxMembers ?? ''));
    const [signupCredit, setSignupCredit] = useState(String(partner.signupCredit ?? ''));
    const [requiresApproval, setRequiresApproval] = useState(partner.requiresApproval ?? false);
    const [startDate, setStartDate] = useState((partner.startDate ?? '').slice(0, 10));
    const [endDate, setEndDate] = useState((partner.endDate ?? '').slice(0, 10));
    const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? '');
    const [logoFileName, setLogoFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const close = () => {
        if (saving) return;
        closePopup(uId ?? '');
    };

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
        const allowedExts = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
        const lowerName = file.name.toLowerCase();
        const extOk = allowedExts.some(ext => lowerName.endsWith(ext));
        if (!allowedMimes.includes(file.type) || !extOk) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'JPG, PNG, SVG 또는 WebP 이미지만 업로드 가능합니다.'}/>);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        const res = await callApi(`/api/admin/partner-keys/upload-logo`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        if (!res.result || !res.data) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '이미지 업로드에 실패했습니다.'}/>);
            return;
        }
        const {logoUrl: uploadedUrl} = res.data as {logoUrl: string};
        setLogoUrl(uploadedUrl);
        setLogoFileName(file.name);
    };

    const handleRemoveLogo = () => {
        setLogoUrl('');
        setLogoFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async () => {
        if (!partnerName.trim() || !creditAmount || !signupCredit || !startDate || !endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (startDate > endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }
        // 모집인원은 가입자수 미만으로 수정 불가 (0=무제한은 허용)
        const max = Number(maxMembers || 0);
        if (max !== 0 && max < (partner.usedCount ?? 0)) {
            addPopup(<AlertComponent alertType={'alert'}
                                    infoContent={`모집인원은 현재 가입자수(${partner.usedCount}명) 미만으로 설정할 수 없습니다.`}/>);
            return;
        }
        if (uploading) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미지 업로드 중입니다. 잠시만 기다려주세요.'}/>);
            return;
        }

        setSaving(true);
        const res = await callApi(`/api/admin/partner-keys/${partner.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerName: partnerName,
                bonusCredit: Number(creditAmount),
                maxMembers: max,
                signupCredit: Number(signupCredit),
                requiresApproval: requiresApproval,
                startDate: startDate,
                endDate: endDate,
                logoUrl: logoUrl || null,
            }),
        });
        setSaving(false);

        if (res && res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            onEdited();
            closePopup(uId ?? '');
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '수정에 실패하였습니다.'}/>);
        }
    };

    return (
        <section className={'popupSection partner_edit_popup'}>
            <div className={'popupContainer'}>
                <div className={'pe_head'}>
                    <h3>제휴 수정</h3>
                    <button type="button" className={'pe_close'} onClick={close} disabled={saving}>✕</button>
                </div>

                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg,image/webp"
                       style={{display: 'none'}} onChange={handleLogoSelect}/>

                <div className={'pe_body'}>
                    {/* 로고 */}
                    <div className={'pe_field'}>
                        <label>로고</label>
                        <div className={'pe_logo'}>
                            {logoUrl ? (
                                <div className={'logo_filled'}>
                                    <img src={logoUrl} alt={'logo'} className={'logo_img'}/>
                                    <button type="button" className={'btn_remove_logo'} onClick={handleRemoveLogo} title={'삭제'}>×</button>
                                </div>
                            ) : (
                                <button type="button" className={'logo_empty'} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? '업로드 중...' : '로고 업로드'}
                                </button>
                            )}
                            {logoUrl && (
                                <button type="button" className={'btn_change_logo'} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? '업로드 중...' : '변경'}
                                </button>
                            )}
                            {logoFileName && <span className={'logo_name'}>{logoFileName}</span>}
                        </div>
                    </div>

                    <div className={'pe_field'}>
                        <label>제휴명</label>
                        <input type="text" value={partnerName} autoComplete="off" maxLength={20}
                               onChange={e => setPartnerName(e.target.value.slice(0, 20))} placeholder={'최대 20자'}/>
                    </div>

                    <div className={'pe_field'}>
                        <label>고유식별자</label>
                        <input type="text" value={partner.partnerKey} readOnly disabled/>
                    </div>

                    <div className={'pe_field'}>
                        <label>가입유효기간</label>
                        <div className={'pe_period'}>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                            <span>-</span>
                            <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)}/>
                        </div>
                    </div>

                    <div className={'pe_field'}>
                        <label>보너스 크레딧</label>
                        <div className={'pe_input_unit'}>
                            <input type="text" inputMode="numeric" autoComplete="off" value={creditAmount}
                                   disabled={hasMembers}
                                   onChange={e => {
                                       const raw = e.target.value.replace(/[^0-9]/g, '');
                                       setCreditAmount(raw ? String(Math.min(Number(raw), 100)) : '');
                                   }}/>
                            <span className={'unit'}>%</span>
                        </div>
                    </div>

                    <div className={'pe_field'}>
                        <label>모집인원</label>
                        <div className={'pe_input_unit'}>
                            <input type="text" inputMode="numeric" autoComplete="off" value={maxMembers}
                                   onChange={e => setMaxMembers(e.target.value.replace(/[^0-9]/g, ''))}
                                   placeholder={'0=무제한'}/>
                            <span className={'unit'}>명</span>
                        </div>
                    </div>

                    <div className={'pe_field'}>
                        <label>가입크레딧</label>
                        <input type="text" inputMode="numeric" autoComplete="off" value={signupCredit}
                               disabled={hasMembers}
                               onChange={e => setSignupCredit(e.target.value.replace(/[^0-9]/g, ''))}
                               placeholder={'가입 시 지급'}/>
                    </div>

                    <div className={'pe_field'}>
                        <label>승인심사</label>
                        <label style={{display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                            <input type="checkbox" checked={requiresApproval}
                                   onChange={e => setRequiresApproval(e.target.checked)}/>
                            <span>가입 승인 필요</span>
                        </label>
                    </div>

                    {hasMembers && (
                        <p className={'pe_notice'}>
                            가입자가 있어 <b>보너스/가입 크레딧</b>은 수정할 수 없으며, <b>모집인원</b>은 현재 가입자수({partner.usedCount}명) 미만으로 설정할 수 없습니다.
                        </p>
                    )}
                </div>

                <div className={'pe_actions'}>
                    <button type="button" className={'pe_cancel'} onClick={close} disabled={saving}>취소</button>
                    <button type="button" className={'pe_save'} onClick={handleSave} disabled={saving || uploading}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </section>
    );
}
