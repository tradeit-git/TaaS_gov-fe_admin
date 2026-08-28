'use client'

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import GuideSectionsEditor, {GuideCard, buildDefaultGuideSections, defaultFormBtnStyle, defaultGuideTitle} from "@/app/(Auth)/partner-management/component/GuideSectionsEditor";
import CreditScheduleEditor, {CreditSchedule} from "@/app/(Auth)/partner-management/component/CreditScheduleEditor";

interface Props {
    uId?: string;
    onCreated?: () => void;
}

export default function PartnerCreateForm({uId, onCreated}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const [partnerName, setPartnerName] = useState('');
    const [partnerKey, setPartnerKey] = useState('');
    const [creditAmount, setCreditAmount] = useState('0');
    const [maxMembers, setMaxMembers] = useState('');
    const [noMemberLimit, setNoMemberLimit] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dashboardCode, setDashboardCode] = useState('');
    // 제휴 성과 대시보드(CRM) 헤더 문구. 비우면 CRM 기본 문구로 노출된다.
    const [dashboardTitle, setDashboardTitle] = useState('');
    const [dashboardDescription, setDashboardDescription] = useState('');
    const [systemStartDate, setSystemStartDate] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // 크레딧 지급 스케줄
    const [schedules, setSchedules] = useState<CreditSchedule[]>([]);

    // 우측 안내 (동적 카드/로우)
    const [guideTitle, setGuideTitle] = useState('');
    const [guideSections, setGuideSections] = useState<GuideCard[]>(() => buildDefaultGuideSections());
    const [isDuplChecked, setIsDuplChecked] = useState(false);
    const isComposing = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleDuplCheck = async () => {
        if (!partnerKey.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'고유식별자를 입력해주세요.'}/>);
            return;
        }
        const res = await callApi(`/api/admin/partner-keys/check-duplicate?partnerKey=${encodeURIComponent(partnerKey.trim())}`, {
            method: 'GET', credentials: 'include',
        });
        if (res && res.result) {
            if (res.data as unknown as boolean) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'이미 사용 중인 식별자입니다.'}/>);
                setIsDuplChecked(false);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'사용 가능한 식별자입니다.'}/>);
                setIsDuplChecked(true);
            }
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res?.message || '중복체크에 실패했습니다.'}/>);
        }
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

    const handleCreate = async () => {
        if (!partnerName.trim() || !partnerKey.trim() || !creditAmount || !startDate || !endDate || !dashboardCode.trim() || !systemStartDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (!isDuplChecked) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'고유식별자 중복체크를 해주세요.'}/>);
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

        const res = await callApi(`/api/admin/partner-keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerKey: partnerKey.trim(),
                partnerName: partnerName.trim(),
                bonusCredit: Number(creditAmount),
                maxMembers: noMemberLimit ? 0 : Number(maxMembers || 0),
                requiresApproval: true, // 승인심사 임시 고정(폼 토글 추가 전까지)
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
                // 우측 안내(가입 페이지 좌측 노출) - 타이틀 + 동적 카드/로우
                guideTitle: guideTitle.trim(),
                guideSections,
            }),
        });

        if (res && res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            onCreated?.();
            closePopup(uId ?? '');
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '등록에 실패하였습니다.'}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'partner_register_popup'}>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg,image/webp"
                       style={{display: 'none'}} onChange={handleLogoSelect}/>

                <h4 className={'popup_title'}>신규등록</h4>

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

                        {/* 3. 고유식별자 | 대시보드 접속코드 (나란히) */}
                        <div style={{display: 'flex', gap: 28}}>
                            <div className={'popup_field'} style={{flex: 1, minWidth: 0}}>
                                <label className={'label_required'}>고유식별자 <span className={'required'}>(필수)</span></label>
                                <div className={'input_with_btn'}>
                                    <input type="text" value={partnerKey} maxLength={20}
                                           placeholder={'영문, 숫자만 입력'}
                                           onCompositionStart={() => { isComposing.current = true; }}
                                           onCompositionEnd={e => {
                                               isComposing.current = false;
                                               setPartnerKey(e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20));
                                               setIsDuplChecked(false);
                                           }}
                                           onChange={e => {
                                               if (isComposing.current) { setPartnerKey(e.target.value); return; }
                                               setPartnerKey(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20));
                                               setIsDuplChecked(false);
                                           }}/>
                                    <button type="button" className={'btn_check'} onClick={handleDuplCheck} disabled={!partnerKey.trim()}>중복체크</button>
                                </div>
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

                        {/* 6. 시스템 접속시작일 (=운영시작일, 이 날짜 전까지 로그인 차단) */}
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
                    </div>

                    {/* 우측: 미리보기 (편집 가능) */}
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
                    <button type="button" className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type="button" className={'save_btn'} onClick={handleCreate}>저장</button>
                </div>
            </div>
        </div>
    );
}
