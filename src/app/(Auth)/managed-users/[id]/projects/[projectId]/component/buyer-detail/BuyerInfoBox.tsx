'use client';
import {useEffect, useState} from 'react';
import BuyerInfoCompany from '@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-detail/BuyerInfoCompany'
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {BuyerSchema, BuyerType} from "@/types/buyer/buyer";
import {fetchBuyerDetail} from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";

export default function BuyerInfoBox() {
    const {selectedProject, selectedBuyerId, buyers, infoCollapsed, setInfoCollapsed} = useProjectTrackerStore();

    const [buyer, setBuyer] = useState<BuyerType>(BuyerSchema.parse({}));

    useEffect(() => {
        const findBuyer = buyers.find(buyer => buyer.id === selectedBuyerId);
        fetchBuyerDetail(selectedProject.id, findBuyer?.id ?? 0).then(res => {
            setBuyer(res.buyer);
        });
    }, [selectedProject.id, buyers, selectedBuyerId]);

    return (
        <section className={`buyer-info-box${infoCollapsed ? ' collapsed' : ''}`}>
            <div className={'buyer-info-tab'}>
                <span className={'tab on'}>company</span>
                <button type="button" className={'info_collapse'} onClick={() => setInfoCollapsed(!infoCollapsed)}>
                    {infoCollapsed ? '펼치기 ▾' : '접기 ▴'}
                </button>
            </div>
            {!infoCollapsed && (
                <ul className={'buyer_info_content'}>
                    <li className={'on'}>
                        <BuyerInfoCompany buyer={buyer}/>
                    </li>
                </ul>
            )}
        </section>
    )
}
