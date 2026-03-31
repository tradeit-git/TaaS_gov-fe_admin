'use client'
import Image from 'next/image'
import {usePopupStore} from "@/stores/common/popupStore";
import React, {ReactNode, useMemo} from "react";
import {APP_URL} from "@/lib/routes";

export type AlertType = 'alert' | 'confirm' | 'error'

export default function AlertComponent(props: {
    uId?: string;
    alertType: AlertType;
    infoContent: string | ReactNode;
    callback?: () => void
}) {
    const {callback, uId} = props;
    const {closePopup} = usePopupStore();

    const btnBox = useMemo(() => {
        if (callback) {
            return <>
                <button className={'cancel_btn'} onClick={() => closePopup(uId ?? "")}>취소</button>
                <button className={'ok_btn'} type={'button'} onClick={async () => {
                    closePopup(uId ?? "")
                    callback()
                }}>확인
                </button>
            </>
        } else {
            return <button className={'ok_btn'} type={'submit'} onClick={() => closePopup(uId ?? "")}>확인</button>
        }

    }, [callback, uId, closePopup])

    return (
        <div className={'alertSection'}>
            <section className={`alert_popup ${props.alertType}`}>
                <Image width={55} height={55}
                       src={`${APP_URL}/static/img/${props.alertType}_icon.svg`}
                       alt={`popup_${props.alertType}_icon`}/>
                <p>{props.infoContent}</p>
                <div className={'btn_box'}>
                    {btnBox}
                </div>
            </section>
        </div>
    )
}