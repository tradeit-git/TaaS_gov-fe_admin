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

            <Image src={`${APP_URL}/static/img/admin_logo.png`} width={93} height={28} alt="logo"/>
            <button type={"button"} className={'slide_btn'} onClick={() => setCollapsed(prev => !prev)}>
                <span className={'renewal_icon'}></span>
            </button>
            <div className="user_box">
                <div className="top_box">
                    <div className="top_left renewal_icon"></div>
                    <div className="top_right">
                        <p className={'name'}>{auth?.name ?? "운영관리자"}</p>
                        <p className={'id'}>({auth?.loginId})</p>
                    </div>
                </div>
                <div className="bottom_box">
                    <button type={"button"} className={'pw'} onClick={()=>addPopup(<PassWordPopup/>)}>
                        <span className={'renewal_icon'}></span>
                        비밀번호
                    </button>
                    <button onClick={onClickLogoutBtn} type={"button"} className={'logout'}>
                        <span className={'renewal_icon'}></span>
                        로그아웃
                    </button>
                </div>
            </div>

            <nav className="lnb_menu">

                <ul className={`menu_wrap dashboard_wrap  ${pathname.includes("dashboard") || pathname.includes('dashboard') ? 'active' : ''}`}>
                    <li>
                        {/*<Link href={'/dashboard'}*/}
                        <Link href={'/404'}
                              className={['lnb_name', pathname.includes('dashboard') ? " on" : ""].join("")}>
                            <span className={'reversion_admin'}></span>
                            Dashboard
                        </Link>
                    </li>
                </ul>

                {/* 디렉토리는 해당 메뉴 사용할 때 다시 수정 */}

                <ul className={`menu_wrap ${pathname.includes("user") || pathname.includes('user') ? 'active' : ''}`}>
                    <li className={'user_status'}>
                        <span className={'reversion_admin'}></span>
                        회원현황
                    </li>
                    <ul className={'small_menu_wrap'}>
                        <Link href={'/user/member'}
                              className={['lnb_name', pathname.includes('member') ? " on" : ""].join("")}>
                            개인회원
                        </Link>
                        <Link href={'/user/standard'}
                              className={['lnb_name', pathname.includes('standard') ? " on" : ""].join("")}>
                            기업담당자
                        </Link>
                    </ul>
                </ul>

                <ul className={`menu_wrap ${pathname.includes("bm") || pathname.includes('bm') ? 'active' : ''}`}>
                    <li className={'bm'}>
                        <span className={'renewal_icon'}></span>
                        국내영업
                    </li>
                    <ul className="small_menu_wrap">
                        <Link href={'/bm/data'}
                              className={['lnb_name', pathname.includes('data') ? " on" : ""].join("")}>
                            잠재고객리스트
                        </Link>
                        <Link href={'/bm/salesflow'}
                              className={['lnb_name', pathname.includes('salesflow') ? " on" : ""].join("")}>
                            국내영업관리
                        </Link>

                    </ul>
                </ul>
                <ul className={`menu_wrap ${pathname.includes("project") ? 'active' : ''}`}>
                    <li className={'tm'}>
                        <span className={'renewal_icon'}></span>
                        해외영업
                    </li>
                    <ul className="small_menu_wrap">
                        <Link href={'/project/global-sales'}
                              className={['lnb_name', pathname.includes('global') ? " on" : ""].join("")}>
                            해외영업관리
                        </Link>
                    </ul>
                </ul>
                <ul className={`menu_wrap ${pathname.includes("credits") ? 'active' : ''}`}>
                    <li className={'credits'}>
                        <span className={'reversion_admin'}></span>
                        결제&크레딧
                    </li>
                    <ul className="small_menu_wrap">
                        <Link href={'/credits/billing'}
                              className={['lnb_name', pathname.includes('billing') ? " on" : ""].join("")}>
                            결제현황
                        </Link>
                        <Link href={'/credits/credit-insight'}
                              className={['lnb_name', pathname.includes('credit-insight') ? " on" : ""].join("")}>
                            크레딧사용분석
                        </Link>
                    </ul>
                </ul>
                <ul className={`menu_wrap ${pathname.includes("operation") ? 'active' : ''}`}>
                    <li className={'setting'}>
                        <span className={'renewal_icon'}></span>
                        운영설정
                    </li>
                    <ul className="small_menu_wrap">
                        {/*<Link href={'/operation/admin'}*/}
                        <Link href={'/404'}
                              className={['lnb_name', pathname.includes('n/admin') ? " on" : ""].join("")}>
                            조직&관리자
                        </Link>
                        <Link href={'/operation/product'}
                              className={['lnb_name', pathname.includes('n/product') ? " on" : ""].join("")}>
                            상품관리
                        </Link>
                    </ul>
                </ul>

            </nav>
        </section>

    </>)

}