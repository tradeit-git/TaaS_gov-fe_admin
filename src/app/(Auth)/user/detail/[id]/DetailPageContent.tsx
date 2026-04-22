'use client';
import Link from "next/link";
import React, {useMemo, useState} from "react";
import {regExps} from "@/utill/regExps";
import {STATUS_LABELS, formatDateTime, formatDateDot} from "@/utill/format";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {UserType} from "@/types/user/user";

export default function DetailPageContent({initialUser}: { initialUser: UserType }) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const router = useRouter();

    const user = initialUser;

    const validatePassword = useMemo(() => regExps.password().test(password), [password]);
    const isPasswordMatch = useMemo(() => password !== "" && password === confirmPassword, [password, confirmPassword]);

    const handleUpdate = async () => {
        if (password && (!validatePassword || !isPasswordMatch)) {
            alert("비밀번호 유효성 및 일치 여부를 확인해주세요.");
            return;
        }

        if (!confirm("회원 정보를 수정하시겠습니까?")) return;

        const updateRequest = {
            user: {...user, id: Number(user.id)},
            newPassword: password || null,
        };

        try {
            const res = await callApi(`/api/admin/users/${user.id}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updateRequest),
            });

            if (res.result) {
                alert("정보가 성공적으로 수정되었습니다.");
                router.push('/user');
            } else {
                alert(res.message || "수정에 실패했습니다.");
            }
        } catch (error) {
            console.error("Update Error:", error);
            alert("통신 중 오류가 발생했습니다.");
        }
    };

    const credit = user.creditSummary;

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/user'}>가입계정</Link></li>
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
                            <p className={'form_label'}>상태</p>
                            <input type="text" readOnly defaultValue={STATUS_LABELS[user.status] || "활성화"}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이메일(ID)</p>
                            <input type="text" readOnly defaultValue={user.loginId}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>비밀번호 재설정</p>
                            <div className={'input_wrap'}>
                                <div
                                    className={`input_field ${password ? (validatePassword ? 'success' : 'error') : ''}`}>
                                    <input
                                        type="password"
                                        placeholder="영문 + 숫자 8자 이상, 20자 이하"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {password && (
                                        <span className={`status_msg ${validatePassword ? 'success' : 'error'}`}>
                                            {validatePassword ? '유효한 비밀번호입니다' : '형식을 확인해주세요'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>비밀번호 확인</p>
                            <div className={'input_wrap'}>
                                <div
                                    className={`input_field ${confirmPassword ? (isPasswordMatch ? 'success' : 'error') : ''}`}>
                                    <input
                                        type="password"
                                        placeholder="비밀번호 재입력"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    {confirmPassword && (
                                        <span className={`status_msg ${isPasswordMatch ? 'success' : 'error'}`}>
                                            {isPasswordMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>회사명</p>
                            <input type="text" readOnly defaultValue={user.companyName || '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이름</p>
                            <input type="text" readOnly defaultValue={user.name}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>전화번호</p>
                            <input type="text" readOnly defaultValue={user.contact || '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>크레딧 현황</p>
                            <input
                                type="text"
                                readOnly
                                defaultValue={credit
                                    ? `전체 ${credit.granted.toLocaleString()} / 사용 ${credit.used.toLocaleString()} / 소멸 ${credit.expired.toLocaleString()} / 잔여 ${credit.balance.toLocaleString()}`
                                    : '-'}
                            />
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>최근접속일</p>
                            <input type="text" readOnly
                                   defaultValue={user.lastLoginAt ? formatDateDot(user.lastLoginAt) : '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>회원가입일시</p>
                            <input type="text" readOnly defaultValue={formatDateTime(user.createdAt)}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>회원탈퇴일시</p>
                            <input type="text" readOnly
                                   defaultValue={user.deletedAt ? formatDateTime(user.deletedAt) : '-'}/>
                        </li>
                    </ul>
                </section>
                <div className={'btn_wrap'}>
                    <Link href={'/user'} className={'cancel_btn'}>목록으로</Link>
                    <button type={'button'} className={'save_btn'} onClick={handleUpdate}>정보수정</button>
                </div>
            </div>
        </div>
    );
}
