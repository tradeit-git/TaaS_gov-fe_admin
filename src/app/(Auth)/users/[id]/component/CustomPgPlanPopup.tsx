'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import callApi from "@/utill/apiRequest";

export interface CustomPgPlan {
    userId: number;
    planName: string;
    price: number;
    monthlyCredits: number;
    validUntil: string;
    createdAt: string;
    createdBy: string | null;
    updatedAt: string;
    updatedBy: string | null;
}

/** GET /custom-pg-plan 응답 — 발급 조건 + 회원의 결제 가능 여부 */
export interface CustomPgPlanStatus {
    plan: CustomPgPlan | null;
    payable: boolean;
    blockReason: string | null;
}

interface Props {
    uId?: string;
    userId: number | string;
    initialData?: CustomPgPlan | null;
    /** 회원이 지금 결제할 수 없는 사유 (결제 가능하면 null) */
    blockReason?: string | null;
    onChange?: () => void;
}

const MAX_PRICE = 100000000;
const MAX_CREDITS = 10000000;
const DEFAULT_VALID_DAYS = 30;

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayISO = () => toISODate(new Date());

const defaultValidUntilISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + DEFAULT_VALID_DAYS);
    return toISODate(d);
};

const formatComma = (value: string, max: number) => {
    const num = Math.min(Number(value.replace(/[^0-9]/g, '')) || 0, max);
    if (num === 0) return '';
    return num.toLocaleString();
};

const parseAmount = (value: string) => Number(value.replace(/,/g, '')) || 0;

// 유효기간까지 남은 일수 (당일이면 0)
const daysLeft = (validUntil: string) => {
    const end = new Date(`${validUntil}T00:00:00`);
    const today = new Date(`${todayISO()}T00:00:00`);
    return Math.round((end.getTime() - today.getTime()) / 86400000);
};

const dDayLabel = (validUntil: string) => {
    const left = daysLeft(validUntil);
    if (left <= 0) return '오늘 만료';
    return `D-${left}`;
};

export default function CustomPgPlanPopup({uId, userId, initialData, blockReason, onChange}: Props) {
    const {closePopup, addPopup} = usePopupStore();

    // 발급된 조건이 있으면 잠긴 상태로 먼저 보여준다 (금액 오조작 방지 + 등록 여부 식별)
    const [mode, setMode] = useState<'view' | 'edit'>(initialData ? 'view' : 'edit');
    const [planName, setPlanName] = useState(initialData?.planName ?? '');
    const [price, setPrice] = useState(initialData ? initialData.price.toLocaleString() : '');
    const [credits, setCredits] = useState(initialData ? initialData.monthlyCredits.toLocaleString() : '');
    const [validUntil, setValidUntil] = useState(initialData?.validUntil ?? defaultValidUntilISO());

    const isView = mode === 'view';

    const resetToInitial = () => {
        setPlanName(initialData?.planName ?? '');
        setPrice(initialData ? initialData.price.toLocaleString() : '');
        setCredits(initialData ? initialData.monthlyCredits.toLocaleString() : '');
        setValidUntil(initialData?.validUntil ?? defaultValidUntilISO());
    };

    const handleCancel = () => {
        // 발급 건을 수정하다 취소하면 팝업을 닫지 않고 조회 상태로 되돌린다
        if (initialData) {
            resetToInitial();
            setMode('view');
            return;
        }
        closePopup(uId ?? '');
    };

    const submit = async () => {
        const res = await callApi(`/api/admin/members/users/${userId}/custom-pg-plan`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                planName: planName.trim(),
                price: parseAmount(price),
                monthlyCredits: parseAmount(credits),
                validUntil,
            }),
        });

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={initialData ? '수정되었습니다.' : '저장되었습니다.'}/>);
            onChange?.();
            closePopup(uId ?? '');
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '저장에 실패했습니다.'}/>);
        }
    };

    const handleSave = async () => {
        if (!planName.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'플랜명을 입력해주세요.'}/>);
            return;
        }
        if (!price) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'구독료를 입력해주세요.'}/>);
            return;
        }
        if (!credits) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'크레딧을 입력해주세요.'}/>);
            return;
        }
        if (!validUntil) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'유효기간을 입력해주세요.'}/>);
            return;
        }
        if (validUntil < todayISO()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'유효기간은 오늘 이후로 설정해주세요.'}/>);
            return;
        }

        // 회원이 지금 결제할 수 없는 상태여도 발급 자체는 막지 않는다.
        // 구독 종료나 예약 정리를 앞두고 미리 발급해두는 경우가 있어서다.
        if (blockReason) {
            addPopup(<AlertComponent
                alertType={'confirm'}
                infoContent={`${blockReason}\n\n지금 저장해도 회원은 결제할 수 없습니다. 계속하시겠습니까?`}
                callback={() => void submit()}
            />);
            return;
        }
        await submit();
    };

    const handleDelete = () => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'설정한 커스텀 플랜을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${userId}/custom-pg-plan`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                onChange?.();
                closePopup(uId ?? '');
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'alertSection'}>
            <div className={`overseas_plan_popup custom_pg_plan_popup${isView ? ' is_view' : ''}`}>
                <h4>PG구독 맞춤설정</h4>

                {blockReason && (
                    <div className={'custom_pg_block'}>
                        <strong>지금은 회원이 결제할 수 없습니다</strong>
                        <p>{blockReason}</p>
                    </div>
                )}

                {initialData ? (
                    <div className={'custom_pg_status'}>
                        <div className={'status_head'}>
                            <span className={'status_badge'}>발급됨</span>
                            <span className={`status_dday${daysLeft(initialData.validUntil) <= 3 ? ' urgent' : ''}`}>
                                {dDayLabel(initialData.validUntil)}
                            </span>
                        </div>
                        <p className={'status_desc'}>
                            {formatDateDot(initialData.createdAt)} 발급
                            {initialData.createdBy && ` (${initialData.createdBy})`}
                            {initialData.updatedAt !== initialData.createdAt && (
                                <> · {formatDateDot(initialData.updatedAt)} 수정
                                    {initialData.updatedBy && ` (${initialData.updatedBy})`}</>
                            )}
                        </p>
                    </div>
                ) : (
                    <p className={'custom_pg_empty'}>발급된 커스텀 조건이 없습니다. 아래 항목을 입력해 발급해주세요.</p>
                )}

                <div className={'popup_field'}>
                    <label className={'label_required'}>플랜명 <span className={'required'}>(필수)</span></label>
                    {isView ? (
                        <input type="text" value={planName} readOnly/>
                    ) : (
                        <input type="text" value={planName} maxLength={50}
                               onChange={e => setPlanName(e.target.value)}/>
                    )}
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>구독료(VAT 포함) <span className={'required'}>(필수)</span></label>
                    {isView ? (
                        <input type="text" value={`${price}원`} readOnly/>
                    ) : (
                        <input type="text" value={price} placeholder={'숫자만 입력'}
                               onChange={e => setPrice(formatComma(e.target.value, MAX_PRICE))}/>
                    )}
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>크레딧 <span className={'required'}>(필수)</span></label>
                    {isView ? (
                        <input type="text" value={credits} readOnly/>
                    ) : (
                        <input type="text" value={credits} placeholder={'숫자만 입력'}
                               onChange={e => setCredits(formatComma(e.target.value, MAX_CREDITS))}/>
                    )}
                </div>

                <div className={'popup_field'}>
                    <label className={'label_required'}>유효기간 <span className={'required'}>(필수)</span></label>
                    {isView ? (
                        <input type="text" value={formatDateDot(validUntil)} readOnly/>
                    ) : (
                        <input type="date" value={validUntil} min={todayISO()}
                               onChange={e => setValidUntil(e.target.value)}/>
                    )}
                    <p className={'field_desc'}>이 날짜까지 회원이 위 조건으로 결제할 수 있습니다.</p>
                </div>

                <div className={'popup_btn_wrap'}>
                    {isView ? (
                        <>
                            <button type={'button'} className={'delete_btn'} onClick={handleDelete}>삭제</button>
                            <button type={'button'} className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>닫기</button>
                            <button type={'button'} className={'save_btn'} onClick={() => setMode('edit')}>수정</button>
                        </>
                    ) : (
                        <>
                            <button type={'button'} className={'cancel_btn'} onClick={handleCancel}>취소</button>
                            <button type={'button'} className={'save_btn'} onClick={handleSave}>저장</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
