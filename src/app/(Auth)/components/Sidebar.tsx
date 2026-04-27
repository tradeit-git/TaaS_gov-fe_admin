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
                <Link href={'/contact'}
                      className={['lnb_name', pathname.includes('contact') ? " on" : ""].join("")}>
                    <span className={'admin_icon contact'}/>도입문의
                </Link>
                <Link href={'/user'}
                      className={['lnb_name', pathname.includes('user') ? " on" : ""].join("")}>
                    <span className={'admin_icon user'}/>가입계정
                </Link>
                <Link href={'/404'}
                      className={['lnb_name', pathname.includes('account') ? " on" : ""].join("")}>
                    <span className={'admin_icon account'}/>데모계정(개발중)
                </Link>
                <Link href={'/trial'}
                      className={['lnb_name', pathname.includes('trial') ? " on" : ""].join("")}>
                    <span className={'admin_icon trial'}/>체험계정
                </Link>
                <Link href={'/client'}
                      className={['lnb_name', pathname.includes('client') ? " on" : ""].join("")}>
                    <span className={'admin_icon client'}/>계약계정
                </Link>
                {/*<Link href={'/billing'}*/}
                <Link href={'/404'}
                      className={['lnb_name', pathname.includes('billing') ? " on" : ""].join("")}>
                    <span className={'admin_icon billing'}/>결제현황(개발중)
                </Link>

            </nav>
        </section>

    </>)

}