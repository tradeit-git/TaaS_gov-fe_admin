'use client'

import React, {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {BuyerStepEnum} from "@/types/enums";
import {BuyerType} from "@/types/buyer/buyer";
import {
    BuyerStepHistoryActionEnum,
    BuyerStepHistoryActionType,
    BuyerStepHistorySchema
} from "@/types/buyer/buyerStepHistory";
import callApi from "@/utill/apiRequest";
import {fetchProject} from "@/app/(Auth)/project/global-sales/tracker/component/PageComponent";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";

export default function PopupChangeBuyerStep (props: {
    uId?: string;
    projectId : number
    buyer : BuyerType,
    action : BuyerStepHistoryActionType,
}) {
    const {addPopup, closePopup} = usePopupStore();
    const {setSelectedProject, setBuyers} = useProjectTrackerStore()
    const [reason, setReason] = useState(""); // textarea 값 상태 관리

    const handleUpdateBuyerStep = async () => {
        if (reason.trim() === "") {
            addPopup(<AlertComponent alertType={'error'} infoContent={'변경 이유를 입력해주세요.'}/>);
            return ;
        }

        const beforeStepIdx = BuyerStepEnum.options.indexOf(props.buyer.step)
        const afterStepIdx = props.action === BuyerStepHistoryActionEnum.Enum.UP ?
            beforeStepIdx + 1 : beforeStepIdx - 1;

        const buyerStepHistory = BuyerStepHistorySchema.parse({});
        buyerStepHistory.buyer = props.buyer;
        buyerStepHistory.beforeStep = props.buyer.step;
        buyerStepHistory.action = props.action;
        buyerStepHistory.afterStep = BuyerStepEnum._def.values[afterStepIdx];
        buyerStepHistory.comment = reason.trim();

        const options: RequestInit = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(buyerStepHistory)
        }
        const apiRes = await callApi(`/api/admin/project/${props.projectId}/buyer/${props.buyer.id}/updateBuyerStep`, options);
        if (apiRes.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'변경되었습니다.'}/>);
            closePopup(props.uId ?? "");

            const {project,buyers} = await fetchProject(props.projectId);
            setSelectedProject(project);
            setBuyers(buyers);

        }else{
            if (apiRes.message) {
                addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
            }
        }

    };


    return (
        <section className="popupSection popup_reason">
            <div className={'popupContainer'}>
                <h3>등급 변경 이유</h3>
                <textarea
                    name=""
                    id=""
                    placeholder={'바이어 등급 변경 이유를 간단히 작성해주세요.'}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
                <div className="popup_btn_wrap">
                    <button type={'button'} className={'close_btn'} onClick={() => {closePopup(props.uId ?? "")}}>취소</button>
                    <button type={'button'} className={'create_btn'} onClick={()=> handleUpdateBuyerStep()}>변경</button>
                </div>

            </div>
        </section>
    )
}