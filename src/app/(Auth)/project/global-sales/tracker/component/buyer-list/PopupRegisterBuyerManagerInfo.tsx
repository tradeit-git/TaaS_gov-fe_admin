import {
    BuyerManagerRoleEnum,
    BuyerManagerRoleType,
    BuyerManagerSchema,
    BuyerManagerType
} from "@/types/buyer/buyerManager";
import {Dispatch, useMemo} from "react";

export default function PopupRegisterBuyerManagerInfo(props: {
    index: number;
    buyerManagers: Record<number,BuyerManagerType>
    setBuyerManagers: Dispatch<Record<number,BuyerManagerType>>
}) {

    const buyerMangerCard = useMemo(() => {
        if(props.buyerManagers.hasOwnProperty(props.index)) return  props.buyerManagers[props.index];
        else return BuyerManagerSchema.parse({});
    }, [props.index, props.buyerManagers])

    const update = () => {
        const updateManagers = {...props.buyerManagers};
        updateManagers[props.index] = buyerMangerCard;
        props.setBuyerManagers(updateManagers);
    }
    return (
        <>
            <div className="input_wrap">

                <div className="input_box manager">
                    <p>구분</p>
                    <select value={buyerMangerCard.role ?? BuyerManagerRoleEnum.Enum.Admin}
                            onChange={(e) => {
                                buyerMangerCard.role = e.target.value as BuyerManagerRoleType;
                                update();
                            }}>
                        {
                            BuyerManagerRoleEnum.options.map(role =>
                                <option key={role} value={role}>{role.toLowerCase()}</option>)
                        }
                    </select>
                </div>
                <div className="input_box">
                    <p>이름</p>
                    <input
                        type="text"
                        maxLength={20}
                        value={buyerMangerCard.name ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.name = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
                <div className="input_box">
                    <p>직책 및 지위</p>
                    <input
                        type="text"
                        maxLength={30}
                        value={buyerMangerCard.position ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.position = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
                <div className="input_box">
                    <p>유선 연락처</p>
                    <input
                        type="text"
                        maxLength={20}
                        value={buyerMangerCard.contact ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.contact = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
            </div>
            <div className="input_wrap">
                <div className="input_box">
                    <p>휴대전화번호</p>
                    <input type="text"
                           maxLength={20}
                           value={buyerMangerCard.phone ?? ""}
                           onChange={(e) => {
                               buyerMangerCard.phone = e.target.value.trimStart();
                               update();
                           }}/>
                </div>
                <div className="input_box">
                    <p>이메일</p>
                    <input
                        type="text"
                        maxLength={40}
                        value={buyerMangerCard.email ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.email = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
            </div>
            <div className="input_wrap">
                <div className="input_box">
                    <p>페이스북 주소</p>
                    <textarea
                        maxLength={70}
                        value={buyerMangerCard.facebook ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.facebook = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
                <div className="input_box">
                    <p>트위터 주소</p>
                    <textarea
                        maxLength={70}
                        value={buyerMangerCard.twitter ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.twitter = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
                <div className="input_box">
                    <p>링크드인 주소</p>
                    <textarea
                        maxLength={70}
                        value={buyerMangerCard.linkedin ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.linkedin = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
                <div className="input_box">
                    <p>인스타그램 주소</p>
                    <textarea
                        maxLength={70}
                        value={buyerMangerCard.instagram ?? ""}
                        onChange={(e) => {
                            buyerMangerCard.instagram = e.target.value.trimStart();
                            update();
                        }}/>
                </div>
            </div>
        </>
    )
}