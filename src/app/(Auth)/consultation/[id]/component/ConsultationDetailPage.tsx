'use client'

import Link from "next/link";
import {useRouter} from "next/navigation";
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
    const router = useRouter();

    const initialPhone = initialDetail.phone ? initialDetail.phone.split('-') : ['', '', ''];
    const initialEmail = initialDetail.email ? initialDetail.email.split('@') : ['', ''];

    const [companyName, setCompanyName] = useState(initialDetail.companyName ?? '');
    const [name, setName] = useState(initialDetail.name ?? '');
    const [department, setDepartment] = useState(initialDetail.department ?? '');
    const [position, setPosition] = useState(initialDetail.position ?? '');
    const [phone1, setPhone1] = useState(initialPhone[0] ?? '');
    const [phone2, setPhone2] = useState(initialPhone[1] ?? '');
    const [phone3, setPhone3] = useState(initialPhone[2] ?? '');
    const [email1, setEmail1] = useState(initialEmail[0] ?? '');
    const [email2, setEmail2] = useState(initialEmail[1] ?? '');
    const [adConsent, setAdConsent] = useState(String(initialDetail.adConsent));
    const [content, setContent] = useState(initialDetail.content ?? '');
    const [status, setStatus] = useState(initialDetail.status);
    const [adminMemo, setAdminMemo] = useState(initialDetail.adminMemo || '');
    const [createdAt, setCreatedAt] = useState(initialDetail.createdAt);

    const applyDetail = (d: ConsultationRow) => {
        const p = d.phone ? d.phone.split('-') : ['', '', ''];
        const e = d.email ? d.email.split('@') : ['', ''];
        setCompanyName(d.companyName ?? '');
        setName(d.name ?? '');
        setDepartment(d.department ?? '');
        setPosition(d.position ?? '');
        setPhone1(p[0] ?? '');
        setPhone2(p[1] ?? '');
        setPhone3(p[2] ?? '');
        setEmail1(e[0] ?? '');
        setEmail2(e[1] ?? '');
        setAdConsent(String(d.adConsent));
        setContent(d.content ?? '');
        setStatus(d.status);
        setAdminMemo(d.adminMemo || '');
        setCreatedAt(d.createdAt);
    };

    const handleSave = async () => {
        const phone = [phone1, phone2, phone3].filter(v => v.trim()).join('-');
        const email = email1 || email2 ? `${email1}@${email2}` : '';

        const res = await callApi(`/api/admin/consultations/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                companyName,
                name,
                department,
                position,
                phone,
                email,
                adConsent: adConsent === 'true',
                content,
                adminMemo,
                status,
            }),
        });

        if (res.result && res.data) {
            applyDetail(res.data as ConsultationRow);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '저장에 실패했습니다.'}/>);
        }
    };

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
                                <p className={'form_label'}>회사명</p>
                                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>성함</p>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}/>
                            </div>
                        </li>
                        <li className={'form_item form_row'}>
                            <div className={'form_col'}>
                                <p className={'form_label'}>부서</p>
                                <input type="text" value={department} onChange={e => setDepartment(e.target.value)}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>직함</p>
                                <input type="text" value={position} onChange={e => setPosition(e.target.value)}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>연락처</p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)}/>
                                <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)}/>
                                <input type="text" value={phone3} onChange={e => setPhone3(e.target.value)}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이메일</p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" value={email1} onChange={e => setEmail1(e.target.value)}/>
                                <span className={'separator'}>@</span>
                                <input type="text" value={email2} onChange={e => setEmail2(e.target.value)}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>광고수신동의</p>
                            <select value={adConsent} onChange={e => setAdConsent(e.target.value)}>
                                <option value="false">미동의</option>
                                <option value="true">동의</option>
                            </select>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>신청일</p>
                            <input type="text" readOnly value={formatDateDot(createdAt)} className={'readonly_field'}/>
                        </li>
                        <li className={'form_item content'}>
                            <p className={'form_label'}>상담내용</p>
                            <textarea value={content} onChange={e => setContent(e.target.value)}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>처리상태</p>
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
                    {/* 목록으로: 뒤로가기로 되돌아가야 이전 검색/필터(URL 쿼리)가 유지된다 */}
                    <button type="button" className={'cancel_btn'} onClick={() => router.back()}>취소</button>
                    <button className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
