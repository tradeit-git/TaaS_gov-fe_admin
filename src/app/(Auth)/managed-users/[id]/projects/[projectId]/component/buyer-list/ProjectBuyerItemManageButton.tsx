'use client'

import React, {useMemo} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {BuyerType} from "@/types/buyer/buyer";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import {BuyerStepEnum} from "@/types/enums";
import {BuyerStepHistoryActionEnum, BuyerStepHistoryActionType} from "@/types/buyer/buyerStepHistory";
import PopupChangeBuyerStep from "@/app/(Auth)//managed-users/[id]/projects/[projectId]/component/buyer-list/PopupChangeBuyerStep";
import {fetchProject} from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";

export default function ProjectBuyerItemManageButton(props: {
    buyer: BuyerType,
}) {
    const {addPopup} = usePopupStore();
    const {selectedProject, setSelectedProject, setBuyers} = useProjectTrackerStore();

    const ButtonWrap = useMemo(() => {
        const handleDeleteBuyer = () => {
            const fnc = async () => {
                const options: RequestInit = {
                    method: 'DELETE',
                    credentials: 'include',
                };
                const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${props.buyer.id}`, options);
                if (apiRes.result) {
                    addPopup(<AlertComponent alertType={"alert"} infoContent={"삭제 되었습니다"}/>);
                } else {
                    if (apiRes.message) {
                        addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
                    }
                }
                const {project, buyers}  = await fetchProject(selectedProject.id);
                setSelectedProject(project);
                setBuyers(buyers);
            }
            addPopup(<AlertComponent alertType={"confirm"} infoContent={'정말 삭제하시겠습니까?'} callback={fnc}/>)
        }

        const handleSetReleaseBuyer = (isRelease: boolean) => {

            const fnc = async () => {
                const options: RequestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(isRelease)
                };
                const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${props.buyer.id}/setBuyerRelease`, options);
                if (apiRes.result) {
                    addPopup(<AlertComponent alertType={"alert"} infoContent={"변경 되었습니다."}/>);
                } else {
                    if (apiRes.message) {
                        addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
                    }
                }
                const {project, buyers}  = await fetchProject(selectedProject.id);
                setSelectedProject(project);
                setBuyers(buyers);
            }

            if (isRelease) {
                addPopup(<AlertComponent alertType={"confirm"} infoContent={<>List로 등급 상승 시 사용자에게 노출 됩니다.<br/>진행 하시겠습니까?</>}
                                         callback={fnc}/>)
            } else {
                addPopup(<AlertComponent alertType={"confirm"} infoContent={<>DB로 등급 하락 시 이력이 초기화 됩니다.<br/>진행 하시겠습니까?</>}
                                         callback={fnc}/>)
            }
        }

        const handleClickStepButton = (action: BuyerStepHistoryActionType) => {

            if (props.buyer.step === BuyerStepEnum.Enum.DB && action === BuyerStepHistoryActionEnum.Enum.UP) handleSetReleaseBuyer(true);
            else if (props.buyer.step === BuyerStepEnum.Enum.List && action === BuyerStepHistoryActionEnum.Enum.DOWN) handleSetReleaseBuyer(false);
            else {
                addPopup(<PopupChangeBuyerStep projectId={selectedProject.id} buyer={props.buyer} action={action}/>)
            }
        };


        const DeleteButton = (
            <button className={'delete_btn'}>
                <span className={'tracker_icon'} onClick={() => handleDeleteBuyer()}></span>
            </button>
        )
        const StepUpButton = (
            <button className={'up_btn'}>
            <span className={'tracker_icon'} onClick={() => {
                handleClickStepButton(BuyerStepHistoryActionEnum.Enum.UP)
            }}></span>
            </button>
        )
        const StepDownButton = (
            <button className={'down_btn'}>
            <span className={'tracker_icon'} onClick={() => {
                handleClickStepButton(BuyerStepHistoryActionEnum.Enum.DOWN)
            }}></span>
            </button>
        )

        const step = props.buyer.step;

        switch (step) {
            case BuyerStepEnum.Enum.DB :
                return <>{StepUpButton}{DeleteButton}</>
            case BuyerStepEnum.Enum.List :
                return <>{StepUpButton}{StepDownButton}</>
            case BuyerStepEnum.Enum.Lead :
                return <>{StepUpButton}{StepDownButton}</>
            case BuyerStepEnum.Enum.Target :
                return <>{StepUpButton}{StepDownButton}</>
            case BuyerStepEnum.Enum.Client :
                return <>{StepDownButton}</>
        }
    }, [props.buyer,addPopup,selectedProject.id ,setBuyers,setSelectedProject]);

    return <>{ButtonWrap}</>;
}
