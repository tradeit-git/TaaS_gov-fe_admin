'use client'

import Link from 'next/link';
import {usePathname, useRouter} from "next/navigation";
import {ADMIN_LOGIN, APP_URL} from "@/lib/routes";
import Image from "next/image";
import {useAuthStore} from "@/stores/auth/authStore";
import Cookies from "js-cookie";
import {useState} from "react";
import PassWordPopup from "@/app/(Auth)/components/PassWordPopup";
import {usePopupStore} from "@/stores/common/popupStore";

export  default  function Sidebar (){
    const {addPopup} = usePopupStore();
    const pathname = usePathname();
    const router = useRouter();
    const {auth, setAuth } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false); // 접힘 여부
    const topSegment = pathname.split('/')[1] ?? '';
    const subSegment = pathname.split('/')[2] ?? '';
    const isOn = (seg: string) => topSegment === seg ? ' on' : '';
    const isDomesticSales = topSegment === 'domestic-sales';
    const [domesticSalesOpen, setDomesticSalesOpen] = useState(isDomesticSales);

    const onClickLogoutBtn = () => {
        Cookies.remove("_TaaS.auth.admin.token")
        Cookies.remove("_TaaS.auth.admin.token", {path: '/', domain: `${process.env.NEXT_PUBLIC_SAME_SITE}`})
        Cookies.remove("_TaaS.auth.admin.rf_token")
        Cookies.remove("_TaaS.auth.admin.rf_token", {path: '/', domain: `${process.env.NEXT_PUBLIC_SAME_SITE}`})
        setAuth(null);
        router.push(ADMIN_LOGIN);
    }

    return (<>

        <section className={`sidebar ${collapsed ? "collapsed" : ""}`}>

            <Image src={`${APP_URL}/static/img/admin_logo.png`} width={89} height={28} alt="logo"/>
            <button type={"button"} className={'slide_btn'} onClick={() => setCollapsed(prev => !prev)}>
                <span className={'admin_icon'}></span>
            </button>
            <div className="user_box">
                <div className="top_box">
                    <div className="top_left admin_icon"></div>
                    <div className="top_right">
                        <p className={'name'}>{auth?.name ?? "운영관리자"}</p>
                        <p className={'id'}>({auth?.loginId})</p>
                    </div>
                </div>
                <div className="bottom_box">
                    <button type={"button"} className={'pw'} onClick={()=>addPopup(<PassWordPopup/>)}>
                        <span className={'admin_icon'}></span>
                        비밀번호
                    </button>
                    <button onClick={onClickLogoutBtn} type={"button"} className={'logout'}>
                        <span className={'admin_icon'}></span>
                        로그아웃
                    </button>
                </div>
            </div>

            <nav className="lnb_menu">
                <Link href={'/trial'}
                      className={`lnb_name${isOn('trial')}`}>
                    <span className={'admin_icon trial'}/>체험계정
                </Link>
                <Link href={'/contact'}
                      className={`lnb_name${isOn('contact')}`}>
                    <span className={'admin_icon contact'}/>도입문의
                </Link>
                <Link href={'/onboarding'}
                      className={`lnb_name${isOn('onboarding')}`}>
                    <span className={'admin_icon onboarding'}/>웨비나 온보딩
                </Link>
                <Link href={'/news'}
                      className={`lnb_name${isOn('news')}`}>
                    <span className={'admin_icon news'}/>보도자료
                </Link>
                <div className={'lnb_group'}>
                    <button type={'button'}
                            className={`lnb_parent${isDomesticSales ? ' on' : ''}`}
                            onClick={() => setDomesticSalesOpen(prev => !prev)}>
                        <span className={'admin_icon client'}/>
                        <span className={'lnb_parent_text'}>국내고객사영업</span>
                        <span className={`lnb_arrow${domesticSalesOpen ? ' open' : ''}`}/>
                    </button>
                    {domesticSalesOpen && (
                        <div className={'lnb_sub'}>
                            <Link href={'/domestic-sales/client-register'}
                                  className={`lnb_sub_item${isDomesticSales && subSegment === 'client-register' ? ' on' : ''}`}>
                                고객사등록
                            </Link>
                            <Link href={'/domestic-sales/sales-pipeline'}
                                  className={`lnb_sub_item${isDomesticSales && subSegment === 'sales-pipeline' ? ' on' : ''}`}>
                                영업파이프라인
                            </Link>
                        </div>
                    )}
                </div>
                {/*<Link href={'/user'}*/}
                {/*      className={`lnb_name${isOn('user')}`}>*/}
                {/*    <span className={'admin_icon user'}/>가입계정*/}
                {/*</Link>*/}
                <Link href={'/account'}
                      className={`lnb_name${isOn('account')}`}>
                    <span className={'admin_icon account'}/>내부영업계정
                </Link>
                <Link href={'/users'}
                      className={`lnb_name${isOn('users')}`}>
                    <span className={'admin_icon management'}/>가입회원사
                </Link>
                <Link href={'/managed-users'}
                      className={`lnb_name${isOn('managed-users')}`}>
                    <span className={'admin_icon managed-users'}/>유저프로젝트관리
                </Link>
                <Link href={'/partner-management'}
                      className={`lnb_name${isOn('partner-management')}`}>
                    <span className={'admin_icon partner management'}/>협회제휴관리
                </Link>

                {/*<Link href={'/client'}*/}
                {/*      className={`lnb_name${isOn('client')}`}>*/}
                {/*    <span className={'admin_icon client'}/>계약계정*/}
                {/*</Link>*/}
                {/*<Link href={'/billing'}*/}
                <Link href={'/404'}
                      className={`lnb_name${isOn('billing')}`}>
                    <span className={'admin_icon billing'}/>결제현황
                </Link>

            </nav>
        </section>

    </>)

}