'use client'

import React from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import PopupRegister from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/PopupRegister";
import {BuyerType} from "@/types/buyer/buyer";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import {BuyerStepEnum} from "@/types/enums";
import {BuyerManagerType} from "@/types/buyer/buyerManager";
import ProjectBuyerItemManageButton
    from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/ProjectBuyerItemManageButton";

type PropsType = {
    total: number;  // 추가! 전체 바이어 수
    index: number;  // 추가! 현재 index
    buyer: BuyerType;
}

export default function ProjectBuyerItem({
                                             total,
                                             index,
                                             buyer,
                                         }: PropsType) {
    const {addPopup} = usePopupStore();
    const {selectedProject, buyers, setBuyers, selectedBuyerId, setSelectedBuyerId} = useProjectTrackerStore();

    const handleSwitchBookmark = async () => {
        const buyerId = buyer.id;
        const value = !buyer.isBookmark;
        const options: RequestInit = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(!buyer.isBookmark)
        }
        const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${buyerId}/setBookmark`, options);
        if (apiRes.result) {
            setBuyers([...buyers.map(buyer => {
                if (buyer.id === buyerId) buyer.isBookmark = value;
                return buyer;
            })])
        }
    }
    const handleSwitchPublic = async () => {
        const buyerId = buyer.id;
        const value = !buyer.isPublic;
        const options: RequestInit = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(value)
        }
        const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${buyerId}/setPublic`, options);
        if (apiRes.result) {
            setBuyers([...buyers.map(buyer => {
                if (buyer.id === buyerId) buyer.isPublic = value;
                return buyer;
            })])
        }
    }

    return (
        <>
            <tr
                className={buyer.id === selectedBuyerId ? 'selected-row' : ''}
                onClick={() => {
                    setSelectedBuyerId(buyer.id)
                }}
                style={{cursor: 'pointer'}}>
                <td>{total - index}</td>
                <td>
                    {
                        buyer.step !== BuyerStepEnum.Enum.DB
                            ? <span className={`icon_admin icon_toggle ${buyer.isPublic ? 'on' : 'off'}`}
                                    onClick={handleSwitchPublic}/>
                            : "-"
                    }

                </td>
                <td>
                    {
                        buyer.step !== BuyerStepEnum.Enum.DB
                            ? <span className={`tracker_icon star ${buyer.isBookmark ? 'on' : ''}`}
                                    onClick={handleSwitchBookmark}/>
                            : "-"
                    }
                </td>
                <td>
                    {buyer.step}
                </td>
                <td className={'text_left'}>
                    <span className={'buyer_name'}>{buyer.companyName}</span>
                    <button>
                        <span className={'tracker_icon buyer_name_icon'} onClick={async () => {
                            const options: RequestInit = {
                                method: 'GET',
                                credentials: 'include'
                            }
                            const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${buyer.id}/detail`, options);
                            if (apiRes.result) {
                                const apiData = apiRes.data as {
                                    buyer: BuyerType,
                                    buyerManagers: BuyerManagerType[],
                                };
                                addPopup(<PopupRegister buyer={apiData.buyer}
                                                        buyerManagers={[...apiData.buyerManagers]}/>)

                            }
                        }}></span>
                    </button>
                </td>
                <td>{buyer.createdAt.substring(0, 10).replaceAll("-", ".")}</td>
                <td>
                    <ProjectBuyerItemManageButton  buyer={buyer}/>
                </td>
            </tr>
        </>
    );
}
