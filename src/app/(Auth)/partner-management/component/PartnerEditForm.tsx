'use client'

import React, {useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/PartnerPage";

interface Props {
    uId?: string;
    partner: PartnerRow;
    onEdited: () => void;
}

// GET /api/admin/partner-keys/{id} 응답(엔티티 전체) 중 사용하는 필드
interface PartnerDetail {
    partnerName: string;
    logoUrl: string | null;
    bonusCredit: number | null;
    signupCredit: number | null;
    maxMembers: number | null;
    requiresApproval: boolean | null;
    operationStartDate: string | null;
    dashboardAccessCode: string | null;
    guideApplyPeriod: string | null;
    guideApplyTarget: string | null;
    guideApplyScale: string | null;
    guideSelectionMethod: string | null;
    guideSelectionResult: string | null;
    guideOnboarding: string | null;
    guideAccessDate: string | null;
    guideFreeCredit: string | null;
    guideBonusCredit: string | null;
    startDate: string;
    endDate: string;
}

export default function PartnerEditForm({uId, partner, onEdited}: Props) {
    const {addPopup, closePopup} = usePopupStore();

    // 가입자가 한 명이라도 있으면 보너스/무료 크레딧 수정 불가 (백엔드 partner.CREDIT_LOCKED)
    const hasMembers = (partner.usedCount ?? 0) > 0;

    // 좌측 입력 (목록 row로 우선 초기화 → 상세조회로 보강)
    const [partnerName, setPartnerName] = useState(partner.partnerName ?? '');
    const [creditAmount, setCreditAmount] = useState(String(partner.creditAmount ?? ''));
    const [maxMembers, setMaxMembers] = useState(partner.maxMembers ? String(partner.maxMembers) : '');
    const [noMemberLimit, setNoMemberLimit] = useState(!partner.maxMembers);
    const [signupCredit, setSignupCredit] = useState(String(partner.signupCredit ?? ''));
    const [requiresApproval, setRequiresApproval] = useState(partner.requiresApproval ?? false);
    const [startDate, setStartDate] = useState((partner.startDate ?? '').slice(0, 10));
    const [endDate, setEndDate] = useState((partner.endDate ?? '').slice(0, 10));
    const [dashboardCode, setDashboardCode] = useState(partner.dashboardCode ?? '');
    const [systemStartDate, setSystemStartDate] = useState('');
    const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 우측 안내 문구
    const [pvPeriod, setPvPeriod] = useState('');
    const [pvTarget, setPvTarget] = useState('');
    const [pvScale, setPvScale] = useState('');
    const [pvMethod, setPvMethod] = useState('');
    const [pvResult, setPvResult] = useState('');
    const [pvOnboarding, setPvOnboarding] = useState('');
    const [pvAccessDate, setPvAccessDate] = useState('');
    const [pvFreeCredit, setPvFreeCredit] = useState('');
    const [pvBonusCredit, setPvBonusCredit] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 상세조회로 목록에 없는 값(운영시작일·대시보드코드·안내문구) 프리필
    useEffect(() => {
        (async () => {
            const res = await callApi(`/api/admin/partner-keys/${partner.id}`, {
                method: 'GET', credentials: 'include',
            });
            if (!res.result || !res.data) return;
            const d = res.data as PartnerDetail;
            setPartnerName(d.partnerName ?? '');
            setCreditAmount(d.bonusCredit != null ? String(d.bonusCredit) : '');
            setSignupCredit(d.signupCredit != null ? String(d.signupCredit) : '');
            setMaxMembers(d.maxMembers ? String(d.maxMembers) : '');
            setNoMemberLimit(!d.maxMembers);
            setRequiresApproval(d.requiresApproval ?? false);
            setStartDate((d.startDate ?? '').slice(0, 10));
            setEndDate((d.endDate ?? '').slice(0, 10));
            setLogoUrl(d.logoUrl ?? '');
            setDashboardCode(d.dashboardAccessCode ?? '');
            setSystemStartDate((d.operationStartDate ?? '').slice(0, 10));
            setPvPeriod(d.guideApplyPeriod ?? '');
            setPvTarget(d.guideApplyTarget ?? '');
            setPvScale(d.guideApplyScale ?? '');
            setPvMethod(d.guideSelectionMethod ?? '');
            setPvResult(d.guideSelectionResult ?? '');
            setPvOnboarding(d.guideOnboarding ?? '');
            setPvAccessDate(d.guideAccessDate ?? '');
            setPvFreeCredit(d.guideFreeCredit ?? '');
            setPvBonusCredit(d.guideBonusCredit ?? '');
        })();
    }, [partner.id]);

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
            method: 'POST', credentials: 'include', body: formData,
        });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!res.result || !res.data) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '이미지 업로드에 실패했습니다.'}/>);
            return;
        }
        const {logoUrl: uploadedUrl} = res.data as { logoUrl: string };
        setLogoUrl(uploadedUrl);
    };

    const handleSave = async () => {
        if (saving) return;
        if (!partnerName.trim() || !signupCredit || !creditAmount || !startDate || !endDate || !dashboardCode.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (startDate > endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }

        setSaving(true);
        const res = await callApi(`/api/admin/partner-keys/${partner.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerName,
                bonusCredit: Number(creditAmount),
                maxMembers: noMemberLimit ? 0 : Number(maxMembers || 0),
                signupCredit: Number(signupCredit),
                requiresApproval,
                startDate, endDate,
                logoUrl: logoUrl || null,
                dashboardAccessCode: dashboardCode.trim(),
                operationStartDate: systemStartDate || null,
                guideApplyPeriod: pvPeriod || null,
                guideApplyTarget: pvTarget || null,
                guideApplyScale: pvScale || null,
                guideSelectionMethod: pvMethod || null,
                guideSelectionResult: pvResult || null,
                guideOnboarding: pvOnboarding || null,
                guideAccessDate: pvAccessDate || null,
                guideFreeCredit: pvFreeCredit || null,
                guideBonusCredit: pvBonusCredit || null,
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
        <div className={'alertSection'}>
            <div className={'partner_register_popup'}>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg,image/webp"
                       style={{display: 'none'}} onChange={handleLogoSelect}/>

                <h4 className={'popup_title'}>수정</h4>

                <div className={'popup_body_row'}>
                    {/* 좌측: 입력폼 */}
                    <div className={'popup_form_left'}>
                        {/* 로고 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>로고 <span className={'required'}>(필수)</span></label>
                            {logoUrl ? (
                                <div className={'logo_preview_wrap'}>
                                    <img src={logoUrl} alt="logo" className={'logo_preview_img'}/>
                                    <button type="button" className={'btn_change_logo'} onClick={() => fileInputRef.current?.click()}>변경</button>
                                </div>
                            ) : (
                                <button type="button" className={'btn_upload_logo'} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? '업로드 중...' : '이미지 업로드'}
                                </button>
                            )}
                        </div>

                        {/* 제휴기관 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>제휴기관 <span className={'required'}>(필수)</span></label>
                            <input type="text" value={partnerName} maxLength={20}
                                   onChange={e => setPartnerName(e.target.value.slice(0, 20))}/>
                        </div>

                        {/* 고유식별자 (수정 불가) */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>고유식별자 <span className={'required'}>(필수)</span></label>
                            <input type="text" value={partner.partnerKey} readOnly disabled/>
                        </div>

                        {/* 모집기간 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>모집기간 <span className={'required'}>(필수)</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                                <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)}/>
                            </div>
                        </div>

                        {/* 모집인원 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>모집인원 <span className={'required'}>(필수)</span></label>
                            <div className={'input_with_check'}>
                                <input type="text" inputMode="numeric" value={noMemberLimit ? '' : maxMembers}
                                       disabled={noMemberLimit}
                                       placeholder={'숫자만 입력'}
                                       onChange={e => setMaxMembers(e.target.value.replace(/[^0-9]/g, ''))}/>
                                <label className={'checkbox_label'}>
                                    <input type="checkbox" checked={noMemberLimit}
                                           onChange={e => { setNoMemberLimit(e.target.checked); if (e.target.checked) setMaxMembers(''); }}/>
                                    인원제한없음
                                </label>
                            </div>
                        </div>

                        {/* 무료 크레딧 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>무료 크레딧 <span className={'required'}>(필수)</span></label>
                            <input type="text" inputMode="numeric" value={signupCredit}
                                   disabled={hasMembers}
                                   placeholder={'숫자만 입력'}
                                   onChange={e => setSignupCredit(e.target.value.replace(/[^0-9]/g, ''))}/>
                        </div>

                        {/* 보너스 크레딧(%) */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>보너스 크레딧(%) <span className={'required'}>(필수)</span></label>
                            <input type="text" inputMode="numeric" value={creditAmount}
                                   disabled={hasMembers}
                                   placeholder={'숫자만 입력'}
                                   onChange={e => {
                                       const raw = e.target.value.replace(/[^0-9]/g, '');
                                       setCreditAmount(raw ? String(Math.min(Number(raw), 100)) : '');
                                   }}/>
                        </div>

                        {/* 대시보드 접속코드 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>대시보드 접속코드 <span className={'required'}>(필수)</span></label>
                            <input type="text" value={dashboardCode}
                                   placeholder={'영문, 숫자만 입력'}
                                   onChange={e => setDashboardCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}/>
                        </div>

                        {/* 시스템 접속시작일 (=운영시작일) */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>시스템 접속시작일 <span className={'required'}>(필수)</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={systemStartDate}
                                       onChange={e => setSystemStartDate(e.target.value)}/>
                            </div>
                        </div>

                        {/* 승인심사: 체크박스 숨김. 저장 시 기존 설정값(requiresApproval) 그대로 전송 */}

                        {hasMembers && (
                            <p className={'edit_notice'}>가입자가 있어 <b>무료/보너스 크레딧</b>은 수정할 수 없습니다.</p>
                        )}
                    </div>

                    {/* 우측: 안내 문구 (편집 가능) */}
                    <div className={'popup_preview_right'}>
                        <p className={'preview_title'}>가입 페이지에 노출되는 내용입니다.</p>

                        <div className={'preview_section'}>
                            <h5>신청안내</h5>
                            <div className={'preview_table'}>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>신청기간</span>
                                    <input type="text" className={'preview_input'} value={pvPeriod} onChange={e => setPvPeriod(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>신청대상</span>
                                    <input type="text" className={'preview_input'} value={pvTarget} onChange={e => setPvTarget(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>신청규모</span>
                                    <input type="text" className={'preview_input'} value={pvScale} onChange={e => setPvScale(e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        <div className={'preview_section'}>
                            <h5>운영안내</h5>
                            <div className={'preview_table'}>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>선정방법</span>
                                    <input type="text" className={'preview_input'} value={pvMethod} onChange={e => setPvMethod(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>선정결과</span>
                                    <input type="text" className={'preview_input'} value={pvResult} onChange={e => setPvResult(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>온보딩 교육</span>
                                    <input type="text" className={'preview_input'} value={pvOnboarding} onChange={e => setPvOnboarding(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>시스템 접속가능일</span>
                                    <input type="text" className={'preview_input'} value={pvAccessDate} onChange={e => setPvAccessDate(e.target.value)}/>
                                </div>
                            </div>
                        </div>

                        <div className={'preview_section'}>
                            <h5>제공혜택</h5>
                            <div className={'preview_table'}>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>무료 크레딧</span>
                                    <input type="text" className={'preview_input'} value={pvFreeCredit} onChange={e => setPvFreeCredit(e.target.value)}/>
                                </div>
                                <div className={'preview_row'}>
                                    <span className={'preview_label'}>보너스 크레딧</span>
                                    <input type="text" className={'preview_input'} value={pvBonusCredit} onChange={e => setPvBonusCredit(e.target.value)}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type="button" className={'cancel_btn'} onClick={close} disabled={saving}>취소</button>
                    <button type="button" className={'save_btn'} onClick={handleSave} disabled={saving || uploading}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
