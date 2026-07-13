'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

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

// 팝업 내부 구분 타입 (UI 표시용)
type PlanCategory = 'CUSTOM' | 'BONUS' | 'HYBRID';

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
    memo?: string;
}

const formatD = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;

const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayISO = () => toISODate(new Date());

const addMonthsClamped = (date: Date, months: number): Date => {
    const day = date.getDate();
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
};

const formatComma = (v: string) => {
    const num = v.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const MONTH_OPTIONS = Array.from({length: 12}, (_, i) => i + 1);

const calcEndDate = (startDate: string, months: number): string => {
    if (!startDate) return '';
    const end = addMonthsClamped(new Date(startDate), months);
    end.setDate(end.getDate() - 1);
    return toISODate(end);
};

// 개월 수 기반으로 회차 자동 생성 (startDate 없으면 기간 비워둠)
const buildHybridRounds = (startDate: string, months: number, monthlyCredit: string): CreditRound[] => {
    if (!months || months <= 0) return [];
    const hasStart = !!startDate;
    const start = hasStart ? new Date(startDate) : null;

    const rounds: CreditRound[] = [];
    for (let i = 0; i < months; i++) {
        let period = '';
        let periodStartDate: string | undefined;
        let periodEndDate: string | undefined;

        if (start) {
            const ps = addMonthsClamped(start, i);
            const pe = addMonthsClamped(start, i + 1);
            pe.setDate(pe.getDate() - 1);
            period = `${formatD(ps)} ~ ${formatD(pe)}`;
            periodStartDate = toISODate(ps);
            periodEndDate = toISODate(pe);
        }

        rounds.push({
            round: i + 1,
            period,
            credit: monthlyCredit || '',
            periodStartDate,
            periodEndDate,
            status: 'SCHEDULED',
        });
    }
    return rounds;
};

// 카테고리 → API paymentMethod 매핑
const categoryToPlanType = (cat: PlanCategory): PlanType => {
    switch (cat) {
        case 'HYBRID': return 'OVERSEAS';
        case 'CUSTOM':
        case 'BONUS':
        default: return 'GENERAL';
    }
};

// 기존 데이터에서 카테고리 역매핑
const planTypeToCategory = (data?: Partial<OverseasPlanFormData>): PlanCategory => {
    if (!data) return 'CUSTOM';
    if (data.planType === 'OVERSEAS') return 'HYBRID';
    return 'CUSTOM';
};

export default function OverseasPlanPopup({uId, initialData, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;

    const [category, setCategory] = useState<PlanCategory>(() => planTypeToCategory(initialData));

    const [form, setForm] = useState<OverseasPlanFormData>(() => ({
        planType: initialData?.planType ?? categoryToPlanType(category),
        planName: initialData?.planName ?? '',
        planStartDate: initialData?.planStartDate ?? '',
        planEndDate: initialData?.planEndDate ?? '',
        planMonths: initialData?.planMonths ?? 1,
        contractAmount: initialData?.contractAmount ?? '',
        contractMethod: initialData?.contractMethod ?? '',
        managerGA: initialData?.managerGA ?? '',
        managerTP: initialData?.managerTP ?? '',
        contractDate: initialData?.contractDate ?? '',
        monthlyCredit: initialData?.monthlyCredit ?? '',
        totalCredit: initialData?.totalCredit ?? 0,
        credits: initialData?.credits ?? [],
        memo: initialData?.memo ?? '',
    }));

    const [creditInput, setCreditInput] = useState('');
    const [appliedAmount, setAppliedAmount] = useState(0);

    const handleCategoryChange = (cat: PlanCategory) => {
        if (isEdit) return;
        setCategory(cat);
        setForm(prev => {
            const next = {...prev, planType: categoryToPlanType(cat)};
            if (cat === 'HYBRID') {
                next.credits = buildHybridRounds(prev.planStartDate, prev.planMonths, prev.monthlyCredit);
            }
            return next;
        });
    };

    const handleCharge = () => {
        const val = Number(creditInput) || 0;
        if (val <= 0) return;
        setForm(prev => ({...prev, totalCredit: prev.totalCredit + val}));
        setAppliedAmount(val);
        setCreditInput('');
    };

    const handleDeduct = () => {
        const val = Number(creditInput) || 0;
        if (val <= 0) return;
        if (val > form.totalCredit) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'보유 크레딧보다 많이 차감할 수 없습니다.'}/>);
            return;
        }
        setForm(prev => ({...prev, totalCredit: prev.totalCredit - val}));
        setAppliedAmount(-val);
        setCreditInput('');
    };

    const handleSave = () => {
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

        onSave?.(form);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={'overseas_plan_popup plan_register_popup'}>
                <h4>{isEdit ? '플랜수정' : '플랜등록'}</h4>

                <div className={'popup_body'}>
                    {/* 플랜구분 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>플랜구분 <span className={'required'}>(필수)</span></label>
                        <div className={'radio_group'}>
                            <label className={'radio_label'}>
                                <input type="radio" name="planCategory" value="CUSTOM"
                                       checked={category === 'CUSTOM'}
                                       disabled={isEdit}
                                       onChange={() => handleCategoryChange('CUSTOM')}/>
                                커스텀
                            </label>
                            <label className={'radio_label'}>
                                <input type="radio" name="planCategory" value="BONUS"
                                       checked={category === 'BONUS'}
                                       disabled={isEdit}
                                       onChange={() => handleCategoryChange('BONUS')}/>
                                보너스
                            </label>
                            <label className={'radio_label'}>
                                <input type="radio" name="planCategory" value="HYBRID"
                                       checked={category === 'HYBRID'}
                                       disabled={isEdit}
                                       onChange={() => handleCategoryChange('HYBRID')}/>
                                하이브리드
                            </label>
                        </div>
                    </div>

                    {/* 플랜명 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>플랜명 <span className={'required'}>(필수)</span></label>
                        <input type="text" value={form.planName}
                               placeholder={''}
                               onChange={e => setForm(prev => ({...prev, planName: e.target.value}))}/>
                    </div>

                    {/* 이용기간 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>이용기간</label>
                        {category === 'HYBRID' ? (
                            <div className={'date_range hybrid_date_range'}>
                                <input type="date" value={form.planStartDate}
                                       onChange={e => {
                                           const v = e.target.value;
                                           setForm(prev => {
                                               const endDate = calcEndDate(v, prev.planMonths);
                                               return {...prev, planStartDate: v, planEndDate: endDate, credits: buildHybridRounds(v, prev.planMonths, prev.monthlyCredit)};
                                           });
                                       }}/>
                                <span className={'tilde'}>로 부터</span>
                                <select value={form.planMonths}
                                        onChange={e => {
                                            const m = Number(e.target.value);
                                            setForm(prev => {
                                                const endDate = calcEndDate(prev.planStartDate, m);
                                                return {...prev, planMonths: m, planEndDate: endDate, credits: buildHybridRounds(prev.planStartDate, m, prev.monthlyCredit)};
                                            });
                                        }}>
                                    {MONTH_OPTIONS.map(m => (
                                        <option key={m} value={m}>{m}개월</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className={'date_range'}>
                                <input type="date" value={form.planStartDate}
                                       onChange={e => setForm(prev => ({...prev, planStartDate: e.target.value}))}/>
                                <span className={'tilde'}>-</span>
                                <input type="date" value={form.planEndDate}
                                       min={form.planStartDate || undefined}
                                       onChange={e => setForm(prev => ({...prev, planEndDate: e.target.value}))}/>
                            </div>
                        )}
                    </div>

                    {/* 크레딧 관리 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>크레딧 관리</label>
                        {category === 'HYBRID' ? (
                            <>
                                <input type="text" inputMode="numeric" value={formatComma(form.monthlyCredit)}
                                       className={'hybrid_credit_input'}
                                       placeholder={'숫자만 입력'}
                                       onChange={e => {
                                           const raw = e.target.value.replace(/[^0-9]/g, '');
                                           setForm(prev => ({
                                               ...prev,
                                               monthlyCredit: raw,
                                               credits: buildHybridRounds(prev.planStartDate, prev.planMonths, raw),
                                           }));
                                       }}/>
                                <div className={'credit_rounds_table'}>
                                    <table>
                                        <colgroup>
                                            <col style={{width: '18%'}}/>
                                            <col style={{width: '52%'}}/>
                                            <col style={{width: '30%'}}/>
                                        </colgroup>
                                        <thead>
                                        <tr>
                                            <th>회차</th>
                                            <th>사용기간</th>
                                            <th>크레딧</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {(form.credits.length > 0 ? form.credits : Array.from({length: form.planMonths}, (_, i) => ({
                                            round: i + 1, period: '', credit: '',
                                        }))).map(c => (
                                            <tr key={c.round}>
                                                <td>{c.round}회차</td>
                                                <td>{c.period || ''}</td>
                                                <td>{c.credit ? formatComma(c.credit) : ''}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className={'credit_manage_row'}>
                                <input type="text" inputMode="numeric" value={creditInput}
                                       className={'credit_amount_input'}
                                       placeholder={'숫자만 입력'}
                                       onChange={e => setCreditInput(e.target.value.replace(/[^0-9]/g, ''))}/>
                                <button type={'button'} className={'btn_charge'} disabled={!creditInput} onClick={handleCharge}>충전</button>
                                <button type={'button'} className={'btn_deduct'} disabled={!creditInput} onClick={handleDeduct}>차감</button>
                                <span className={'applied_amount'}>반영 금액 : <span className={appliedAmount > 0 ? 'charge' : appliedAmount < 0 ? 'deduct' : ''}>{appliedAmount.toLocaleString()}</span></span>
                            </div>
                        )}
                    </div>

                    {/* 비고 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>비고</label>
                        <textarea className={'memo_textarea'} value={form.memo ?? ''}
                                  rows={4}
                                  onChange={e => setForm(prev => ({...prev, memo: e.target.value}))}/>
                    </div>
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
