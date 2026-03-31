import Image from "next/image";
import {APP_URL} from "@/lib/routes";

export default function ErrorPage(){
    return (
        <section className={'errorPage'}>
            <div className={'ingcontent'}>
                <Image src={`${APP_URL}//static/img/ing_img.png`} alt='ingimg' width={215} height={183} />
                <h4>현재 <b>페이지 작업중</b> 입니다.</h4>
                <p>현재 페이지는 준비중으로 접속할 수 없습니다.<br/>
                    서비스 이용에 불편을 드려 죄송합니다.</p>
            </div>
        </section>
    )
}