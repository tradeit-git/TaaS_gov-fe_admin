import Link from "next/link";

export default function page(){
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>도입문의</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li>
                        <span className={'admin_icon icon_next'}/>
                    </li>
                    <li>
                        <Link href={'/contact'}>도입문의</Link>
                    </li>
                </ul>
            </div>
        </div>
    )
}