import {
    BuyerStepHistoryActionEnum,
    BuyerStepHistoryActionType,
    BuyerStepHistoryType
} from "@/types/buyer/buyerStepHistory";
import {BuyerType} from "@/types/buyer/buyer";
import {BuyerStepEnum, BuyerStepType} from "@/types/enums";

export default function BuyerInfoCompany(props: {
    buyer: BuyerType,
    buyerStepHistories: BuyerStepHistoryType[],
}) {

    const steps = BuyerStepEnum.options;
    const getLevel = (step: BuyerStepType) => {
        return steps.indexOf(step);
    }
    const getAction = (action: BuyerStepHistoryActionType) => {
        return action === BuyerStepHistoryActionEnum.Enum.UP ? "상승" : "하락";
    }

    return (
        <div className="BuyerInfo_history buyer_info_company ">
            <ul>
                {
                    props.buyerStepHistories.map((stepHistory,index) => (
                        <li key={index} className={`level_${getLevel(stepHistory.afterStep)}`}>
                            <p className={'title'}>{stepHistory.beforeStep} 에서 {stepHistory.afterStep} (으)로 인사이트 등급
                                {getAction(stepHistory.action)}</p>
                            <p className={'reason'}>{stepHistory.comment}</p>
                            <p className={'date'}>{stepHistory.createdAt?.replaceAll("T", " ")}</p>
                        </li>
                    ))
                }
                {
                    props.buyer.id !== 0 && props.buyer.step !== BuyerStepEnum.Enum.DB && (
                        <li className={'level_1'}>
                            <p className={'title'}>List 등록</p>
                            <p className={'reason'}></p>
                            <p className={'date'}>{props.buyer.createdAt?.replaceAll("T", " ")}</p>
                        </li>
                    )
                }
            </ul>
        </div>
    )
}
    
