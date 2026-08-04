import Image from "next/image";
import Link from "next/link";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {APP_URL} from "@/lib/routes";
import {BuyerType} from "@/types/buyer/buyer";
import {useEffect, useState} from "react";
import {BuyerStepEnum} from "@/types/enums";
import {useAppConfigStore} from "@/stores/common/appConfigStore";

export default function BuyerInfoCompany(props: {
    buyer: BuyerType,
}) {
    const {addPopup} = usePopupStore();
    const {appConfig} = useAppConfigStore();
    const steps = BuyerStepEnum.options;
    const level = steps.indexOf(props.buyer.step);

    const [localTime, setLocalTime] = useState('');
    useEffect(() => {
        const updateLocalTime = () => {
            const koreaTime = new Date();
            const local = new Date(koreaTime.getTime() + props.buyer.timeDiffWithKorea * -1000);
            const yyyy = local.getFullYear();
            const mm = String(local.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작
            const dd = String(local.getDate()).padStart(2, '0');
            const hh = String(local.getHours()).padStart(2, '0');
            const min = String(local.getMinutes()).padStart(2, '0');
            const sec = String(local.getSeconds()).padStart(2, '0');

            const formatted = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
            setLocalTime(formatted);
        };
        updateLocalTime(); // 최초 호출
        const interval = setInterval(updateLocalTime, 1000); // 매초 업데이트
        return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    }, [props.buyer.timeDiffWithKorea]);

    const displayText = (text: unknown) => {
        const convert = (typeof text === 'string' || typeof text === 'number') ? String(text) : '';
        return convert ? convert : '-';
    }

    return (
        <div className={'buyer_info_company'}>
            <ul className={'detail_info'}>
                <li>
                    <label>
                        <span className={'icon_admin icon_level'}/>level
                    </label>
                    <div>
                        {
                            props.buyer.step !== BuyerStepEnum.Enum.DB
                                ? (<span className={`tag level_${level}`}>{props.buyer.step}</span>)
                                : (<span>{props.buyer.step}</span>)
                        }
                    </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_company'}/>company
                    </label>
                    <div>{props.buyer.companyName}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_continent'}/>
                        continent
                    </label>
                    <div> {appConfig.geoCodes.find(geoCode => geoCode.code === props.buyer.geoCode?.code?.slice(0, 1))?.name}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_subregion'}/>
                        sub-region
                    </label>
                    <div>{appConfig.geoCodes.find(geoCode => geoCode.code === props.buyer.geoCode?.code?.slice(0, 3))?.name}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_nation'}/>
                        nation
                    </label>
                    <div>
                        {
                            props.buyer.geoCode?.isoCode &&
                            <Image src={`${APP_URL}/static/img/nation/gonfalon/${props.buyer.geoCode.isoCode}.svg`}
                                   alt={'nation_img'} width={26} height={17}/>
                        }
                        {
                            props.buyer.geoCode?.isoCode && (
                                <p>
                                    {appConfig.geoCodes.find(geoCode => geoCode.code === props.buyer.geoCode?.code)?.name}{' '}
                                    {localTime.replaceAll("-", ".")}
                                </p>
                            )
                        }
                    </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_address'}/>
                        address
                    </label>
                    <div>{displayText(props.buyer.googleMapAddress ?? "")}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_website'}/>
                        website
                    </label>
                    <div>
                        {displayText(props.buyer.homepage ?? "")}
                        {props.buyer.homepage && <span
                            className={'icon_admin icon_copy'}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(props.buyer.homepage);
                                    addPopup(<AlertComponent alertType={'alert'}
                                                             infoContent={'주소 복사에 성공했습니다.\n' + props.buyer.homepage}/>) // 성공 알림
                                } catch (err) {
                                    console.error('클립보드 복사 실패:', err);
                                    addPopup(<AlertComponent alertType={'error'} infoContent={'주소 복사에 실패했습니다.'}/>)
                                }
                            }}
                            title="클릭하여 주소 복사"
                        />}
                    </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_sales'}/>
                        sales
                    </label>
                    <div>
                        {
                            appConfig.currencyUnits.find(item =>
                                item.isoCode === props.buyer.currencyUnit?.isoCode)?.symbol} {displayText(props.buyer.revenue ?? "-")
                    }
                    </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_keyitems '}/>
                        key items
                    </label>
                    <div>{displayText(props.buyer.keyItems ?? "-")}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_number'}/>
                        company number
                    </label>
                    <div>
                        {
                            !props.buyer.companyContacts && "-"
                        }
                        {
                            props.buyer.companyContacts && props.buyer.companyContacts.split(",").filter(item => item).map(
                                (item, index) => <div key={index}>{item}<br/></div>
                            )
                        }
                    </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_email'}/>
                        company e-mail
                    </label>
                    {
                        !props.buyer.companyEmails && "-"
                    }
                    {
                        props.buyer.companyEmails && props.buyer.companyEmails.split(",").filter(item => item).map(
                            (item, index) => <div key={index}>{item}<br/></div>
                        )
                    }
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_sns'}/>
                        company sns
                    </label>
                    <div className={'sns_box'}>
                        {
                            !(props.buyer.facebook || props.buyer.linkedin || props.buyer.youtube) && "-"
                        }
                        {
                            props.buyer.facebook &&
                            <Link href={props.buyer.facebook} target={"_blank"}>
                                <span className={'icon_admin icon_facebook'}/>
                            </Link>
                        }
                        {
                            props.buyer.linkedin &&
                            <Link href={props.buyer.linkedin} target={"_blank"}>
                                <span className={'icon_admin icon_linkedin'}/>
                            </Link>
                        }
                        {
                            props.buyer.youtube &&
                            <Link href={props.buyer.youtube} target={"_blank"}>
                                <span className={'icon_admin icon_youtube'}/>
                            </Link>
                        }
                    </div>
                </li>
            </ul>
        </div>
    )
}
    
