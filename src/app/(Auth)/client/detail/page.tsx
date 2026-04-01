'use client';

import Link from "next/link";
import { useState } from "react";
import CreditTable from "@/app/(Auth)/client/detail/component/CreditTable";

type DuplicateStatus = 'none' | 'success' | 'error';

interface FormItem {
    label: string;
    required?: boolean;
    hasButton?: boolean;
    readOnly?: boolean;
    value: string;
    fieldKey?: string;
}

const formList: FormItem[] = [
    { label: '고객사명', required: true, hasButton: true, value: '트레이드잇', fieldKey: 'companyName' },
    { label: '사업자번호', required: true, hasButton: true, value: '000-00-00000', fieldKey: 'businessNumber' },
    { label: '아이디(e-mail)', required: true, readOnly: true, value: 'asdfasdfasfd@gmail.com' },
    { label: '패스워드', required: true, value: 'tradeit21@' },
    { label: '계정생성일', readOnly: true, value: '2026.04.01' },
];

export default function Page() {
    const [duplicateStatus, setDuplicateStatus] = useState<Record<string, DuplicateStatus>>({
        companyName: 'none',
        businessNumber: 'none',
    });

    const [creditForms, setCreditForms] = useState<number[]>([1]);

    const handleAddCreditForm = () => {
        setCreditForms(prev => [...prev, prev.length + 1]);
    };

    const handleDuplicateCheck = (fieldKey: string) => {
        // 임시 로직: 고객사명은 중복(에러), 사업자번호는 중복 아님(성공)
        if (fieldKey === 'companyName') {
            setDuplicateStatus(prev => ({ ...prev, [fieldKey]: 'error' }));
        } else if (fieldKey === 'businessNumber') {
            setDuplicateStatus(prev => ({ ...prev, [fieldKey]: 'success' }));
        }
    };

    const getStatusMessage = (fieldKey: string) => {
        const status = duplicateStatus[fieldKey];
        if (status === 'success') return '중복 확인이 완료되었습니다.';
        if (status === 'error') return '이미 등록한 고객사 입니다.';
        return '';
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
                        {formList.map((item, index) => {
                            const fieldKey = item.fieldKey || '';
                            const status = duplicateStatus[fieldKey] || 'none';
                            const statusMessage = getStatusMessage(fieldKey);

                            return (
                                <li key={index} className={'form_item'}>
                                    <p className={'form_label'}>
                                        {item.label} {item.required && <span>*</span>}
                                    </p>
                                    {item.hasButton ? (
                                        <div className={'input_wrap'}>
                                            <div className={`input_field ${status}`}>
                                                <input type="text" defaultValue={item.value}/>
                                                {statusMessage && (
                                                    <span className={`status_msg ${status}`}>{statusMessage}</span>
                                                )}
                                            </div>
                                            <button
                                                type={'button'}
                                                className={status === 'success' ? 'disabled' : ''}
                                                disabled={status === 'success'}
                                                onClick={() => handleDuplicateCheck(fieldKey)}
                                            >
                                                중복체크
                                            </button>
                                        </div>
                                    ) : (
                                        <input type="text" readOnly={item.readOnly} defaultValue={item.value}/>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
                <section className={'credit_setting'}>
                    <div className={'title'}>
                        <div className={'title_left'}>
                            <span className={'admin_icon'}/>
                            크레딧 설정
                        </div>
                        <button type={'button'} className={'add_btn'} onClick={handleAddCreditForm}>
                            <span className={'admin_icon'}/> 추가
                        </button>
                    {/*    */}
                    </div>
                    {creditForms.map((formId) => (
                        <div key={formId} className={'add_form'}>
                            <div className={'top'}>
                                <div className={'left'}>
                                    <p>서비스 플랜</p>
                                    <input type="text" placeholder={'ex) 플랜명 / 月 00만'}/>
                                </div>
                                <div className={'right'}>
                                    <p>운영기간</p>
                                    <input type="date"/>
                                    <input type="date"/>
                                    <input type="text"/>
                                    개월
                                </div>
                            </div>
                            <div className={'bottom'}>
                                <p>크레딧 설정</p>
                                <CreditTable/>
                            </div>
                        </div>
                    ))}
                </section>
                <div className={'btn_wrap'}>
                    <Link href="/" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'}>저장</button>
                </div>
            </div>
        </div>
    )
}