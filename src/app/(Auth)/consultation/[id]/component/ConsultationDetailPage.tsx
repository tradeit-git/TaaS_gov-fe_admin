'use client'

import Link from "next/link";
import '@/style/contact.scss'
import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import {ConsultationRow, CONSULTATION_STATUS_OPTIONS} from "@/app/(Auth)/consultation/component/ConsultationPage";

interface Props {
    id: string;
    initialDetail: ConsultationRow;
}

export default function ConsultationDetailPage({id, initialDetail}: Props) {
    const {addPopup} = usePopupStore();
    const [detail, setDetail] = useState<ConsultationRow>(initialDetail);
    const [status, setStatus] = useState(initialDetail.status);
    const [adminMemo, setAdminMemo] = useState(initialDetail.adminMemo || '');

    const handleSave = async () => {
        if (status !== detail.status) {
            const statusRes = await callApi(`/api/admin/consultations/${id}/status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({status}),
            });
            if (!statusRes.result) {
                addPopup(<AlertComponent alertType={'error'} infoContent={statusRes.message || '상태 변경에 실패했습니다.'}/>);
                return;
            }
        }

        const memoRes = await callApi(`/api/admin/consultations/${id}/memo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({adminMemo}),
        });
        if (memoRes.result && memoRes.data) {
            const d = memoRes.data as ConsultationRow;
            setDetail(d);
            setStatus(d.status);
            setAdminMemo(d.adminMemo || '');
            addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={memoRes.message || '저장에 실패했습니다.'}/>);
        }
    };

    const phoneParts = detail.phone ? detail.phone.split('-') : ['', '', ''];
    const emailParts = detail.email ? detail.email.split('@') : ['', ''];

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/consultation'}>상담신청</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>
            <div className={'detail_contents consultation'}>
                <section className={'account_info'}>
                    <ul className={'form_list'}>
                        <li className={'form_item form_row'}>
                            <div className={'form_col'}>
                                <p className={'form_label'}>회사명 <span className={'required'}>(필수)</span></p>
                                <input type="text" defaultValue={detail.companyName ?? ''}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>성함 <span className={'required'}>(필수)</span></p>
                                <input type="text" defaultValue={detail.name ?? ''}/>
                            </div>
                        </li>
                        <li className={'form_item form_row'}>
                            <div className={'form_col'}>
                                <p className={'form_label'}>부서 <span className={'required'}>(필수)</span></p>
                                <input type="text" defaultValue={detail.department ?? ''}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>직함 <span className={'required'}>(필수)</span></p>
                                <input type="text" defaultValue={detail.position ?? ''}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>연락처 <span className={'required'}>(필수)</span></p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={phoneParts[0]}/>
                                <input type="text" defaultValue={phoneParts[1]}/>
                                <input type="text" defaultValue={phoneParts[2]}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이메일 <span className={'required'}>(필수)</span></p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={emailParts[0]}/>
                                <span className={'separator'}>@</span>
                                <input type="text" defaultValue={emailParts[1]}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>광고수신동의</p>
                            <select defaultValue={String(detail.adConsent)}>
                                <option value="false">미동의</option>
                                <option value="true">동의</option>
                            </select>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>신청일</p>
                            <input type="text" readOnly value={formatDateDot(detail.createdAt)} className={'readonly_field'}/>
                        </li>
                        <li className={'form_item content'}>
                            <p className={'form_label'}>상담내용 <span className={'required'}>(필수)</span></p>
                            <textarea defaultValue={detail.content}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>처리상태 <span className={'required'}>(필수)</span></p>
                            <select value={status} onChange={e => setStatus(e.target.value)}>
                                {CONSULTATION_STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </li>
                    </ul>
                    <div className={'form_item memo'}>
                        <p className={'form_label'}>담당자 메모</p>
                        <textarea value={adminMemo} onChange={e => setAdminMemo(e.target.value)}/>
                    </div>
                </section>
                <div className={'btn_wrap'}>
                    <Link href="/consultation" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
