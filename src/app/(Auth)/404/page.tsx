import Image from "next/image";
import {APP_URL} from "@/lib/routes";
import '@/style/404page.scss'

export default function progress (){
    return (
        <section className={'progressPage'}>
            <div>
                <Image src={`${APP_URL}/static/img/ing_img.png`} alt={"404_img"} width={150} height={150}/>
                <strong>현재 <b>페이지 작업중</b>입니다.</strong>
                <p>
                    현재 페이지는 준비중으로 접속할 수 없습니다.<br/>
                    서비스 이용에 불편을 드려 죄송합니다.
                </p>
            </div>
        </section>
    )
}