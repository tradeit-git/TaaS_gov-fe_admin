'use client'

import Link from "next/link";
import {useMemo, useState} from "react";
import '@/style/client.scss'
import ClientCreateForm from "@/app/(Auth)/client/component/ClientCreateForm";
import ClientTableBody from "@/app/(Auth)/client/component/ClientTableBody";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

const statuses = ['계약', '계약', '계약', '계약만료'] as const;
const plans = ['Enterprise Plan', 'Team Plan', 'SME Plan', '-'] as const;

const initialData = Array.from({length: 55}, (_, i) => ({
    id: 55 - i,
    status: statuses[i % statuses.length],
    name: 'OOOOOOOOOOO',
    bizNo: '000-00-00000',
    email: 'abcedf000000@abcedfghijklmn.com',
    password: '0000000000000',
    plan: plans[i % plans.length],
    period: i % plans.length === 3 ? '-' : 'yyyy.mm.dd ~ yyyy.mm.dd / ##개월',
    createdAt: 'yyyy.mm.dd',
}));

export default function Page() {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState(initialData);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 고객을 삭제하시겠습니까?'} callback={() => {
            setData(prev => prev.filter(row => row.id !== id));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'} />);
        }} />);
    };

    const filteredData = useMemo(() => {
        if (!search.trim()) return data;
        const keyword = search.trim().toLowerCase();
        return data.filter(row =>
            row.name.toLowerCase().includes(keyword) ||
            row.bizNo.includes(keyword) ||
            row.email.toLowerCase().includes(keyword)
        );
    }, [search, data]);

    const totalResults = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));

    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * itemsPerPage;
    const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // 10페이지 단위 그룹
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(safePage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

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
                <p className={'result_count'}>Showing {pageData.length} of {totalResults.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={'고객사 검색'}/>
                        {search && <button type="button" className={'btn_clear'} onClick={() => { setSearch(''); setCurrentPage(1); }}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
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
                    <ClientTableBody data={pageData} startIndex={startIndex} totalCount={totalResults} onDelete={handleDelete} />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => setCurrentPage(groupStart - pageGroupSize)}><span className={'admin_icon'}/> </button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === safePage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => setCurrentPage(groupEnd + 1)}><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
