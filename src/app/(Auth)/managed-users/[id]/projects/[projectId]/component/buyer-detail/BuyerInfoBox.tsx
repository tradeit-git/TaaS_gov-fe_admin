'use client';
import {useEffect, useState} from 'react';
import BuyerInfoCompany from '@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-detail/BuyerInfoCompany'
import BuyerInfoPerson from '@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-detail/BuyerInfoPerson'
import BuyerInfoHistory from '@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-detail/BuyerInfoHistory'
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {BuyerSchema, BuyerType} from "@/types/buyer/buyer";
import {BuyerManagerType} from "@/types/buyer/buyerManager";
import {BuyerStepHistoryType} from "@/types/buyer/buyerStepHistory";
import {fetchBuyerDetail} from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";

export default function BuyerInfoBox() {
    const {selectedProject, selectedBuyerId, buyers} = useProjectTrackerStore();

    const [buyer, setBuyer] = useState<BuyerType>(BuyerSchema.parse({}));
    const [buyerManagers, setBuyerManagers] = useState<BuyerManagerType[]>([]);
    const [buyerStepHistories, setBuyerStepHistories] = useState<BuyerStepHistoryType[]>([]);

    useEffect(() => {
        const findBuyer = buyers.find(buyer => buyer.id === selectedBuyerId);
        fetchBuyerDetail(selectedProject.id,findBuyer?.id ?? 0).then(res => {
            const {buyer,buyerManagers,buyerStepHistories} = res;
            setBuyer(buyer);
            setBuyerManagers(buyerManagers);
            setBuyerStepHistories(buyerStepHistories);
        });
    }, [selectedProject.id, buyers, selectedBuyerId]);

    const [activeTab, setActiveTab] = useState(0);

    if (buyers.length === 0) {
        return <></>
    }

    return (
        <section className={'buyer-info-box'}>
            <ul className={'buyer-info-tab'}>
                <li className={activeTab === 0 ? 'on' : ''} onClick={() => setActiveTab(0)}>company</li>
                <li className={activeTab === 1 ? 'on' : ''} onClick={() => setActiveTab(1)}>person</li>
                <li className={activeTab === 2 ? 'on' : ''} onClick={() => setActiveTab(2)}>history</li>
            </ul>
            <ul className={'buyer_info_content'}>
                <li className={activeTab === 0 ? 'on' : ''}>
                    <BuyerInfoCompany buyer={buyer}/>
                </li>
                <li className={activeTab === 1 ? 'on' : ''}>
                    <BuyerInfoPerson buyerManagers={buyerManagers}/>
                </li>
                <li className={activeTab === 2 ? 'on' : ''}>
                    <BuyerInfoHistory buyer={buyer} buyerStepHistories={buyerStepHistories}/>
                </li>
            </ul>
        </section>
    )
}