'use client'

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

interface Props {
    uId?: string;
    onCreated?: () => void;
}

export default function PartnerCreateForm({uId, onCreated}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const [partnerName, setPartnerName] = useState('');
    const [partnerKey, setPartnerKey] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [noMemberLimit, setNoMemberLimit] = useState(false);
    const [signupCredit, setSignupCredit] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dashboardCode, setDashboardCode] = useState('');
    const [systemStartDate, setSystemStartDate] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // 우측 미리보기 편집 state
    const [pvPeriod, setPvPeriod] = useState('');
    const [pvTarget, setPvTarget] = useState('');
    const [pvScale, setPvScale] = useState('');
    const [pvMethod, setPvMethod] = useState('');
    const [pvResult, setPvResult] = useState('');
    const [pvOnboarding, setPvOnboarding] = useState('');
    const [pvAccessDate, setPvAccessDate] = useState('');
    const [pvFreeCredit, setPvFreeCredit] = useState('');
    const [pvBonusCredit, setPvBonusCredit] = useState('');
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

    const handleCreate = async () => {
        if (!partnerName.trim() || !partnerKey.trim() || !signupCredit || !creditAmount || !startDate || !endDate || !dashboardCode.trim()) {
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

        const res = await callApi(`/api/admin/partner-keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerKey, partnerName,
                bonusCredit: Number(creditAmount),
                maxMembers: noMemberLimit ? 0 : Number(maxMembers || 0),
                signupCredit: Number(signupCredit),
                requiresApproval: false,
                startDate, endDate,
                logoUrl: logoUrl || null,
                dashboardCode: dashboardCode.trim(),
                systemStartDate: systemStartDate || null,
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

                        {/* 고유식별자 */}
                        <div className={'popup_field'}>
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
                                   placeholder={'숫자만 입력'}
                                   onChange={e => setSignupCredit(e.target.value.replace(/[^0-9]/g, ''))}/>
                        </div>

                        {/* 보너스 크레딧(%) */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>보너스 크레딧(%) <span className={'required'}>(필수)</span></label>
                            <input type="text" inputMode="numeric" value={creditAmount}
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

                        {/* 시스템 접속시작일 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>시스템 접속시작일 <span className={'required'}>(필수)</span></label>
                            <input type="text" value={systemStartDate}
                                   placeholder={'영문, 숫자만 입력'}
                                   onChange={e => setSystemStartDate(e.target.value)}/>
                        </div>
                    </div>

                    {/* 우측: 미리보기 (편집 가능) */}
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
                    <button type="button" className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type="button" className={'save_btn'} onClick={handleCreate}>저장</button>
                </div>
            </div>
        </div>
    );
}
