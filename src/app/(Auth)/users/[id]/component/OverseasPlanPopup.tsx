'use client';

import {useMemo, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export type RoundStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED';

export interface CreditRound {
    round: number;
    period: string;
    credit: string;
    periodStartDate?: string;
    periodEndDate?: string;
    status?: RoundStatus;
}

interface Props {
    uId?: string;
    userId?: string;
    initialData?: Partial<OverseasPlanFormData>;
    onSave?: (data: OverseasPlanFormData) => void;
    onCreditChange?: () => void;
}

export type PlanType = 'OVERSEAS' | 'GENERAL';

export interface OverseasPlanFormData {
    planType: PlanType;
    planName: string;
    planStartDate: string;
    planEndDate: string;
    planMonths: number;
    contractAmount: string;
    contractMethod: string;
    managerGA: string;
    managerTP: string;
    contractDate: string;
    monthlyCredit: string;
    totalCredit: number;
    credits: CreditRound[];
}

const formatD = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// JS Date 의 setMonth 는 대상 월에 해당 일자가 없으면 다음 달로 롤오버됨 (1.31 + 1month → 3.3)
// 월말 보정: 대상 월의 마지막 날로 클램프 (1.31 + 1month → 2.28)
const addMonthsClamped = (date: Date, months: number): Date => {
    const day = date.getDate();
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
};

const todayISO = () => toISODate(new Date());

const minStartISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toISODate(d);
};

const MONTH_OPTIONS = Array.from({length: 12}, (_, i) => i + 1);

const isLockedStatus = (s: RoundStatus | undefined) => !!s && s !== 'SCHEDULED';

// 이전 회차들을 유지하면서 planMonths 만큼 회차를 빌드
// - 잠긴(과거/진행) 회차는 그대로 보존
// - 신규 SCHEDULED 회차는 planStartDate + i개월 기준으로 생성
const buildRounds = (
    planStartDate: string,
    planMonths: number,
    monthlyCredit: string,
    prevRounds: CreditRound[],
): CreditRound[] => {
    if (!planStartDate || !planMonths) return [];
    const planStart = new Date(planStartDate);
    const rounds: CreditRound[] = [];

    for (let i = 0; i < planMonths; i++) {
        if (i < prevRounds.length) {
            rounds.push({...prevRounds[i], round: i + 1});
            continue;
        }
        const periodStart = addMonthsClamped(planStart, i);
        const periodEnd = addMonthsClamped(planStart, i + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        rounds.push({
            round: i + 1,
            period: `${formatD(periodStart)}~${formatD(periodEnd)}`,
            credit: monthlyCredit || '',
            periodStartDate: toISODate(periodStart),
            periodEndDate: toISODate(periodEnd),
            status: 'SCHEDULED',
        });
    }
    return rounds;
};

export default function OverseasPlanPopup({uId, userId, initialData, onSave, onCreditChange}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;

    // 커스텀 플랜 수정 시 오늘 날짜 기준 상태 판별
    const today = todayISO();
    const isBeforeStart = isEdit && !!initialData?.planStartDate && today < initialData.planStartDate;
    const isExpired = isEdit && !!initialData?.planEndDate && today > initialData.planEndDate;

    const lockedRoundsCount = useMemo(
        () => (initialData?.credits ?? []).filter(c => isLockedStatus(c.status)).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    const [form, setForm] = useState<OverseasPlanFormData>(() => {
        const planStartDate = initialData?.planStartDate ?? todayISO();
        const planMonths = initialData?.planMonths ?? 1;
        const monthlyCredit = initialData?.monthlyCredit ?? '';
        const initialCredits = initialData?.credits && initialData.credits.length > 0
            ? initialData.credits
            : buildRounds(planStartDate, planMonths, monthlyCredit, []);

        return {
            planType: initialData?.planType ?? 'OVERSEAS',
            planName: initialData?.planName ?? '',
            planStartDate,
            planEndDate: initialData?.planEndDate ?? '',
            planMonths,
            contractAmount: initialData?.contractAmount ?? '',
            contractMethod: initialData?.contractMethod ?? 'GA 계약',
            managerGA: initialData?.managerGA ?? '',
            managerTP: initialData?.managerTP ?? '',
            contractDate: initialData?.contractDate ?? '',
            monthlyCredit,
            totalCredit: initialData?.totalCredit ?? 0,
            credits: initialCredits,
        };
    });

    const [creditInput, setCreditInput] = useState('');

    const formatNumberWithComma = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const updateField = <K extends keyof OverseasPlanFormData>(key: K, value: OverseasPlanFormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const handlePlanStartDateChange = (value: string) => {
        if (isEdit && !isBeforeStart) return;
        setForm(prev => {
            const valid = !!value && value >= minStartISO();
            return {
                ...prev,
                planStartDate: value,
                credits: valid ? buildRounds(value, prev.planMonths, prev.monthlyCredit, []) : prev.credits,
            };
        });
    };

    const handlePlanStartDateBlur = () => {
        if (isEdit && !isBeforeStart) return;
        if (!form.planStartDate || form.planStartDate < minStartISO()) {
            const forced = minStartISO();
            addPopup(<AlertComponent alertType={'error'} infoContent={`시작일은 오늘로부터 최대 7일 전까지만 선택할 수 있습니다. ${forced}(으)로 자동 설정됩니다.`}/>);
            setForm(prev => ({
                ...prev,
                planStartDate: forced,
                credits: buildRounds(forced, prev.planMonths, prev.monthlyCredit, []),
            }));
        }
    };

    const handlePlanMonthsChange = (value: number) => {
        if (isEdit && value < lockedRoundsCount) return; // 잠긴 회차 수 미만 불가
        setForm(prev => ({
            ...prev,
            planMonths: value,
            credits: buildRounds(prev.planStartDate, value, prev.monthlyCredit, prev.credits),
        }));
    };

    const handleMonthlyCreditChange = (value: string) => {
        setForm(prev => ({
            ...prev,
            monthlyCredit: value,
            credits: prev.credits.map(r => isLockedStatus(r.status) ? r : {...r, credit: value}),
        }));
    };

    const handleSave = () => {
        if (form.planType === 'GENERAL') {
            if (!form.planName.trim()) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'플랜명을 입력해주세요.'}/>);
                return;
            }
            if (!form.planStartDate) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'시작일을 입력해주세요.'}/>);
                return;
            }
            if (!form.planEndDate) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'종료일을 입력해주세요.'}/>);
                return;
            }
            if (form.planEndDate <= form.planStartDate) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'종료일은 시작일 이후여야 합니다.'}/>);
                return;
            }
            if (form.totalCredit <= 0) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'크레딧을 입력해주세요.'}/>);
                return;
            }
        } else {
            if (!form.planStartDate) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'플랜 시작일을 입력해주세요.'}/>);
                return;
            }
            if (!form.planMonths || form.planMonths <= 0) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'플랜 개월수를 선택해주세요.'}/>);
                return;
            }
            if (!form.contractAmount) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'계약금액을 입력해주세요.'}/>);
                return;
            }
            if (!form.contractDate) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'계약일자를 입력해주세요.'}/>);
                return;
            }
            if (!form.monthlyCredit) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'월 크레딧을 입력해주세요.'}/>);
                return;
            }
        }

        onSave?.(form);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={`overseas_plan_popup${form.planType === 'GENERAL' ? ' custom_plan' : ''}`}>
                <h4>{isEdit ? '플랜수정' : '플랜등록'}</h4>

                <div className={'popup_body'}>
                {/* 플랜구분 */}
                <div className={'popup_field'}>
                    <label className={'label_required'}>플랜구분 <span className={'required'}>*</span></label>
                    <div className={'radio_group'}>
                        <label className={'radio_label'}>
                            <input type="radio" name="planType" value="OVERSEAS"
                                   checked={form.planType === 'OVERSEAS'}
                                   disabled={isEdit}
                                   onChange={() => setForm(prev => ({...prev, planType: 'OVERSEAS', contractMethod: 'GA 계약'}))}/>
                            해외영업실행
                        </label>
                        <label className={'radio_label'}>
                            <input type="radio" name="planType" value="GENERAL"
                                   checked={form.planType === 'GENERAL'}
                                   disabled={isEdit}
                                   onChange={() => setForm(prev => ({...prev, planType: 'GENERAL', contractMethod: ''}))}/>
                            커스텀 플랜
                        </label>
                        {form.planType === 'GENERAL' && (
                            <input type="text" className={'plan_name_input'} value={form.planName}
                                   placeholder={'플랜명 필수 입력'}
                                   onChange={e => updateField('planName', e.target.value)}/>
                        )}
                    </div>
                </div>

                {form.planType === 'GENERAL' ? (
                    <>
                        {/* 이용기간 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>이용기간 <span className={'required'}>*</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={form.planStartDate}
                                       disabled={isEdit && !isBeforeStart}
                                       min={isEdit ? undefined : minStartISO()}
                                       onChange={e => handlePlanStartDateChange(e.target.value)}
                                       onBlur={handlePlanStartDateBlur}/>
                                <span className={'tilde'}>~</span>
                                <input type="date" value={form.planEndDate}
                                       disabled={isExpired}
                                       min={isEdit && !isBeforeStart ? today : (form.planStartDate || undefined)}
                                       onChange={e => updateField('planEndDate', e.target.value)}/>
                            </div>
                        </div>

                        {/* 크레딧 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>크레딧 <span className={'required'}>*</span></label>
                            <div className={'custom_credit_action'}>
                                <span className={'credit_balance'}>{form.totalCredit.toLocaleString()}</span>
                                <input type="text" inputMode="numeric" value={creditInput}
                                       placeholder={'크레딧 입력'}
                                       disabled={isExpired}
                                       onChange={e => setCreditInput(e.target.value.replace(/[^0-9]/g, ''))}/>
                                <button type={'button'} className={'btn_charge'}
                                        disabled={isExpired || !creditInput}
                                        onClick={() => {
                                            const val = Number(creditInput) || 0;
                                            if (val <= 0) return;
                                            updateField('totalCredit', form.totalCredit + val);
                                            setCreditInput('');
                                        }}>충전</button>
                                <button type={'button'} className={'btn_deduct'}
                                        disabled={isExpired || !creditInput}
                                        onClick={() => {
                                            const val = Number(creditInput) || 0;
                                            if (val <= 0) return;
                                            if (val > form.totalCredit) { addPopup(<AlertComponent alertType={'error'} infoContent={'보유 크레딧보다 많이 차감할 수 없습니다.'}/>); return; }
                                            updateField('totalCredit', form.totalCredit - val);
                                            setCreditInput('');
                                        }}>차감</button>
                            </div>
                        </div>

                        {/* 계약금액 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약금액 <span className={'required'}></span></label>
                            <div className={'amount_wrap'}>
                                <input type="text" value={form.contractAmount}
                                       onChange={e => updateField('contractAmount', formatNumberWithComma(e.target.value))}/>
                                <span className={'unit'}>원(vat포함)</span>
                            </div>
                        </div>

                        {/* 계약방식 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약방식 <span className={'required'}></span></label>
                            <input type="text" value={form.contractMethod}
                                   onChange={e => updateField('contractMethod', e.target.value)}/>
                        </div>

                        {/* 계약일자 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약일자 <span className={'required'}></span></label>
                            <input type="date" value={form.contractDate} className={'date_single'}
                                   onChange={e => updateField('contractDate', e.target.value)}/>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 플랜기간 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>플랜기간 <span className={'required'}>*</span></label>
                            <div className={'date_range'}>
                                <input type="date" value={form.planStartDate}
                                       disabled={isEdit}
                                       min={isEdit ? undefined : minStartISO()}
                                       onChange={e => handlePlanStartDateChange(e.target.value)}
                                       onBlur={handlePlanStartDateBlur}/>
                                <select value={form.planMonths}
                                        onChange={e => handlePlanMonthsChange(Number(e.target.value))}>
                                    {MONTH_OPTIONS.map(m => (
                                        <option key={m} value={m} disabled={isEdit && m < lockedRoundsCount}>
                                            {m}개월
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 계약금액 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약금액 <span className={'required'}>*</span></label>
                            <div className={'amount_wrap'}>
                                <input type="text" value={form.contractAmount}
                                       onChange={e => updateField('contractAmount', formatNumberWithComma(e.target.value))}/>
                                <span className={'unit'}>원(vat포함)</span>
                            </div>
                        </div>

                        {/* 계약방식 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약방식 <span className={'required'}>*</span></label>
                            <select value={form.contractMethod}
                                    onChange={e => updateField('contractMethod', e.target.value)}>
                                <option value="GA 계약">GA 계약</option>
                            </select>
                        </div>

                        {/* 담당GA / 담당TP */}
                        <div className={'popup_field'}>
                            <label className={'label_optional'}>담당GA</label>
                            <input type="text" value={form.managerGA}
                                   onChange={e => updateField('managerGA', e.target.value)}/>
                        </div>
                        <div className={'popup_field'}>
                            <label className={'label_optional'}>담당TP</label>
                            <input type="text" value={form.managerTP}
                                   onChange={e => updateField('managerTP', e.target.value)}/>
                        </div>

                        {/* 계약일자 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>계약일자 <span className={'required'}>*</span></label>
                            <input type="date" value={form.contractDate} className={'date_single'}
                                   onChange={e => updateField('contractDate', e.target.value)}/>
                        </div>

                        {/* 월 크레딧 */}
                        <div className={'popup_field'}>
                            <label className={'label_required'}>월 크레딧 <span className={'required'}>*</span></label>
                            <div className={'credit_setting_row'}>
                                <input type="text" value={form.monthlyCredit} className={'credit_input'}
                                       onChange={e => handleMonthlyCreditChange(formatNumberWithComma(e.target.value))}/>
                            </div>
                        </div>

                        {/* 크레딧 테이블 (회차 자동 생성) */}
                        <div className={'credit_rounds_table'}>
                            <table>
                                <thead>
                                <tr>
                                    <th>회차</th>
                                    <th>이용기간</th>
                                    <th>지급 크레딧</th>
                                </tr>
                                </thead>
                                <tbody>
                                {form.credits.length > 0 ? (
                                    form.credits.map(c => {
                                        const locked = isLockedStatus(c.status);
                                        return (
                                            <tr key={c.round} className={locked ? 'round_past' : ''}>
                                                <td>{c.round}회차</td>
                                                <td>{c.period}</td>
                                                <td>{c.credit}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    Array.from({length: Math.max(form.planMonths || 1, 1)}, (_, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}회차</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
                </div>

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
