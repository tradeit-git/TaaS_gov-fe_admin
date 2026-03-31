import {usePopupStore} from "@/stores/common/popupStore";
import React, {useMemo, useState} from "react";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

interface PassWordPopupProps {
    uId?: string;
}
export default function PassWordPopup({ uId }: PassWordPopupProps) {
    const {addPopup, closePopup} = usePopupStore();

    const [currentPassword, setCurrentPassword] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const validateConfirmPassword = useMemo(() => {
        return newPassword && newPassword === confirmNewPassword
    }, [newPassword, confirmNewPassword])

    const handleChangePassword = async () => {

        if(!currentPassword){
            addPopup(<AlertComponent alertType={"alert"} infoContent={"현재 비밀번호를 입력해 주세요."}/>);
            return;
        }

        if(!newPassword){
            addPopup(<AlertComponent alertType={"alert"} infoContent={"비밀번호를 입력해 주세요."}/>);
            return;
        }
        if(!validateConfirmPassword){
            addPopup(<AlertComponent alertType={"alert"} infoContent={"비밀번호가 일치하지 않습니다"}/>);
            return;
        }

        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({currentPassword ,newPassword})
        }

        const apiRes = await callApi(`/api/admin/my/changePassword`, options);
        if (apiRes.result) {
            closePopup(uId ?? '')
            addPopup(<AlertComponent alertType={"confirm"} infoContent={"변경 되었습니다"}/>);
        } else {
            if (apiRes.message) {
                addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
            }
        }
    }


    return (
        <div className={'popupSection PassWordPopup'}>
            <div className={'popupContainer'}>
                <h4 className="popup_title">비밀번호 변경</h4>
                <table>
                    <tbody>
                    <tr>
                        <th>현재 비밀번호 *</th>
                        <td>
                            <input
                                type="password"
                                autoComplete={"new-password"}
                                value={currentPassword}

                                onChange={(e) => setCurrentPassword(e.target.value.trim())}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>새로운 비밀번호 *</th>
                        <td>
                            <input
                                type="password"
                                autoComplete={"new-password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value.trim())}
                            />
                        </td>
                    </tr>
                    <tr>
                        <th>비밀번호 확인 *</th>
                        <td>
                            <input
                                type="password"
                                autoComplete={"new-password"}
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value.trim())}
                            />
                            <span className={`info ${validateConfirmPassword ? "on" : ""}`}>
                                <span className={'bm_icon check'}/>
                                비밀번호 일치
                            </span>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <div className={'btn_box'}>
                    <button className={'white_btn'} onClick={() => closePopup(uId ?? '')}>닫기</button>
                    <button className={'main_btn'} disabled={!validateConfirmPassword}
                            onClick={handleChangePassword}>변경
                    </button>
                </div>
            </div>
        </div>
    )
}