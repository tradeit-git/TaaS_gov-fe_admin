'use client'

import Link from "next/link";
import '@/style/contact.scss'
import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import {InquiryRow, INQUIRY_STATUS_OPTIONS, TYPE_MAP} from "@/app/(Auth)/contact/component/ContactPage";

interface Props {
    id: string;
    initialDetail: InquiryRow;
}

export default function ContactDetailPage({id, initialDetail}: Props) {
    const {addPopup} = usePopupStore();
    const [detail, setDetail] = useState<InquiryRow>(initialDetail);
    const [status, setStatus] = useState(initialDetail.status);
    const [adminMemo, setAdminMemo] = useState(initialDetail.adminMemo || '');

    const handleSave = async () => {
        if (status !== detail.status) {
            const statusRes = await callApi(`/api/admin/inquiries/${id}/status`, {
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

        const memoRes = await callApi(`/api/admin/inquiries/${id}/memo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({adminMemo}),
        });
        if (memoRes.result && memoRes.data) {
            const d = memoRes.data as InquiryRow;
            setDetail(d);
            setStatus(d.status);
            setAdminMemo(d.adminMemo || '');
            addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={memoRes.message || '저장에 실패했습니다.'}/>);
        }
    };

    const phoneParts = detail.phone ? detail.phone.split('-') : ['', '', ''];
    const mobileParts = detail.mobile ? detail.mobile.split('-') : ['', '', ''];
    const emailParts = detail.email ? detail.email.split('@') : ['', ''];

    // CRM 문의: 연락처(전화/이메일)는 회신 희망값
    const isCrm = detail.inquiryType === 'CRM_1ON1';

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/contact'}>도입문의</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>
            <div className={'detail_contents contact'}>
                <section className={'account_info'}>
                    <ul className={'form_list'}>
                        <li className={'form_item'}>
                            <p className={'form_label'}>유형</p>
                            <input type="text" readOnly value={TYPE_MAP[detail.inquiryType] || detail.inquiryType}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>
                                소속(기업/기관)
                                {detail.inquiryType === 'CRM_1ON1' && detail.userId && (
                                    <a className={'user_link'} href={`/admin/users/${detail.userId}`} target="_blank" rel="noopener noreferrer">
                                        회원 상세 (#{detail.userId})
                                    </a>
                                )}
                            </p>
                            <input type="text" defaultValue={detail.companyName ?? ''}/>
                        </li>
                        <li className={'form_item form_row'}>
                            <div className={'form_col'}>
                                <p className={'form_label'}>이름</p>
                                <input type="text" defaultValue={detail.name ?? ''}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>부서</p>
                                <input type="text" defaultValue={detail.department ?? ''}/>
                            </div>
                            <div className={'form_col'}>
                                <p className={'form_label'}>직함</p>
                                <input type="text" defaultValue={detail.position ?? ''}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>
                                전화번호
                                {isCrm && <span className={'label_note'}>(희망)</span>}
                            </p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={phoneParts[0]}/>
                                <input type="text" defaultValue={phoneParts[1]}/>
                                <input type="text" defaultValue={phoneParts[2]}/>
                            </div>
                        </li>
                        {!isCrm && (
                            <li className={'form_item'}>
                                <p className={'form_label'}>휴대전화</p>
                                <div className={'multi_input_wrap'}>
                                    <input type="text" defaultValue={mobileParts[0]}/>
                                    <input type="text" defaultValue={mobileParts[1]}/>
                                    <input type="text" defaultValue={mobileParts[2]}/>
                                </div>
                            </li>
                        )}
                        <li className={'form_item'}>
                            <p className={'form_label'}>
                                이메일
                                {isCrm && <span className={'label_note'}>(희망)</span>}
                            </p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={emailParts[0]}/>
                                <span className={'separator'}>@</span>
                                <input type="text" defaultValue={emailParts[1]}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>접수일</p>
                            <input type="text" readOnly value={formatDateDot(detail.createdAt)}/>
                        </li>
                        {detail.title && (
                            <li className={'form_item'}>
                                <p className={'form_label'}>제목</p>
                                <input type="text" readOnly value={detail.title}/>
                            </li>
                        )}
                        <li className={'form_item'}>
                            <p className={'form_label'}>문의내용</p>
                            <textarea defaultValue={detail.content}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>상태</p>
                            <select value={status} onChange={e => setStatus(e.target.value)}>
                                {INQUIRY_STATUS_OPTIONS.map(opt => (
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
                    <Link href="/contact" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
