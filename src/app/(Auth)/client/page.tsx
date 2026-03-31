'use client'

import Link from "next/link";
import {useState} from "react";
import '@/style/client.scss'
import ClientCreateForm from "@/app/(Auth)/client/component/ClientCreateForm";
import ClientTableBody from "@/app/(Auth)/client/component/ClientTableBody";

const mockData = [
    { id: 20, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 19, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Team Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 18, status: '계약만료', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'SME Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 17, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: '-', period: '-', createdAt: 'yyyy.mm.dd' },
    { id: 16, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 15, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 14, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 13, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 12, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
    { id: 11, status: '계약', name: 'OOOOOOOOOOO', bizNo: '000-00-00000', email: 'abcedf000000@abcedfghijklmn.com', password: '0000000000000', plan: 'Enterprise Plan', period: 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월', createdAt: 'yyyy.mm.dd' },
];

export default function Page() {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const totalResults = 1000;
    const totalPages = 10;

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>고객관리</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/client'}>고객관리</Link></li>
                </ul>
            </div>

            <ClientCreateForm />

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing 10 of {totalResults.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={'고객사 검색'}/>
                        {search && <button type="button" className={'btn_clear'} onClick={() => setSearch('')}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select defaultValue={10}>
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
                    <ClientTableBody data={mockData} />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
                {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === currentPage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
            </div>
        </div>
    );
}
