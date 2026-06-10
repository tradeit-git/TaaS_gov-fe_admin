'use client'

import Image from "next/image";
import React, {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import {ADMIN_MAIN, APP_URL} from "@/lib/routes";
import {AdminSchema} from "@/types/auth/admin";
import Cookies from "js-cookie";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {useMediaQuery} from "react-responsive";


export default function LoginForm(){
    const isDesktop = useMediaQuery({ minWidth: 1025 });
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const [auth, setAuth] = useState(AdminSchema.parse({}));

    const loginIdInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const loginButtonRef = useRef<HTMLButtonElement>(null);

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const handleTogglePassword = () => {
        setIsPasswordVisible(!isPasswordVisible);
    }

    const handleLogin = async () => {
        try {
            const options: RequestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(auth),
            };
            const apiRes = await callApi(`/api/admin/auth/login`, options);
            if (apiRes.result) {
                const newTokens = apiRes.data as Record<string, string>;
                for (const key in newTokens) {
                    Cookies.set(key, newTokens[key], {
                        expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일
                        path: "/", // 전체 경로에 대해 쿠키 유효
                    });
                }
                //window.location.href = ADMIN_MAIN;
                router.push(ADMIN_MAIN);
            } else {
                // 서버에서 오류 응답일 때
                addPopup(<AlertComponent alertType={"error"} infoContent={'로그인 실패, 아이디 또는 비밀번호 불일치'}/>);
            }
        } catch (error) {
            console.error('Network or unexpected error:', error);
            addPopup(<AlertComponent alertType={"error"} infoContent={'로그인 중 오류가 발생했습니다.'}/>);
        } finally {
            (document.activeElement as HTMLElement).blur();
        }
    };

    return (
        <section className={'login_page'}>
            <div className={'container'}>
                <Image alt={'login_logo'} src={`${APP_URL}/static/img/login_logo.png`} width={96} height={28}></Image>
                <div className={'content'}>
                    <h3>Welcome Back!</h3>
                    <ul>
                        <li>
                            <label>ID</label>
                            <input type={'text'} placeholder={'아이디를 입력해주세요.'}
                                   ref={loginIdInputRef}
                                   value={auth.loginId}
                                   onChange={(e) => setAuth({...auth, loginId: e.target.value})}
                                   onKeyDown={(e) => {
                                       if (e.key === "Enter") {
                                           if (passwordInputRef.current) passwordInputRef.current.focus();
                                       }
                                   }}
                                   maxLength={20} required/>
                        </li>
                        <li>
                            <label>Password</label>
                            <input type={isPasswordVisible ? 'text' : 'password'} placeholder={'비밀번호를 입력해주세요.'}
                                   ref={passwordInputRef}
                                   value={auth.password}
                                   onChange={(e) => setAuth({...auth, password: e.target.value})}
                                   onKeyDown={(e) => {
                                       if (e.key === "Enter") {
                                           if (loginButtonRef.current) loginButtonRef.current.click();
                                       }
                                   }}
                                   maxLength={20} required/>
                            <div className={'eye_toggle'} onClick={handleTogglePassword}>
                                <i className={`bi ${isPasswordVisible ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                            </div>
                        </li>
                    </ul>
                    <button type="button"
                            ref={loginButtonRef}
                            onClick={handleLogin}>Log-in
                    </button>
                    <p className={'mobile_txt'}>
                        ※ Tablet, Mobile 해상도에서는<br/>
                        국내영업관리 메뉴만 이용할 수 있습니다.
                    </p>
                </div>
            </div>
        </section>
    )
}