'use client';

import Link from "next/link";
import {useState} from "react";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {UserType} from "@/types/user/user";

interface Props {
    user: UserType;
}

export default function AccountInfoSection({user}: Props) {
    const {addPopup} = usePopupStore();
    const [password, setPassword] = useState(user.password || '');

    const handleSave = () => {
        // TODO: API 연동
        addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
    };

    return (
        <div className={'company_detail_left'}>
            <div className={'section_title'}>
                <span className={'admin_icon arrow_icon'}/>
                계정정보
            </div>

            <ul className={'form_list'}>
                <li className={'form_item'}>
                    <p className={'form_label'}>제휴가입</p>
                    <input type="text" readOnly disabled value={'-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>아이디(e-mail)</p>
                    <input type="text" readOnly disabled value={user.loginId}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>패스워드</p>
                    <input type="text" value={password} onChange={e => setPassword(e.target.value)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>이름</p>
                    <input type="text" readOnly disabled value={user.name}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>전화번호</p>
                    <input type="text" readOnly disabled value={user.contact}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>회사명</p>
                    <input type="text" readOnly disabled value={user.companyName}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>부서</p>
                    <input type="text" readOnly disabled value={user.department || '-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>직함</p>
                    <input type="text" readOnly disabled value={user.position || '-'}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>회원가입일</p>
                    <input type="text" readOnly disabled value={formatDateDot(user.createdAt)}/>
                </li>
                <li className={'form_item'}>
                    <p className={'form_label'}>최근접속일</p>
                    <input type="text" readOnly disabled value={user.lastLoginAt ? formatDateDot(user.lastLoginAt) : '-'}/>
                </li>
            </ul>

            <div className={'btn_wrap'}>
                <Link href="/users" className={'cancel_btn'}>취소</Link>
                <button className={'save_btn'} onClick={handleSave}>저장</button>
            </div>
        </div>
    );
}
