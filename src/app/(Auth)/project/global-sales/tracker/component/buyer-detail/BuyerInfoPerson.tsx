'use clinet'
import Link from "next/link";
import {useMemo, useState} from 'react'
import {BuyerManagerRoleEnum, BuyerManagerSchema, BuyerManagerType} from "@/types/buyer/buyerManager";

export default function BuyerInfoCompany (props : {
    buyerManagers : BuyerManagerType[],
}) {
    const [activePerson, setActivePerson] = useState<0 | 1 | 2>(0);

   const buyerManager = useMemo(() => {
       if(props.buyerManagers.length <= activePerson) return BuyerManagerSchema.parse({});
       else return props.buyerManagers[activePerson];
   },[props.buyerManagers, activePerson])

    const getRoleClass  = (index : number) => {
        if(props.buyerManagers.length <= index) return 'person_top';
        else {
            const role = props.buyerManagers[index].role;
            switch (role){
                case BuyerManagerRoleEnum.Enum.Admin : return 'person_top';
                case BuyerManagerRoleEnum.Enum.Manager : return 'person_middle';
                case BuyerManagerRoleEnum.Enum.Member : return 'person_bottom';
            }
        }

    }
    
    return (
        <div className={'buyer_info_company buyer_info_contents'}>
            <div className={'person_icon'}>
                <span className={`icon_admin ${getRoleClass(0)} ${activePerson===0 ? 'on' : ''}`}
                      onClick={() => setActivePerson(0)}/>
                <span className={`icon_admin ${getRoleClass(1)} ${activePerson===1 ? 'on' : ''}`}
                      onClick={() => setActivePerson(1)}/>
                <span className={`icon_admin ${getRoleClass(2)} ${activePerson===2 ? 'on' : ''}`}
                      onClick={() => setActivePerson(2)}/>
            </div>
            <ul className={'detail_info'}>
                <li>
                    <label>
                        <span className={'icon_admin icon_role'}/>
                        role
                    </label>
                    <div>{buyerManager.role}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_name'}/>
                        name
                    </label>
                    <div>{buyerManager.name} </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_position'}/>
                        position
                    </label>
                    <div>{buyerManager.position} </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_number'}/>
                        contact number
                    </label>
                    <div>{buyerManager.contact}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_phone'}/>
                        cell phone
                    </label>
                    <div>{buyerManager.phone} </div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_email'}/>
                        e-mail
                    </label>
                    <div>{buyerManager.email}</div>
                </li>
                <li>
                    <label>
                        <span className={'icon_admin icon_sns'}/>
                        sns
                    </label>
                    <div className={'sns_box'}>
                        {
                            !(buyerManager.facebook || buyerManager.linkedin || buyerManager.twitter || buyerManager.instagram) && "-"
                        }
                        {
                            buyerManager.facebook &&
                            <Link href={buyerManager.facebook} target={'_blank'}>
                                <span className={'icon_admin icon_facebook'}></span></Link>
                        }
                        {
                            buyerManager.linkedin &&
                            <Link href={buyerManager.linkedin} target={'_blank'}>
                                <span className={'icon_admin icon_linkedin'}></span></Link>
                        }
                        {
                            buyerManager.twitter &&
                            <Link href={buyerManager.twitter} target={'_blank'}>
                                <span className={'icon_admin icon_twitter'}></span></Link>
                        }
                        {
                            buyerManager.instagram &&
                            <Link href={buyerManager.instagram} target={'_blank'}>
                                <span className={'icon_admin icon_instagram'}></span></Link>
                        }
                    </div>
                </li>

            </ul>
        </div>
    )
}
    
