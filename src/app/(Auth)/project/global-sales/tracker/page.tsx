import Link from "next/link";
import PageComponent from "@/app/(Auth)/project/global-sales/tracker/component/PageComponent";

export default async function Page() {
    return (
        <>
            <div className={'admin_page'}>
                <div className={'page_start_box'}>
                    <h3 className={'title'}>
                        상세관리
                    </h3>
                    <ul className={'breadcrumb'}>
                        <li><Link href={'/public'}>home</Link></li>
                        <li><span className={'icon_admin icon_next'}></span></li>
                        <li>TM</li>
                        <li><span className={'icon_admin icon_next'}></span></li>
                        <li><Link href={'/project/global-sales'}>해외영업관리</Link></li>
                        <li><span className={'icon_admin icon_next'}></span></li>
                        <li><Link href={'/project/global-sales/tracker'}>상세관리</Link></li>
                    </ul>
                </div>
                <PageComponent/>
            </div>
        </>
    )
}