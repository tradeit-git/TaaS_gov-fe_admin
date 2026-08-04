'use client'
import {useMemo, useState} from "react";
import Link from "next/link";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import PopupRegisterNationSearch from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/PopupRegisterNationSearch";
import {BuyerType} from "@/types/buyer/buyer";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import {BuyerManagerType} from "@/types/buyer/buyerManager";
import {regExps} from "@/utill/regExps";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import {ProjectType} from "@/types/project/project";

export default function PopupRegister(props : {
    uId?: string;
    buyer : BuyerType;
    buyerManagers : BuyerManagerType[],
}) {
    const {appConfig} = useAppConfigStore();
    const {addPopup, closePopup} = usePopupStore();
    const {selectedProject , setSelectedProject ,setBuyers,setSelectedBuyerId} = useProjectTrackerStore();


    const fetchProject = async (projectId: number) => {
        if (projectId === 0) {
            setBuyers([]);
        }
        const options: RequestInit = {
            method: 'GET',
            credentials: 'include'
        }
        {  //프로젝트 세팅
            const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${projectId}`, options);
            if (apiRes.result) {
                const apiData = apiRes.data as ProjectType;
                setSelectedProject(apiData);
            }
        }

        {   //프로젝트 바이어 세팅
            const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${projectId}/buyer/list`, options);
            if (apiRes.result) {
                const apiData = apiRes.data as BuyerType[];
                setBuyers(apiData);
            } else {
                setBuyers([]);
                setSelectedBuyerId(0);
            }
        }
    }

    const [buyer, setBuyer] = useState<BuyerType>(props.buyer);

    const companyContacts = useMemo(() => {
        const maxCount = 3;
        let contacts = (buyer?.companyContacts ?? "").split(",").slice(0, maxCount);
        if (contacts.length < 3) {
            const filters: string[] = Array(maxCount - contacts.length).fill("");
            contacts = [...contacts, ...filters];
        }
        return contacts;
    }, [buyer.companyContacts])

    const companyEmails = useMemo(() => {
        const maxCount = 3;
        let emails = (buyer?.companyEmails ?? "").split(",").slice(0, maxCount);
        if (emails.length < 3) {
            const filters: string[] = Array(maxCount - emails.length).fill("");
            emails = [...emails, ...filters];
        }
        return emails;
    }, [buyer.companyEmails])

    const title = buyer.id === 0 ? "바이어 신규 등록" : "바이어 정보 수정";

    const handleStoreBuyerInfo = () => {
        const [valid, updateBuyer, updateBuyerManagers] = validatorBuyer();
        if(valid){
            const saveFunction = async () => {
                const options : RequestInit  = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({buyer:updateBuyer,buyerManagers:updateBuyerManagers})
                };
                const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/store`, options);
                if (apiRes.result) {
                    addPopup(<AlertComponent alertType={"alert"} infoContent={"저장 되었습니다"}/>);
                } else {
                    if (apiRes.message) {
                        addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
                    }
                }

                await fetchProject(selectedProject.id);
            }
            addPopup(<AlertComponent alertType={"confirm"} infoContent={'저장하시겠습니까?'} callback={saveFunction}/>)
        }
    }

    const validatorBuyer = () => {
        const newBuyer = {...buyer};
        newBuyer.companyName = newBuyer.companyName.trim();
        if(newBuyer.companyName === ''){
            addPopup(<AlertComponent alertType={"error"} infoContent={"바이어 기업명을 입력해주세요"}/>);
            return [false, null, null];
        }
        // 필수값 변경: companyName만 필수. 국가·소재지 주소는 선택값 (백엔드 storeBuyerDetail 변경 반영)
        if (newBuyer.geoCode?.code) newBuyer.geoCode.code = newBuyer.geoCode.code.trim();
        newBuyer.googleMapAddress = newBuyer.googleMapAddress?.trim();

        newBuyer.homepage = newBuyer.homepage?.trim();
        if (newBuyer.homepage && !regExps.url().test(newBuyer.homepage)){
            addPopup(<AlertComponent alertType={"error"}
                               infoContent={"바이어 기업의 홈페이지 형식이 올바르지 않습니다.\nex) http or https://example.com"}/>);
            return [false, null, null];
        }
        const companyContacts = (newBuyer.companyContacts ?? "").split(",").map(contact => contact.trim()).filter(contact => contact);
        for (const companyContact of companyContacts){
            if (!(regExps.contact().test(companyContact) || regExps.globalContact().test(companyContact))){
                addPopup(<AlertComponent alertType={"error"}
                                   infoContent={"바이어 기업의 연락처가 올바르지 않습니다."}/>);
                return [false, null, null];
            }
        }
        newBuyer.companyContacts = companyContacts.join(",");
        const companyEmails = (newBuyer.companyEmails ?? "").split(",").map(email => email.trim()).filter(email => email);
        for (const companyEmail of companyEmails){
            if (!regExps.email().test(companyEmail)) {
                addPopup(<AlertComponent alertType={"error"}
                                   infoContent={"바이어 기업의 이메일이 올바르지 않습니다."}/>);
                return [false, null, null];
            }
        }
        newBuyer.companyEmails = companyEmails.join(",");

        newBuyer.keyItems = newBuyer.keyItems.trim();

        newBuyer.facebook = newBuyer.facebook?.trim();
        if(newBuyer.facebook && !regExps.facebookUrl().test(newBuyer.facebook)){
            addPopup(<AlertComponent alertType={"error"}
                               infoContent={"바이어 기업의 페이스북 주소가 올바르지 않습니다."}/>);
            return [false, null, null];
        }

        newBuyer.linkedin = newBuyer.linkedin?.trim();
        if(newBuyer.linkedin && !regExps.linkedinUrl().test(newBuyer.linkedin)){
            addPopup(<AlertComponent alertType={"error"}
                               infoContent={"바이어 기업의 링크드인 주소가 올바르지 않습니다."}/>);
            return [false, null, null];
        }

        newBuyer.youtube = newBuyer.youtube?.trim()
        if(newBuyer.youtube && !regExps.youtubeUrl().test(newBuyer.youtube)){
            addPopup(<AlertComponent alertType={"error"}
                               infoContent={"바이어 기업의 유투브 주소가 올바르지 않습니다."}/>);
            return [false, null, null];
        }

        // 담당자(buyer manager) UI 제거 — 기존 담당자는 그대로 유지(passthrough)
        return [true, newBuyer, props.buyerManagers];
    }


    return (
        <section className={'popupSection buyer_register'}>
        <div className="popupContainer">
                <h3>{title}</h3>
                <div className="scroll_wrap">
                    <div className="required_box">
                        <div className="title_box">필수입력</div>
                        <div className="contents">
                            <div className="input_wrap">
                                <div className="input_box buyer_name">
                                    <p>바이어 기업명 *</p>
                                    <input type="text" placeholder={'바이어 기업명 입력'}
                                           maxLength={50}
                                           value={buyer.companyName ?? ""}
                                           onChange={(e) => {
                                               setBuyer({
                                                   ...buyer,
                                                   companyName: e.target.value.replaceAll("\n", "").trimStart()
                                               })
                                           }}
                                    />
                                </div>
                                <div className="input_box nation">
                                    <p>대륙/세부지역/국가</p>
                                    <PopupRegisterNationSearch buyer={buyer} setBuyer={setBuyer}/>
                                </div>
                            </div>
                            <div className="input_wrap">
                                <div className="input_box">
                                <div className="title_flex">
                                        <p>바이어 기업의 소재지 주소
                                            <small>
                                                / Google의 지도 API와 연동을 위해 Google Map 기준으로 유효한 주소 정보를
                                                입력해주세요.
                                            </small>
                                        </p>
                                        <Link target={'_blank'} href={"https://www.google.com/maps"}>Google Map</Link>
                                    </div>
                                    <input type="text" placeholder={'바이어 기업의 소재지 주소 입력'}
                                           value={buyer.googleMapAddress ?? ""}
                                           onChange={(e) => {
                                               setBuyer({
                                                   ...buyer,
                                                   googleMapAddress: e.target.value.replaceAll("\n", "").trimStart()
                                               })
                                           }}/>
                                </div>
                            </div>
                            <div className="input_wrap">
                                <div className="input_box">
                                    <p>바이어 기업 웹사이트 주소</p>
                                    <input type="text" placeholder={"구글맵에서 유효한 주소값을 입력하셔야 등록할 수 있습니다."} maxLength={200}
                                           value={buyer.homepage ?? ""}
                                           onChange={(e) => {
                                               setBuyer({
                                                   ...buyer,
                                                   homepage: e.target.value.replaceAll("\n", "").trim()
                                               })
                                           }}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="wanted_box">
                        <div className="title_box">선택입력</div>
                        <div className="contents">
                            <div className="input_wrap">
                                <div className="input_box pay">
                                    <p>바이어 기업의 매출액 *</p>
                                    <select
                                        value={buyer.currencyUnit?.isoCode ?? ""}
                                            onChange={(e) => {
                                                const isoCode = e.target.value;
                                                const currencyUnit = appConfig.currencyUnits.find(currencyUnit =>
                                                    currencyUnit.isoCode === isoCode
                                                )
                                                if (currencyUnit) {
                                                    setBuyer({...buyer, currencyUnit: currencyUnit});
                                                } else {
                                                    setBuyer({...buyer, currencyUnit: null});
                                                }

                                            }}>
                                        <option value={""}>선택</option>
                                        {
                                            appConfig.currencyUnits.map(currencyUnit =>
                                                <option key={currencyUnit.isoCode} value={currencyUnit.isoCode}>
                                                    {currencyUnit.isoCode} {currencyUnit.symbol}({currencyUnit.currencyName})
                                                </option>
                                            )
                                        }
                                    </select>
                                    <input className={"pay01"} type="text" placeholder={''} value={buyer.currencyUnit?.symbol ?? ""} disabled/>
                                    <input
                                        className={"pay02"}
                                        type="text" placeholder={'ex) 1,000M'}
                                        maxLength={16}
                                        value={buyer.revenue ?? ""}
                                        onChange={(e) => {
                                            setBuyer({...buyer, revenue: e.target.value.trim()});
                                        }}/>
                                </div>
                            </div>
                            <div className="input_wrap ">
                                <div className="input_box product">
                                    <p>바이어 기업의 주요 품목 및 생산품</p>
                                    <textarea value={buyer.keyItems ?? ""} onChange={(e) => {
                                        setBuyer({...buyer, keyItems: e.target.value});
                                    }}></textarea>
                                </div>
                                <div className="input_box number">
                                    <p>바이어 기업의 대표 전화번호</p>
                                    {
                                        companyContacts.map((contact, seq) =>
                                            <input key={seq} type="text"
                                                   maxLength={20}
                                                   value={contact}
                                                   onChange={(e) => {
                                                       const updateContact = e.target.value.replaceAll(",", "").trimStart();
                                                       const updateContacts = companyContacts.map((contact, idx) => {
                                                           if (seq === idx) {
                                                               return updateContact;
                                                           } else {
                                                               return contact;
                                                           }
                                                       });
                                                       setBuyer({...buyer, companyContacts: updateContacts.join(",")})
                                                   }}/>)
                                    }
                                </div>
                                <div className="input_box email">
                                    <p>바이어 기업의 대표 이메일 주소</p>
                                    {
                                        companyEmails.map((email, seq) =>
                                            <input key={seq} type="text"
                                                   maxLength={40}
                                                   value={email}
                                                   onChange={(e) => {
                                                       const updateEmail = e.target.value.replaceAll(",", "").trim();
                                                       const updateEmails = companyEmails.map((email, idx) => {
                                                           if (seq === idx) {
                                                               return updateEmail;
                                                           } else {
                                                               return email;
                                                           }
                                                       });
                                                       setBuyer({...buyer, companyEmails: updateEmails.join(",")})
                                                   }}/>)
                                    }
                                </div>
                            </div>
                            <div className="input_wrap">
                                <div className="input_box">
                                    <p>바이어 기업의 페이스북 주소</p>
                                    <textarea
                                        maxLength={70}
                                        value={buyer.facebook ?? ""}
                                        onChange={(e) =>
                                            setBuyer({...buyer, facebook: e.target.value.trim()})}/>
                                </div>
                                <div className="input_box">
                                    <p>바이어 기업의 링크드인 주소</p>
                                    <textarea
                                        maxLength={70}
                                        value={buyer.linkedin ?? ""}
                                        onChange={(e) =>
                                            setBuyer({...buyer, linkedin: e.target.value.trim()})}/>
                                </div>
                                <div className="input_box">
                                    <p>바이어 기업의 유튜브 주소</p>
                                    <textarea
                                        maxLength={70}
                                        value={buyer.youtube ?? ""}
                                        onChange={(e) =>
                                            setBuyer({...buyer, youtube: e.target.value.trim()})}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="popup_btn_wrap">
                    <button className={'close_btn'} onClick={()=>{closePopup(props.uId ?? "")}}>닫기</button>
                    <button className={'register_btn'} onClick={()=> {
                        handleStoreBuyerInfo();
                    }}>등록</button>
                </div>
            </div>
        </section>
    )
}