'use client'

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

interface Props {
    onCreated?: () => void;
}

export default function PartnerCreateForm({onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [partnerName, setPartnerName] = useState('');
    const [partnerKey, setPartnerKey] = useState('');
    const [creditAmount, setCreditAmount] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [signupCredit, setSignupCredit] = useState('');
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFileName, setLogoFileName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isDuplChecked, setIsDuplChecked] = useState(false);
    const isComposing = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = () => {
        setPartnerName('');
        setPartnerKey('');
        setCreditAmount('');
        setMaxMembers('');
        setSignupCredit('');
        setRequiresApproval(false);
        setStartDate('');
        setEndDate('');
        setLogoUrl('');
        setLogoFileName('');
        setIsDuplChecked(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 확장자/MIME 체크 (JPG/PNG/SVG/WebP 허용)
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

    const handleSelectFile = () => {
        if (uploading) return;
        fileInputRef.current?.click();
    };

    const handleRemoveLogo = () => {
        setLogoUrl('');
        setLogoFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDuplCheck = async () => {
        if (!partnerKey.trim()) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'경로를 입력해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/partner-keys/check-duplicate?partnerKey=${encodeURIComponent(partnerKey.trim())}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res && res.result) {
            if (res.data as unknown as boolean) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'이미 사용 중인 경로입니다.'}/>);
                setIsDuplChecked(false);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'사용 가능한 경로입니다.'}/>);
                setIsDuplChecked(true);
            }
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res?.message || '중복체크에 실패했습니다.'}/>);
        }
    };

    const handleCreate = async () => {
        if (!partnerName.trim() || !partnerKey.trim() || !creditAmount || !signupCredit || !startDate || !endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (!isDuplChecked) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'경로 중복체크를 해주세요.'}/>);
            return;
        }
        if (startDate > endDate) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
            return;
        }
        if (uploading) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미지 업로드 중입니다. 잠시만 기다려주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/partner-keys`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                partnerKey: partnerKey,
                partnerName: partnerName,
                bonusCredit: Number(creditAmount),
                maxMembers: Number(maxMembers || 0),
                signupCredit: Number(signupCredit),
                requiresApproval: requiresApproval,
                startDate: startDate,
                endDate: endDate,
                logoUrl: logoUrl || null,
            }),
        });

        if(res && res.result) {
            // 목업: 등록 성공
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            handleReset();
            onCreated?.();
        } else {
            //  addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '수정에 실패했습니다.'}/>);
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '등록에 실패하였습니다.'}/>);
        }
    };

    return (
        <div className={'partner_create_form'}>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,.svg,image/webp"
                   style={{display: 'none'}} onChange={handleLogoSelect}/>

            {/* 왼쪽: 로고 */}
            <div className={'logo_box'}>
                {logoUrl ? (
                    <div className={'logo_filled'}>
                        <img src={logoUrl} alt={'logo'} className={'logo_img'}/>
                        <button type="button" className={'btn_remove_logo'}
                                onClick={handleRemoveLogo} title={'삭제'}>×</button>
                        <div className={'logo_overlay'}>
                            <span className={'logo_name'} title={logoFileName}>{logoFileName}</span>
                            <button type="button" className={'btn_change_logo'}
                                    onClick={handleSelectFile} disabled={uploading}>
                                {uploading ? '업로드 중...' : '변경'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" className={'logo_empty'}
                            onClick={handleSelectFile} disabled={uploading}>
                        <span className={'admin_icon'}/>
                        <span className={'logo_empty_text'}>
                            {uploading ? '업로드 중...' : '로고 업로드'}
                        </span>
                    </button>
                )}
            </div>

            {/* 오른쪽: 입력 필드 (한 줄) */}
            <div className={'form_right'}>
                <div className={'form_row'}>
                    <div className={'form_field field_name'}>
                        <label>제휴명</label>
                        <div className={'input_wrap'}>
                            <input type="text" value={partnerName} autoComplete="off" maxLength={20}
                                   onChange={e => setPartnerName(e.target.value.slice(0, 20))} placeholder={'최대 20자'}/>
                        </div>
                    </div>
                    <div className={'form_field field_path'}>
                        <label>고유식별자</label>
                        <div className={'input_wrap'}>
                            <input type="text" value={partnerKey} autoComplete="off" maxLength={20}
                                   onCompositionStart={() => { isComposing.current = true; }}
                                   onCompositionEnd={e => {
                                       isComposing.current = false;
                                       const filtered = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
                                       setPartnerKey(filtered);
                                       setIsDuplChecked(false);
                                   }}
                                   onChange={e => {
                                       if (isComposing.current) {
                                           setPartnerKey(e.target.value);
                                           return;
                                       }
                                       setPartnerKey(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20));
                                       setIsDuplChecked(false);
                                   }}
                                   placeholder={'영문 or 숫자 최대 20자'}/>
                            <button type="button" className={'btn_check'} onClick={handleDuplCheck}
                                    disabled={!partnerKey.trim()}>중복체크
                            </button>
                        </div>
                    </div>
                    <div className={'form_field field_period'}>
                        <label>가입유효기간</label>
                        <div className={'input_wrap'}>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                            <span className={'date_tilde'}>-</span>
                            <input type="date" value={endDate}
                                   min={startDate || undefined}
                                   onChange={e => setEndDate(e.target.value)}/>
                        </div>
                    </div>
                    <div className={'form_field field_credit'}>
                        <label>보너스 크레딧</label>
                        <div className={'input_wrap'}>
                            <input type="text" inputMode="numeric" autoComplete="off"
                                   value={creditAmount}
                                   onChange={e => {
                                       const raw = e.target.value.replace(/[^0-9]/g, '');
                                       const capped = raw ? String(Math.min(Number(raw), 100)) : '';
                                       setCreditAmount(capped);
                                   }}
                                   placeholder={''}/>
                            <span className={'unit'}>%</span>
                        </div>
                    </div>
                    <div className={'form_field field_max_members'}>
                        <label>모집인원</label>
                        <div className={'input_wrap'}>
                            <input type="text" inputMode="numeric" autoComplete="off"
                                   value={maxMembers}
                                   onChange={e => setMaxMembers(e.target.value.replace(/[^0-9]/g, ''))}
                                   placeholder={'0=무제한'}/>
                            <span className={'unit'}>명</span>
                        </div>
                    </div>
                    <div className={'form_field field_signup_credit'}>
                        <label>가입크레딧</label>
                        <div className={'input_wrap'}>
                            <input type="text" inputMode="numeric" autoComplete="off"
                                   value={signupCredit}
                                   onChange={e => setSignupCredit(e.target.value.replace(/[^0-9]/g, ''))}
                                   placeholder={'가입 시 지급'}/>
                        </div>
                    </div>
                    <div className={'form_field field_approval'}>
                        <label>승인심사</label>
                        <div className={'input_wrap'}>
                            <label style={{display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}}>
                                <input type="checkbox" checked={requiresApproval}
                                       onChange={e => setRequiresApproval(e.target.checked)}/>
                                <span>가입 승인 필요</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'} onClick={handleCreate}>등록</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
