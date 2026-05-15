'use client';

import {useState, useMemo} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface CreditRound {
    round: number;
    period: string;
    credit: string;
    periodStartDate?: string;
    periodEndDate?: string;
}

interface Props {
    uId?: string;
    initialData?: Partial<OverseasPlanFormData>;
    onSave?: (data: OverseasPlanFormData) => void;
}

export interface OverseasPlanFormData {
    contractStartDate: string;
    contractEndDate: string;
    contractAmount: string;
    contractMethod: string;
    managerGA: string;
    managerTP: string;
    contractDate: string;
    creditStartDate: string;
    monthlyCredit: string;
    credits: CreditRound[];
}

const toDateOnly = (s: string) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const formatD = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function OverseasPlanPopup({uId, initialData, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;

    const [form, setForm] = useState<OverseasPlanFormData>({
        contractStartDate: initialData?.contractStartDate ?? '',
        contractEndDate: initialData?.contractEndDate ?? '',
        contractAmount: initialData?.contractAmount ?? '',
        contractMethod: initialData?.contractMethod ?? 'GA 계약',
        managerGA: initialData?.managerGA ?? '',
        managerTP: initialData?.managerTP ?? '',
        contractDate: initialData?.contractDate ?? '',
        creditStartDate: initialData?.creditStartDate ?? '',
        monthlyCredit: initialData?.monthlyCredit ?? '',
        credits: initialData?.credits ?? [],
    });

    const updateField = <K extends keyof OverseasPlanFormData>(key: K, value: OverseasPlanFormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const formatNumberWithComma = (value: string) => {
        const num = value.replace(/[^0-9]/g, '');
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 이용시작일이 오늘이거나 지났으면 크레딧 설정 잠금
    const isCreditLocked = useMemo(() => {
        if (!form.creditStartDate) return false;
        return toDateOnly(form.creditStartDate) <= getToday();
    }, [form.creditStartDate]);

    // 회차별 기간이 오늘 기준으로 지났거나 해당되는지 판별
    const isRoundPast = (round: CreditRound) => {
        if (!round.periodEndDate) {
            // period 문자열에서 종료일 파싱 (YYYY.MM.DD ~ YYYY.MM.DD 또는 YYYY.MM.DD~YYYY.MM.DD)
            const match = round.period.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/);
            if (!match) return false;
            const endDate = new Date(Number(match[4]), Number(match[5]) - 1, Number(match[6]));
            endDate.setHours(0, 0, 0, 0);
            return endDate <= getToday();
        }
        return toDateOnly(round.periodEndDate) <= getToday();
    };

    const isRoundCurrent = (round: CreditRound) => {
        let startDate: Date, endDate: Date;
        if (round.periodStartDate && round.periodEndDate) {
            startDate = toDateOnly(round.periodStartDate);
            endDate = toDateOnly(round.periodEndDate);
        } else {
            const match = round.period.match(/(\d{4})\.(\d{2})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})\.(\d{2})/);
            if (!match) return false;
            startDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            endDate = new Date(Number(match[4]), Number(match[5]) - 1, Number(match[6]));
        }
        const today = getToday();
        return startDate <= today && today <= endDate;
    };

    const handleRegisterCredits = () => {
        if (!form.contractStartDate || !form.contractEndDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'계약기간을 먼저 입력해주세요.'}/>);
            return;
        }
        if (!form.creditStartDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'이용시작일을 입력해주세요.'}/>);
            return;
        }

        const start = new Date(form.contractStartDate);
        const end = new Date(form.contractEndDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

        if (months <= 0) return;

        const creditStart = new Date(form.creditStartDate);
        const rounds: CreditRound[] = [];
        for (let i = 0; i < months; i++) {
            const periodStart = new Date(creditStart);
            periodStart.setMonth(periodStart.getMonth() + i);
            const periodEnd = new Date(creditStart);
            periodEnd.setMonth(periodEnd.getMonth() + i + 1);
            periodEnd.setDate(periodEnd.getDate() - 1);

            rounds.push({
                round: i + 1,
                period: `${formatD(periodStart)}~${formatD(periodEnd)}`,
                credit: form.monthlyCredit || '',
                periodStartDate: toISODate(periodStart),
                periodEndDate: toISODate(periodEnd),
            });
        }

        updateField('credits', rounds);
    };

    const handleSave = () => {
        if (!form.contractStartDate || !form.contractEndDate) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'계약기간을 입력해주세요.'}/>);
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

        onSave?.(form);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={'overseas_plan_popup'}>
                <h4>{isEdit ? '해외영업실행 플랜수정' : '해외영업실행 플랜등록'}</h4>

                {/* 계약기간 */}
                <div className={'popup_field'}>
                    <label className={'label_required'}>계약기간 <span className={'required'}>*</span></label>
                    <div className={'date_range'}>
                        <input type="date" value={form.contractStartDate}
                               onChange={e => updateField('contractStartDate', e.target.value)}/>
                        <span className={'tilde'}>-</span>
                        <input type="date" value={form.contractEndDate}
                               onChange={e => updateField('contractEndDate', e.target.value)}/>
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

                {/* 담당GA */}
                <div className={'popup_field'}>
                    <label className={'label_optional'}>담당GA</label>
                    <input type="text" value={form.managerGA}
                           onChange={e => updateField('managerGA', e.target.value)}/>
                </div>

                {/* 담당TP */}
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

                {/* 크레딧 설정 */}
                <div className={'popup_field'}>
                    <label className={'label_required'}>크레딧 설정 <span className={'required'}>*</span></label>
                    <div className={'credit_setting_row'}>
                        <span>이용시작일</span>
                        <input type="date" value={form.creditStartDate}
                               disabled={isCreditLocked}
                               onChange={e => updateField('creditStartDate', e.target.value)}/>
                        <span>월크레딧</span>
                        <input type="text" value={form.monthlyCredit} className={'credit_input'}
                               disabled={isCreditLocked}
                               onChange={e => updateField('monthlyCredit', formatNumberWithComma(e.target.value))}/>
                        {!isCreditLocked && (
                            <button type={'button'} className={'btn_register'} onClick={handleRegisterCredits}>등록</button>
                        )}
                    </div>
                </div>

                {/* 크레딧 테이블 */}
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
                                const past = isRoundPast(c);
                                const current = isRoundCurrent(c);
                                const dimmed = past || current;
                                return (
                                    <tr key={c.round} className={dimmed ? 'round_past' : ''}>
                                        <td>{c.round}회차</td>
                                        <td>{c.period}</td>
                                        <td>{c.credit || form.monthlyCredit || ''}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            Array.from({length: 6}, (_, i) => (
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

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}