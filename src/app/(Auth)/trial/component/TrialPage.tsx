'use client'

import Link from "next/link";
import TrialCreateForm from "@/app/(Auth)/trial/component/TrialCreateForm";
import TrialTableBody from "@/app/(Auth)/trial/component/TrialTableBody";

export default function TrialPage() {
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>체험계정</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/trial'}>체험계정</Link></li>
                </ul>
            </div>

            <TrialCreateForm/>


            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <colgroup>
                        <col width={'50px'}/>

                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>관련프로그램</th>
                        <th>도메인</th>
                        <th>크레딧</th>
                        <th>운영기간</th>
                        <th>체험가입자수</th>
                        <th>등록일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <TrialTableBody/>
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled><span className={'admin_icon'}/> </button>
                <button type="button" className={'btn_page on'}>1</button>
                <button type="button" className={'btn_next'} disabled><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
