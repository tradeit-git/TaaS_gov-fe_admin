'use client'

import Link from "next/link";
import TrialCreateForm from "@/app/(Auth)/trial/component/TrialCreateForm";
import TrialTableBody from "@/app/(Auth)/trial/component/TrialTableBody";

export default function TrialPage() {
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>도입문의</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/trial'}>도입문의</Link></li>
                </ul>
            </div>

            <TrialCreateForm/>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing 0 of 0 results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" placeholder={'검색'}/>
                    </div>
                    <select>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>고객상태</th>
                        <th>고객사명</th>
                        <th>사업자번호</th>
                        <th>아이디(e-mail)</th>
                        <th>패스워드</th>
                        <th>서비스 플랜</th>
                        <th>운영기간</th>
                        <th>계정생성일</th>
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
