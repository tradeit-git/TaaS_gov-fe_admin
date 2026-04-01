'use client'

import Link from "next/link";
import '@/style/contact.scss'
import {useEffect, useState} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {formatDateDot} from "@/utill/format";
import {InquiryRow, INQUIRY_STATUS_OPTIONS} from "@/app/(Auth)/contact/component/ContactPage";

export default function Page() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const id = searchParams.get('id');

    const [detail, setDetail] = useState<InquiryRow | null>(null);
    const [status, setStatus] = useState('');
    const [adminMemo, setAdminMemo] = useState('');
    const [loading, setLoading] = useState(true);

    // 상세 조회
    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            const res = await callApi(`/api/admin/inquiries/${id}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.result && res.data) {
                const d = res.data as InquiryRow;
                setDetail(d);
                setStatus(d.status);
                setAdminMemo(d.adminMemo || '');
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={'문의를 찾을 수 없습니다.'} callback={() => router.push('/contact')}/>);
            }
            setLoading(false);
        })();
    }, [id]);

    // 상태 변경
    const handleStatusChange = async (newStatus: string) => {
        if (!id || newStatus === status) return;
        const res = await callApi(`/api/admin/inquiries/${id}/status`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({status: newStatus}),
        });
        if (res.result && res.data) {
            const d = res.data as InquiryRow;
            setDetail(d);
            setStatus(d.status);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'상태가 변경되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '상태 변경에 실패했습니다.'}/>);
        }
    };

    // 메모 저장
    const handleSaveMemo = async () => {
        if (!id) return;
        const res = await callApi(`/api/admin/inquiries/${id}/memo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({adminMemo}),
        });
        if (res.result && res.data) {
            const d = res.data as InquiryRow;
            setDetail(d);
            setAdminMemo(d.adminMemo || '');
            addPopup(<AlertComponent alertType={'alert'} infoContent={'메모가 저장되었습니다.'}/>);
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '메모 저장에 실패했습니다.'}/>);
        }
    };

    // 저장 (상태 + 메모)
    const handleSave = async () => {
        if (!id || !detail) return;

        // 상태가 변경됐으면 상태 먼저 저장
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

        // 메모 저장
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

    if (loading) return null;
    if (!detail) return null;

    // 전화번호 분리
    const phoneParts = detail.phone ? detail.phone.split('-') : ['', '', ''];
    const mobileParts = detail.mobile ? detail.mobile.split('-') : ['', '', ''];
    const emailParts = detail.email ? detail.email.split('@') : ['', ''];

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
                            <p className={'form_label'}>소속(기업/기관)</p>
                            <input type="text" defaultValue={detail.companyName}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이름</p>
                            <input type="text" defaultValue={detail.name}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>부서</p>
                            <input type="text" defaultValue={detail.department}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>직함</p>
                            <input type="text" defaultValue={detail.position}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>전화번호</p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={phoneParts[0]}/>
                                <input type="text" defaultValue={phoneParts[1]}/>
                                <input type="text" defaultValue={phoneParts[2]}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>휴대전화</p>
                            <div className={'multi_input_wrap'}>
                                <input type="text" defaultValue={mobileParts[0]}/>
                                <input type="text" defaultValue={mobileParts[1]}/>
                                <input type="text" defaultValue={mobileParts[2]}/>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이메일</p>
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
    )
}