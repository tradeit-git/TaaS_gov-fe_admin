'use client'

import React, {useMemo, useState} from "react";

type PaymentHistoryItem = {
    id: number;
    userId: number;
    loginId: string;
    userName: string;
    transactionId: string;
    createdAt: string;
    gradeName: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: 'COMPLETED' | 'FAILED';
}

type SearchInputType = {
    startDate: string;
    endDate: string;
    gradeNames: string[];
}

type FilterOptionType = {
    startDate: string;
    endDate: string;
    gradeNames: string[];
    paymentStatus: string;
}

const PLAN_OPTIONS = ['Premium', 'Pro', 'Plus', 'Free'];
const NAV_COUNT = 10;

const USER_NAMES = ['김민수', '이서연', '박지훈', '최유진', '정도현', '강하늘', '윤채원', '임재민', '한소율', '송지우'];
const METHODS = ['카드', '계좌이체', '카드', 'PayPal'];

const pad = (n: number) => String(n).padStart(2, '0');

const mockItems: PaymentHistoryItem[] = Array.from({length: 45}, (_, i) => {
    const createdDate = new Date(2026, 3, 15);
    createdDate.setDate(createdDate.getDate() - i * 2);
    const dateStr = `${createdDate.getFullYear()}-${pad(createdDate.getMonth() + 1)}-${pad(createdDate.getDate())}`;

    const grade = PLAN_OPTIONS[i % PLAN_OPTIONS.length];
    const amountMap: Record<string, number> = {Premium: 99.00, Pro: 49.00, Plus: 19.00, Free: 0};
    const amount = amountMap[grade];

    const status: 'COMPLETED' | 'FAILED' = i % 9 === 0 ? 'FAILED' : 'COMPLETED';

    return {
        id: i + 1,
        userId: 1000 + i,
        loginId: `tradeit${211200 + i + 1}@gmail.com`,
        userName: USER_NAMES[i % USER_NAMES.length],
        transactionId: `TXN${2026}${pad(createdDate.getMonth() + 1)}${pad(createdDate.getDate())}${pad(i + 1)}`,
        createdAt: dateStr,
        gradeName: grade,
        amount,
        paymentMethod: METHODS[i % METHODS.length],
        paymentStatus: status,
    };
});

export default function PageContent() {

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);

    const [searchInput, setSearchInput] = useState<SearchInputType>({
        startDate: '',
        endDate: '',
        gradeNames: [],
    });

    const [filterOption, setFilterOption] = useState<FilterOptionType>({
        startDate: '',
        endDate: '',
        gradeNames: [],
        paymentStatus: '',
    });

    const filteredItems = useMemo(() => {
        return mockItems.filter(item => {
            if (filterOption.startDate && item.createdAt < filterOption.startDate) return false;
            if (filterOption.endDate && item.createdAt > filterOption.endDate) return false;
            if (filterOption.gradeNames.length > 0 && !filterOption.gradeNames.includes(item.gradeName)) return false;
            if (filterOption.paymentStatus && item.paymentStatus !== filterOption.paymentStatus) return false;
            return true;
        });
    }, [filterOption]);

    const totalElements = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    const pagedItems = useMemo(() => {
        const start = (page - 1) * size;
        return filteredItems.slice(start, start + size);
    }, [filteredItems, page, size]);

    const groupStart = Math.floor((page - 1) / NAV_COUNT) * NAV_COUNT + 1;
    const groupEnd = Math.min(groupStart + NAV_COUNT - 1, totalPages);
    const navigations: number[] = [];
    for (let i = groupStart; i <= groupEnd; i++) navigations.push(i);

    const handlePlanToggle = (plan: string) => {
        setSearchInput(prev => ({
            ...prev,
            gradeNames: prev.gradeNames.includes(plan)
                ? prev.gradeNames.filter(p => p !== plan)
                : [...prev.gradeNames, plan]
        }));
    };

    const handleSearch = () => {
        setPage(1);
        setFilterOption({
            startDate: searchInput.startDate,
            endDate: searchInput.endDate,
            gradeNames: [...searchInput.gradeNames],
            paymentStatus: filterOption.paymentStatus,
        });
    };

    const handleReset = () => {
        setSearchInput({startDate: '', endDate: '', gradeNames: []});
        setFilterOption({startDate: '', endDate: '', gradeNames: [], paymentStatus: ''});
        setPage(1);
        setSize(10);
    };

    const handlePrevGroup = () => {
        if (groupStart === 1) return;
        setPage(groupStart - NAV_COUNT);
    };

    const handleNextGroup = () => {
        const nextGroupStart = groupStart + NAV_COUNT;
        if (nextGroupStart > totalPages) return;
        setPage(nextGroupStart);
    };

    const handleInvoice = (transactionId: string) => {
        alert(`청구서 다운로드 (${transactionId})`);
    };

    const getRowNo = (index: number) => totalElements - ((page - 1) * size) - index;

    return (
        <>
            <div className={'billing_search_section'}>
                <div className={'search_row'}>
                    <div className={'search_date'}>
                        <span className={'label'}>결제일자</span>
                        <div className={'date_inputs'}>
                            <input
                                type={'date'}
                                value={searchInput.startDate}
                                onChange={(e) => setSearchInput(prev => ({...prev, startDate: e.target.value}))}
                            />
                            <span className={'date_separator'}>~</span>
                            <input
                                type={'date'}
                                value={searchInput.endDate}
                                onChange={(e) => setSearchInput(prev => ({...prev, endDate: e.target.value}))}
                            />
                        </div>
                    </div>
                    <div className={'search_plan'}>
                        <span className={'label'}>이용플랜</span>
                        <div className={'plan_checks'}>
                            {PLAN_OPTIONS.map(plan => (
                                <label key={plan} className={'plan_check_item'}>
                                    <input
                                        type={'checkbox'}
                                        checked={searchInput.gradeNames.includes(plan)}
                                        onChange={() => handlePlanToggle(plan)}
                                    />
                                    <span>{plan}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={'search_btns'}>
                        <button type={'button'} className={'btn_search'} onClick={handleSearch}>검색</button>
                        <button type={'button'} className={'btn_reset'} onClick={handleReset}>초기화</button>
                    </div>
                </div>
            </div>

            <div className={'list_header'}>
                <p className={'result_count'}>
                    총 결제 수 : <b>{totalElements.toLocaleString()}</b> 건
                </p>
                <div className={'search_area'}>
                    <select
                        value={filterOption.paymentStatus}
                        onChange={(e) => {
                            setPage(1);
                            setFilterOption(prev => ({...prev, paymentStatus: e.target.value}));
                        }}
                    >
                        <option value="">결제상태</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="FAILED">FAILED</option>
                    </select>
                    <select
                        value={size}
                        onChange={(e) => {
                            setPage(1);
                            setSize(Number(e.target.value));
                        }}
                    >
                        <option value={10}>10개씩</option>
                        <option value={30}>30개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>결제일</th>
                        <th>결제 ID</th>
                        <th>사용자 ID</th>
                        <th>사용자명</th>
                        <th>이용플랜</th>
                        <th>결제금액(부가세 포함)</th>
                        <th>결제수단</th>
                        <th>결제상태</th>
                        <th>청구서</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pagedItems.length === 0 ? (
                        <tr>
                            <td colSpan={10} style={{textAlign: 'center', padding: '40px'}}>결제 이력이 없습니다.</td>
                        </tr>
                    ) : pagedItems.map((item, index) => (
                        <tr key={item.id}>
                            <td>{getRowNo(index)}</td>
                            <td>{item.createdAt}</td>
                            <td>{item.transactionId}</td>
                            <td>{item.loginId}</td>
                            <td>{item.userName}</td>
                            <td>{item.gradeName}</td>
                            <td>${item.amount.toFixed(2)}</td>
                            <td>{item.paymentMethod}</td>
                            <td className={item.paymentStatus === 'FAILED' ? 'status_failed' : 'status_completed'}>
                                {item.paymentStatus}
                            </td>
                            <td>
                                {item.paymentStatus === 'FAILED'
                                    ? <span>-</span>
                                    : (
                                        <button
                                            type={'button'}
                                            className={'btn_detail'}
                                            onClick={() => handleInvoice(item.transactionId)}
                                        >
                                            다운로드
                                        </button>
                                    )
                                }
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className={'pagination'}>
                <button
                    type={'button'}
                    className={'btn_prev'}
                    disabled={groupStart === 1}
                    onClick={handlePrevGroup}
                >
                    <span className={'admin_icon'}/>
                </button>
                {navigations.map((num) => (
                    <button
                        key={num}
                        type={'button'}
                        className={`btn_page ${page === num ? 'on' : ''}`}
                        onClick={() => setPage(num)}
                    >
                        {num}
                    </button>
                ))}
                <button
                    type={'button'}
                    className={'btn_next'}
                    disabled={groupStart + NAV_COUNT > totalPages}
                    onClick={handleNextGroup}
                >
                    <span className={'admin_icon'}/>
                </button>
            </div>
        </>
    );
}
