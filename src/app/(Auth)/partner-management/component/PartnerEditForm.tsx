'use client'

import React, {useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {PartnerRow} from "@/app/(Auth)/partner-management/component/types";
import GuideSectionsEditor, {GuideCard, buildDefaultGuideSections, defaultFormBtnStyle, defaultGuideTitle, normalizeGuideSections} from "@/app/(Auth)/partner-management/component/GuideSectionsEditor";
import CreditScheduleEditor, {CreditSchedule, normalizeSchedules} from "@/app/(Auth)/partner-management/component/CreditScheduleEditor";

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
    maxMembers: number | null;
    requiresApproval: boolean | null;
    operationStartDate: string | null;
    dashboardAccessCode: string | null;
    dashboardTitle: string | null;
    dashboardDescription: string | null;
    guideTitle: string | null;
    guideSections: unknown;
    creditSchedules: unknown;
    startDate: string;
    endDate: string;
}

export default function PartnerEditForm({uId, partner, onEdited}: Props) {
    const {addPopup, closePopup} = usePopupStore();

    // 가입자가 한 명이라도 있으면 보너스 크레딧 수정 불가 (백엔드 partner.CREDIT_LOCKED)
    const hasMembers = (partner.usedCount ?? 0) > 0;

    // 좌측 입력 (목록 row로 우선 초기화 → 상세조회로 보강)
    const [partnerName, setPartnerName] = useState(partner.partnerName ?? '');
    const [creditAmount, setCreditAmount] = useState(String(partner.creditAmount ?? ''));
    const [maxMembers, setMaxMembers] = useState(partner.maxMembers ? String(partner.maxMembers) : '');
    const [noMemberLimit, setNoMemberLimit] = useState(!partner.maxMembers);
    const [requiresApproval, setRequiresApproval] = useState(partner.requiresApproval ?? false);
    const [startDate, setStartDate] = useState((partner.startDate ?? '').slice(0, 10));
    const [endDate, setEndDate] = useState((partner.endDate ?? '').slice(0, 10));
    const [dashboardCode, setDashboardCode] = useState(partner.dashboardCode ?? '');
    // 제휴 성과 대시보드(CRM) 헤더 문구. 비우면 CRM 기본 문구로 노출된다.
    const [dashboardTitle, setDashboardTitle] = useState('');
    const [dashboardDescription, setDashboardDescription] = useState('');
    const [systemStartDate, setSystemStartDate] = useState('');
    const [logoUrl, setLogoUrl] = useState(partner.logoUrl ?? '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 크레딧 지급 스케줄
    const [schedules, setSchedules] = useState<CreditSchedule[]>([]);

    // 우측 안내 (동적 카드/로우)
    const [guideTitle, setGuideTitle] = useState('');
    const [guideSections, setGuideSections] = useState<GuideCard[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 상세조회로 목록에 없는 값(운영시작일·대시보드코드·안내문구·스케줄) 프리필
    useEffect(() => {
        (async () => {
            const res = await callApi(`/api/admin/partner-keys/${partner.id}`, {
                method: 'GET', credentials: 'include',
            });
            if (!res.result || !res.data) return;
            const d = res.data as PartnerDetail;
            setPartnerName(d.partnerName ?? '');
            setCreditAmount(d.bonusCredit != null ? String(d.bonusCredit) : '');
            setMaxMembers(d.maxMembers ? String(d.maxMembers) : '');
            setNoMemberLimit(!d.maxMembers);
            setRequiresApproval(d.requiresApproval ?? false);
            setStartDate((d.startDate ?? '').slice(0, 10));
            setEndDate((d.endDate ?? '').slice(0, 10));
            setLogoUrl(d.logoUrl ?? '');
            setDashboardCode(d.dashboardAccessCode ?? '');
            setDashboardTitle(d.dashboardTitle ?? '');
            setDashboardDescription(d.dashboardDescription ?? '');
            setSystemStartDate((d.operationStartDate ?? '').slice(0, 10));
            setGuideTitle((d.guideTitle ?? '').trim() || defaultGuideTitle(d.partnerName));
            setGuideSections(normalizeGuideSections(d.guideSections));
            setSchedules(normalizeSchedules(d.creditSchedules));
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

    // 스케줄 행 검증 (각 행 크레딧량·지급일 필수, 만료일은 지급일 이후) — 통과 시 null, 실패 시 메시지
    const validateSchedules = (): string | null => {
        for (const s of schedules) {
            if (s.creditAmount === '' || !s.startDate || !s.expirationDate) {
                return '크레딧 지급 스케줄의 크레딧량, 지급일, 만료일을 모두 입력해주세요.';
            }
            if (s.expirationDate < s.startDate) {
                return '스케줄 만료일은 지급일 이후여야 합니다.';
            }
        }
        return null;
    };

    const handleSave = async () => {
        if (saving) return;
        if (!partnerName.trim() || !creditAmount || !startDate || !endDate || !dashboardCode.trim() || !systemStartDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (startDate > endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }
        if (!guideTitle.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'가입 안내 타이틀을 입력해주세요.'}/>);
            return;
        }
        const scheduleError = validateSchedules();
        if (scheduleError) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={scheduleError}/>);
            return;
        }

        setSaving(true);
        const res = await callApi(`/api/admin/partner-keys/${partner.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerName: partnerName.trim(),
                bonusCredit: Number(creditAmount),
                maxMembers: noMemberLimit ? 0 : Number(maxMembers || 0),
                requiresApproval,
                startDate, endDate,
                logoUrl: logoUrl || null,
                dashboardAccessCode: dashboardCode.trim(),
                dashboardTitle: dashboardTitle.trim() || null,
                dashboardDescription: dashboardDescription.trim() || null,
                operationStartDate: systemStartDate || null,
                creditSchedules: schedules.map(s => ({
                    id: s.id,
                    creditAmount: Number(s.creditAmount),
                    startDate: s.startDate,
                    expirationDate: s.expirationDate || null,
                })),
                guideTitle: guideTitle.trim(),
                guideSections,
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
                        {/* 1. 로고 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>로고 </label>
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

                        {/* 2. 제휴기관 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>제휴기관 <span className={'required'}>(필수)</span></label>
                            <input type="text" value={partnerName} maxLength={20}
                                   onChange={e => setPartnerName(e.target.value.slice(0, 20))}/>
                        </div>

                        {/* 3. 고유식별자(수정 불가) | 대시보드 접속코드 (나란히) */}
                        <div style={{display: 'flex', gap: 28}}>
                            <div className={'popup_field'} style={{flex: 1, minWidth: 0}}>
                                <label className={'label_required'}>고유식별자 <span className={'required'}>(필수)</span></label>
                                <input type="text" value={partner.partnerKey} readOnly disabled/>
                            </div>
                            <div className={'popup_field'} style={{flex: 1, minWidth: 0}}>
                                <label className={'label_required'}>대시보드 접속코드 <span className={'required'}>(필수)</span></label>
                                <input type="text" value={dashboardCode}
                                       placeholder={'영문, 숫자만 입력'}
                                       onChange={e => setDashboardCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}/>
                            </div>
                        </div>

                        {/* 3-1. 제휴 성과 대시보드 헤더 문구 (미입력 시 CRM 기본 문구로 노출) */}
                        <div className={'popup_field'}>
                            <label>대시보드 타이틀</label>
                            <input type="text" value={dashboardTitle} maxLength={200}
                                   placeholder={`${partnerName.trim() || 'OO'} 제휴 성과 대시보드`}
                                   onChange={e => setDashboardTitle(e.target.value)}/>
                        </div>
                        <div className={'popup_field'}>
                            <label>대시보드 설명</label>
                            <input type="text" value={dashboardDescription} maxLength={500}
                                   placeholder={'가입 기업 현황과 바이어 등록 추이를 실시간으로 집계합니다.'}
                                   onChange={e => setDashboardDescription(e.target.value)}/>
                        </div>

                        {/* 4. 모집기간 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>모집기간 <span className={'required'}>(필수)</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                                <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)}/>
                            </div>
                        </div>

                        {/* 5. 모집인원 */}
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

                        {/* 6. 시스템 접속시작일 (=운영시작일) */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>시스템 접속시작일 <span className={'required'}>(필수)</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={systemStartDate}
                                       onChange={e => setSystemStartDate(e.target.value)}/>
                            </div>
                        </div>

                        {/* 7. 보너스 크레딧(%) */}
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

                        {/* 8. 크레딧 지급 스케줄 */}
                        <div className={'popup_field'}>
                            <label>크레딧 지급 스케줄</label>
                            <CreditScheduleEditor schedules={schedules} onChange={setSchedules}/>
                        </div>

                        {/* 승인심사: 체크박스 숨김. 저장 시 기존 설정값(requiresApproval) 그대로 전송 */}

                        {hasMembers && (
                            <p className={'edit_notice'}>가입자가 있어 <b>보너스 크레딧</b>은 수정할 수 없습니다.</p>
                        )}
                    </div>

                    {/* 우측: 안내 문구 (편집 가능) */}
                    <div className={'popup_preview_right'}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8}}>
                            <p className={'preview_title'} style={{margin: 0}}>가입 페이지 좌측에 노출되는 안내입니다. (미노출 항목은 숨김)</p>
                            <button type="button" style={defaultFormBtnStyle}
                                    onClick={() => {
                                        setGuideTitle(defaultGuideTitle(partnerName));
                                        setGuideSections(buildDefaultGuideSections({
                                            partnerName, startDate, endDate, maxMembers, bonusPercent: creditAmount, systemStartDate,
                                            totalScheduleCredit: schedules.reduce((sum, s) => sum + (Number(s.creditAmount) || 0), 0),
                                        }));
                                    }}>
                                기본폼 생성
                            </button>
                        </div>
                        <div style={{display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12}}>
                            <span style={{width: 120, height: 32, display: 'inline-flex', alignItems: 'center', padding: '0 8px', border: '1px solid #d0d5dd', borderRadius: 8, background: '#f9fafb', color: '#475467', fontWeight: 600, flexShrink: 0, boxSizing: 'border-box', whiteSpace: 'nowrap'}}>
                                타이틀<span style={{color: '#d92d20', marginLeft: 2}}>*</span>
                            </span>
                            <input style={{flex: 1, minWidth: 0, height: 32, padding: '0 8px', border: '1px solid #d0d5dd', borderRadius: 8, boxSizing: 'border-box'}}
                                   placeholder="예: OO 회원사만을 위한 특별 가입 혜택"
                                   value={guideTitle} onChange={e => setGuideTitle(e.target.value)}/>
                        </div>
                        <GuideSectionsEditor sections={guideSections} onChange={setGuideSections}/>
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
