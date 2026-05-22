'use client'

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import AccountCreateForm from "@/app/(Auth)/account/component/AccountCreateForm";
import AccountTableBody from "@/app/(Auth)/account/component/AccountTableBody";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface AccountRow {
    id: number;
    email: string;
    name: string;
    phone: string;
    company: string;
    department: string;
    position: string;
    credit: number;
    createdAt: string;
}

// 목업 데이터
const MOCK_DATA: AccountRow[] = [
    {id: 1, email: 'sales01@tradeit.co.kr', name: '김영업', phone: '010-1234-5678', company: '트레이드잇', department: '영업1팀', position: '팀장', credit: 1500000, createdAt: '2026-05-20'},
    {id: 2, email: 'sales02@tradeit.co.kr', name: '이판매', phone: '010-2345-6789', company: '트레이드잇', department: '영업1팀', position: '대리', credit: 320000, createdAt: '2026-05-18'},
    {id: 3, email: 'sales03@tradeit.co.kr', name: '박세일', phone: '010-3456-7890', company: '트레이드잇', department: '영업2팀', position: '사원', credit: 0, createdAt: '2026-05-15'},
    {id: 4, email: 'sales04@tradeit.co.kr', name: '최거래', phone: '010-4567-8901', company: '트레이드잇', department: '영업2팀', position: '과장', credit: 80000, createdAt: '2026-05-12'},
    {id: 5, email: 'sales05@tradeit.co.kr', name: '정수익', phone: '010-5678-9012', company: '트레이드잇', department: '영업3팀', position: '차장', credit: 540000, createdAt: '2026-05-10'},
    {id: 6, email: 'sales06@tradeit.co.kr', name: '강매출', phone: '010-6789-0123', company: '트레이드잇', department: '영업3팀', position: '사원', credit: 12000, createdAt: '2026-05-08'},
    {id: 7, email: 'sales07@tradeit.co.kr', name: '윤계약', phone: '010-7890-1234', company: '트레이드잇', department: '영업1팀', position: '대리', credit: 250000, createdAt: '2026-05-05'},
    {id: 8, email: 'sales08@tradeit.co.kr', name: '임고객', phone: '010-8901-2345', company: '트레이드잇', department: '영업2팀', position: '사원', credit: 0, createdAt: '2026-05-03'},
    {id: 9, email: 'sales09@tradeit.co.kr', name: '한실적', phone: '010-9012-3456', company: '트레이드잇', department: '영업3팀', position: '팀장', credit: 990000, createdAt: '2026-05-01'},
    {id: 10, email: 'sales10@tradeit.co.kr', name: '오영업', phone: '010-0123-4567', company: '트레이드잇', department: '영업1팀', position: '사원', credit: 45000, createdAt: '2026-04-28'},
    {id: 11, email: 'sales11@tradeit.co.kr', name: '서판촉', phone: '010-1357-2468', company: '트레이드잇', department: '영업2팀', position: '대리', credit: 178000, createdAt: '2026-04-25'},
    {id: 12, email: 'sales12@tradeit.co.kr', name: '신거래', phone: '010-2468-1357', company: '트레이드잇', department: '영업3팀', position: '과장', credit: 600000, createdAt: '2026-04-22'},
];

export default function AccountPage() {
    const {addPopup} = usePopupStore();
    const [allData, setAllData] = useState<AccountRow[]>(MOCK_DATA);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // 검색 디바운스
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 100);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    // 필터링 (목업: 클라이언트 사이드)
    const filteredData = useMemo(() => {
        return allData.filter(row => {
            if (search.trim()) {
                const keyword = search.trim().toLowerCase();
                const target = `${row.email} ${row.name} ${row.company} ${row.department}`.toLowerCase();
                if (!target.includes(keyword)) return false;
            }
            return true;
        });
    }, [allData, search]);

    const totalElements = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / itemsPerPage));

    const pagedData = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(0);
    };

    const handleCreated = (account: {email: string; name: string}) => {
        setAllData(prev => {
            const nextId = prev.reduce((max, row) => Math.max(max, row.id), 0) + 1;
            const newRow: AccountRow = {
                id: nextId,
                email: account.email,
                name: account.name,
                phone: '',
                company: '',
                department: '',
                position: '',
                credit: 0,
                createdAt: new Date().toISOString().slice(0, 10),
            };
            return [newRow, ...prev];
        });
        setCurrentPage(0);
    };

    const handleCharge = (id: number, amount: number) => {
        setAllData(prev => prev.map(row => row.id === id ? {...row, credit: row.credit + amount} : row));
        addPopup(<AlertComponent alertType={'alert'} infoContent={`${amount.toLocaleString()} 크레딧이 충전되었습니다.`}/>);
    };

    const handleDeduct = (id: number, amount: number) => {
        const target = allData.find(row => row.id === id);
        if (target && amount > target.credit) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'보유 크레딧보다 많이 차감할 수 없습니다.'}/>);
            return;
        }
        setAllData(prev => prev.map(row => row.id === id ? {...row, credit: Math.max(0, row.credit - amount)} : row));
        addPopup(<AlertComponent alertType={'alert'} infoContent={`${amount.toLocaleString()} 크레딧이 차감되었습니다.`}/>);
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 계정을 삭제하시겠습니까?'} callback={() => {
            setAllData(prev => prev.filter(row => row.id !== id));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
        }}/>);
    };

    return (
        <div className={'admin_page partner_page account_page'}>
            <div className={'page_start_box'}>
                <h2>내부영업계정</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/account'}>내부영업계정</Link></li>
                </ul>
            </div>

            <AccountCreateForm onCreated={handleCreated}/>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {pagedData.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'ID / 이름 / 회사 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'}
                                                onClick={() => {
                                                    setSearchInput('');
                                                    setSearch('');
                                                    setCurrentPage(0);
                                                }}><span className={'admin_icon'}/></button>}
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
                <table className={'client_table partner_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '15%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '10%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '22%'}}/>
                        <col style={{width: '9%'}}/>
                        <col style={{width: '10%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th>ID(e-mail)</th>
                        <th>이름</th>
                        <th>전화번호</th>
                        <th>회사명</th>
                        <th>부서</th>
                        <th>직함</th>
                        <th>크레딧 관리</th>
                        <th>계정생성일</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <AccountTableBody
                        data={pagedData}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onCharge={handleCharge}
                        onDeduct={handleDeduct}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                {currentGroup > 1 &&
                    <button type="button" className={'btn_prev'}
                            onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span
                        className={'admin_icon'}/></button>}
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page - 1)}>{page}</button>
                ))}
                {groupEnd < totalPages &&
                    <button type="button" className={'btn_next'}
                            onClick={() => setCurrentPage(groupEnd)}><span
                        className={'admin_icon'}/></button>}
            </div>
        </div>
    );
}
