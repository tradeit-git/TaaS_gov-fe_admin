import Link from "next/link";

export default function Page() {
    <div className={'admin_page'}>
        <div className={'page_start_box'}>
            <h2>고객관리</h2>
            <ul className={'breadcrumb'}>
                <li>홈</li>
                <li><span className={'admin_icon icon_next'}/></li>
                <li><Link href={'/client'}>고객관리</Link></li>
            </ul>
        </div>
    </div>
        }