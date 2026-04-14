'use client';

import Link from "next/link";
import {useState, useRef, ReactNode} from "react";
import CreditTable from "@/app/(Auth)/client/[id]/component/CreditTable";
import {CreditRow} from "@/app/(Auth)/client/[id]/component/CreditTable";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {UserSchema, UserType} from "@/types/user/user";
import {formatDateDot, formatBusinessNumber, isValidBusinessNumber} from "@/utill/format";

type DuplicateStatus = 'none' | 'success' | 'error' | 'invalid';

interface ServiceForm {
    id: number;
    apiId?: number;
    planName: string;
    startDate: string;
    endDate: string;
    months: number;
    isNew: boolean;
    credits: CreditRow[];
}

interface ApiCreditRound {
    id: number;
    scheduledDate: string;
    amount: number;
    status: string;
}

export interface ApiCreditPlan {
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    months: number;
    createdAt: string;
    rounds: ApiCreditRound[];
}

export interface ApiUserDetailResponse {
    user: Record<string, unknown>;
    creditPlans: ApiCreditPlan[];
}

const formatCredit = (n: number) => n.toLocaleString();

const parseCredit = (s: string) => {
    const num = parseInt(s.replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
};

const buildCreditPlansPayload = (forms: ServiceForm[]) => forms.map(form => ({
    ...(form.apiId ? {id: form.apiId} : {}),
    planName: form.planName,
    startDate: form.startDate,
    endDate: form.endDate,
    months: form.months || 0,
    rounds: form.credits.map(c => ({
        ...(c.apiId ? {id: c.apiId} : {}),
        scheduledDate: c.date,
        amount: parseCredit(c.credit),
        ...(c.status !== 'SCHEDULED' ? {status: c.status} : {}),
    })),
}));

export const mapApiToServiceForms = (plans: ApiCreditPlan[]): ServiceForm[] => {
    return plans.map(plan => ({
        id: Date.now() + plan.id,
        apiId: plan.id,
        planName: plan.planName,
        startDate: plan.startDate,
        endDate: plan.endDate,
        months: plan.months,
        isNew: false,
        credits: plan.rounds.map((r, i) => ({
            id: Date.now() + r.id,
            apiId: r.id,
            rowNumber: i + 1,
            date: r.scheduledDate,
            credit: formatCredit(r.amount),
            status: r.status,
        })),
    }));
};

const toDate = (s: string) => {
    const d = new Date(s);
    d.setHours(0, 0, 0, 0);
    return d;
};

const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

interface Props {
    id: string;
    initialUser: UserType;
    initialCreditPlans: ApiCreditPlan[];
}

export default function ClientDetailPage({id, initialUser, initialCreditPlans}: Props) {
    const {addPopup} = usePopupStore();

    const [user, setUser] = useState<UserType>(initialUser);

    const companyNameRef = useRef<HTMLInputElement>(null);
    const businessNumberRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    const [duplicateStatus, setDuplicateStatus] = useState<Record<string, DuplicateStatus>>({
        companyName: 'none',
        businessNumber: 'none',
    });

    const [serviceForms, setServiceForms] = useState<ServiceForm[]>(mapApiToServiceForms(initialCreditPlans));

    const showAlert = (message: ReactNode, callback?: () => void, showCancel: boolean = true) => {
        addPopup(<AlertComponent alertType="alert" infoContent={message} callback={callback} showCancel={showCancel}/>);
    };

    const handleSave = async () => {
        const companyName = companyNameRef.current?.value.trim() || '';
        const businessNumber = businessNumberRef.current?.value.trim() || '';
        const password = passwordRef.current?.value || '';

        if (!companyName || !businessNumber) {
            showAlert('고객사명과 사업자번호는 필수입니다.', undefined, false);
            return;
        }

        if (companyName !== user.companyName && duplicateStatus.companyName !== 'success') {
            showAlert('고객사명 중복체크를 완료해주세요.', undefined, false);
            return;
        }
        if (businessNumber !== user.businessNumber && duplicateStatus.businessNumber !== 'success') {
            showAlert('사업자번호 중복체크를 완료해주세요.', undefined, false);
            return;
        }

        const body: Record<string, unknown> = {
            companyName,
            businessNumber,
            creditPlans: buildCreditPlansPayload(serviceForms),
        };
        if (password) body.password = password;

        const res = await callApi(`/api/admin/clients/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(body),
        });

        if (res.result && res.data) {
            const resBody = res.data as ApiUserDetailResponse;
            const parsed = UserSchema.parse(resBody.user);
            setUser(parsed);
            if (resBody.creditPlans) {
                setServiceForms(mapApiToServiceForms(resBody.creditPlans));
            }
            setDuplicateStatus({companyName: 'none', businessNumber: 'none'});
            if (passwordRef.current) passwordRef.current.value = parsed.password || '';
            showAlert('저장되었습니다.', undefined, false);
        } else {
            showAlert(res.message || '저장에 실패했습니다.', undefined, false);
        }
    };

    const handleDuplicateCheck = async (fieldKey: string) => {
        const options: RequestInit = {method: 'GET', credentials: 'include'};
        const ref = fieldKey === 'companyName' ? companyNameRef : businessNumberRef;
        const value = ref.current?.value || '';

        if (!value.trim()) return;

        if (fieldKey === 'businessNumber' && !isValidBusinessNumber(value)) {
            setDuplicateStatus(prev => ({...prev, businessNumber: 'invalid'}));
            return;
        }

        if (fieldKey === 'companyName') {
            const res = await callApi(`/api/admin/clients/check-company-name?companyName=${encodeURIComponent(value.trim())}`, options);
            if (res.result && res.data) {
                const {duplicate} = res.data as { duplicate: boolean };
                setDuplicateStatus(prev => ({...prev, companyName: duplicate ? 'error' : 'success'}));
            }
        } else if (fieldKey === 'businessNumber') {
            const res = await callApi(`/api/admin/clients/check-business-number?businessNumber=${encodeURIComponent(value.trim())}`, options);
            if (res.result && res.data) {
                const {duplicate} = res.data as { duplicate: boolean };
                setDuplicateStatus(prev => ({...prev, businessNumber: duplicate ? 'error' : 'success'}));
            }
        }
    };

    const getStatusMessage = (fieldKey: string) => {
        const status = duplicateStatus[fieldKey];
        if (status === 'success') return '중복 확인이 완료되었습니다.';
        if (status === 'error') return '이미 등록한 고객사 입니다.';
        if (status === 'invalid' && fieldKey === 'businessNumber') return '사업자번호 10자리를 입력해주세요';
        return '';
    };

    const handleAddService = () => {
        if (serviceForms.some(f => f.isNew)) {
            showAlert('서비스 플랜은 1회만 추가할 수 있습니다.');
            return;
        }

        const latest = serviceForms[0];
        if (latest && latest.endDate && toDate(latest.endDate) >= today()) {
            showAlert(<>운영기간 중에는 서비스 플랜 정보를<br/>신규로 추가할 수 없습니다.</>);
            return;
        }

        let defaultStart = today().toISOString().slice(0, 10);
        if (latest && latest.endDate) {
            const nextDay = new Date(latest.endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDayStr = nextDay.toISOString().slice(0, 10);
            if (nextDayStr > defaultStart) defaultStart = nextDayStr;
        }

        const newForm: ServiceForm = {
            id: Date.now(),
            planName: '',
            startDate: defaultStart,
            endDate: '',
            months: 0,
            isNew: true,
            credits: [],
        };
        setServiceForms(prev => [newForm, ...prev]);
    };

    const updateService = (serviceId: number, updater: (form: ServiceForm) => ServiceForm) => {
        setServiceForms(prev => prev.map(f => f.id === serviceId ? updater(f) : f));
    };

    const handleServiceStartDate = (serviceId: number, startDate: string) => {
        const form = serviceForms.find(f => f.id === serviceId);
        if (!form) return;

        const idx = serviceForms.findIndex(f => f.id === serviceId);
        const prevService = serviceForms[idx + 1];
        if (prevService && prevService.endDate && startDate && toDate(startDate) <= toDate(prevService.endDate)) {
            showAlert('이전 서비스 종료일 이후로 설정해주세요.');
            return;
        }

        if (form.endDate && startDate && toDate(startDate) >= toDate(form.endDate)) {
            showAlert('시작일은 종료일 이전이어야 합니다.');
            return;
        }

        const invalidCredits = form.credits.filter(c => c.date && c.status === 'SCHEDULED' && toDate(c.date) < toDate(startDate));
        if (invalidCredits.length > 0) {
            showAlert('시작일 이전의 크레딧 지급일이 있습니다. 지급일을 먼저 변경해주세요.');
            return;
        }

        updateService(serviceId, f => ({...f, startDate}));
    };

    const handleServiceEndDate = (serviceId: number, endDate: string) => {
        const form = serviceForms.find(f => f.id === serviceId);
        if (!form) return;

        if (form.startDate && endDate && toDate(endDate) <= toDate(form.startDate)) {
            showAlert('종료일은 시작일 이후여야 합니다.');
            return;
        }

        const invalidCredits = form.credits.filter(c => c.date && c.status === 'SCHEDULED' && toDate(c.date) > toDate(endDate));
        if (invalidCredits.length > 0) {
            showAlert('종료일 이후의 크레딧 지급일이 있습니다. 지급일을 먼저 변경해주세요.');
            return;
        }

        updateService(serviceId, f => ({...f, endDate}));
    };

    const handleAddCredit = (serviceId: number) => {
        const form = serviceForms.find(f => f.id === serviceId);
        if (!form) return;

        if (!form.startDate || !form.endDate) {
            showAlert('운영기간을 먼저 설정해주세요.');
            return;
        }
        const newRowNumber = form.credits.length > 0 ? Math.max(...form.credits.map(r => r.rowNumber)) + 1 : 1;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);

        let defaultDate = form.startDate < tomorrowStr ? tomorrowStr : form.startDate;
        const lastCredit = form.credits[form.credits.length - 1];
        if (lastCredit && lastCredit.date) {
            const next = new Date(lastCredit.date);
            next.setDate(next.getDate() + 1);
            const nextStr = next.toISOString().slice(0, 10);
            if (nextStr > defaultDate) defaultDate = nextStr;
        }
        if (defaultDate > form.endDate) defaultDate = form.endDate;

        updateService(serviceId, f => ({
            ...f,
            credits: [...f.credits, {id: Date.now(), rowNumber: newRowNumber, date: defaultDate, credit: '', status: 'SCHEDULED'}],
        }));
    };

    const handleDeleteCredit = (serviceId: number, creditId: number) => {
        updateService(serviceId, form => {
            const filtered = form.credits.filter(c => c.id !== creditId);
            return {
                ...form,
                credits: filtered.map((c, i) => ({...c, rowNumber: i + 1})),
            };
        });
    };

    const handleCreditDateChange = (serviceId: number, creditId: number, date: string) => {
        const form = serviceForms.find(f => f.id === serviceId);
        if (!form) return;

        const idx = form.credits.findIndex(c => c.id === creditId);
        if (idx === -1) return;

        if (form.startDate && toDate(date) < toDate(form.startDate)) {
            showAlert('지급일은 운영기간 시작일 이후여야 합니다.');
            return;
        }
        if (form.endDate && toDate(date) > toDate(form.endDate)) {
            showAlert('지급일은 운영기간 종료일 이전이어야 합니다.');
            return;
        }

        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1);
        minDate.setHours(0, 0, 0, 0);
        if (toDate(date) < minDate) {
            showAlert('지급일은 내일 이후여야 합니다.');
            return;
        }

        const prevCredit = form.credits[idx - 1];
        if (prevCredit && prevCredit.date && toDate(date) <= toDate(prevCredit.date)) {
            showAlert('이전 회차 지급일 이후로 설정해주세요.');
            return;
        }

        const nextCredit = form.credits[idx + 1];
        if (nextCredit && nextCredit.date && toDate(date) >= toDate(nextCredit.date)) {
            showAlert('다음 회차 지급일 이전으로 설정해주세요.');
            return;
        }

        updateService(serviceId, f => {
            const newCredits = [...f.credits];
            newCredits[idx] = {...newCredits[idx], date};
            return {...f, credits: newCredits};
        });
    };

    const handleCreditAmountChange = (serviceId: number, creditId: number, credit: string) => {
        updateService(serviceId, form => {
            const newCredits = form.credits.map(c => c.id === creditId ? {...c, credit} : c);
            return {...form, credits: newCredits};
        });
    };

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/client'}>고객관리</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>
            <div className={'detail_contents'}>
                <section className={'account_info'}>
                    <div className={'title'}>
                        <div className={'title_left'}>
                            <span className={'admin_icon'}/>
                            계정정보
                        </div>
                    </div>
                    <ul className={'form_list'}>
                        <li className={'form_item'}>
                            <p className={'form_label'}>고객사명 <span>*</span></p>
                            <div className={'input_wrap'}>
                                <div className={`input_field ${duplicateStatus.companyName}`}>
                                    <input
                                        type="text"
                                        ref={companyNameRef}
                                        defaultValue={user.companyName}
                                        onChange={() => setDuplicateStatus(prev => ({...prev, companyName: 'none'}))}
                                    />
                                    {getStatusMessage('companyName') && (
                                        <span className={`status_msg ${duplicateStatus.companyName}`}>{getStatusMessage('companyName')}</span>
                                    )}
                                </div>
                                <button
                                    type={'button'}
                                    className={duplicateStatus.companyName === 'success' ? 'disabled' : ''}
                                    disabled={duplicateStatus.companyName === 'success'}
                                    onClick={() => handleDuplicateCheck('companyName')}
                                >
                                    중복체크
                                </button>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>사업자번호 <span>*</span></p>
                            <div className={'input_wrap'}>
                                <div className={`input_field ${duplicateStatus.businessNumber}`}>
                                    <input
                                        type="text"
                                        ref={businessNumberRef}
                                        defaultValue={user.businessNumber}
                                        onChange={e => {
                                            e.target.value = formatBusinessNumber(e.target.value);
                                            setDuplicateStatus(prev => ({...prev, businessNumber: 'none'}));
                                        }}
                                        placeholder={'000-00-00000'}
                                    />
                                    {getStatusMessage('businessNumber') && (
                                        <span className={`status_msg ${duplicateStatus.businessNumber}`}>{getStatusMessage('businessNumber')}</span>
                                    )}
                                </div>
                                <button
                                    type={'button'}
                                    className={duplicateStatus.businessNumber === 'success' ? 'disabled' : ''}
                                    disabled={duplicateStatus.businessNumber === 'success'}
                                    onClick={() => handleDuplicateCheck('businessNumber')}
                                >
                                    중복체크
                                </button>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>아이디(e-mail) <span>*</span></p>
                            <input type="text" readOnly defaultValue={user.loginId}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>패스워드 <span>*</span></p>
                            <input type="text" ref={passwordRef} autoComplete="new-password" defaultValue={user.password || ''}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>계정생성일</p>
                            <input type="text" readOnly defaultValue={formatDateDot(user.createdAt)}/>
                        </li>
                    </ul>
                </section>
                <section className={'credit_setting'}>
                    <div className={'title'}>
                        <div className={'title_left'}>
                            <span className={'admin_icon'}/>
                            크레딧 설정
                        </div>
                        <button type={'button'} className={'add_btn'} onClick={handleAddService}>
                            <span className={'admin_icon'}/> 추가
                        </button>
                    </div>
                    {serviceForms.map((form, formIdx) => {
                        const hasNextService = formIdx > 0;
                        const isLocked = !form.isNew && form.endDate && toDate(form.endDate) < today() && hasNextService;

                        return (
                            <div key={form.id} className={'add_form'}>
                                <div className={'top'}>
                                    <div className={'left'}>
                                        <p>서비스 플랜</p>
                                        <input
                                            type="text"
                                            placeholder={'ex) 플랜명 / 月 00만'}
                                            value={form.planName}
                                            onChange={e => updateService(form.id, f => ({...f, planName: e.target.value}))}
                                            disabled={!!isLocked}
                                        />
                                    </div>
                                    <div className={'right'}>
                                        <p>운영기간</p>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => handleServiceStartDate(form.id, e.target.value)}
                                            disabled={!!isLocked}
                                        />
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            min={form.startDate || undefined}
                                            onChange={e => handleServiceEndDate(form.id, e.target.value)}
                                            disabled={!!isLocked}
                                        />
                                        <input
                                            type="text"
                                            value={form.months || ''}
                                            onChange={e => updateService(form.id, f => ({...f, months: parseInt(e.target.value) || 0}))}
                                            disabled={!!isLocked}
                                        />
                                        개월
                                    </div>
                                </div>
                                <div className={'bottom'}>
                                    <p>크레딧 지급 설정</p>
                                    <CreditTable
                                        rows={form.credits}
                                        serviceStartDate={form.startDate}
                                        serviceEndDate={form.endDate}
                                        disabled={!!isLocked}
                                        onAdd={() => handleAddCredit(form.id)}
                                        onDelete={(creditId) => handleDeleteCredit(form.id, creditId)}
                                        onDateChange={(creditId, date) => handleCreditDateChange(form.id, creditId, date)}
                                        onCreditChange={(creditId, credit) => handleCreditAmountChange(form.id, creditId, credit)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </section>
                <div className={'btn_wrap'}>
                    <Link href="/client" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
