'use client'

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OnboardingCreateForm from "@/app/(Auth)/onboarding/component/OnboardingCreateForm";
import OnboardingTableBody from "@/app/(Auth)/onboarding/component/OnboardingTableBody";

export interface OnboardingRow {
    id: number;
    scheduledAt: string;
    onboardingClass: string;
    url: string;
    host: string;
    createdAt: string;
}

export const ONBOARDING_CLASSES = [
    "우리 제품의 실제 해외 바이어 찾기 '기본 실습'",
    "산업별 실제 해외 바이어 발굴 실습 '화장품, 뷰티'",
    "산업별 실제 해외 바이어 발굴 실습 '식품, K-Food'",
    "산업별 실제 해외 바이어 발굴 실습 '자동차부품'",
    "산업별 실제 해외 바이어 발굴 실습 '기계, 산업제'",
    "산업별 실제 해외 바이어 발굴 실습 '생활 소비재, 기타 소비재'",
] as const;

const MOCK_ROWS: OnboardingRow[] = [
    { id: 1,  scheduledAt: '2026-04-15 10:00', onboardingClass: ONBOARDING_CLASSES[0], url: 'https://app.zoom.us/wc/85398779074/join?ref_from=launch&pwd=gxdymahZw2yQSybcxvfREVPfkqtHXd.1&_x_zm_rtaid=l18DaEaCST-77MhC4a9ZZg.1777263976590.d94736a234ca082f799844a93e753da0&_x_zm_rhtaid=58&fromPWA=1', host: '이한열', createdAt: '2026-04-12' },
    { id: 2,  scheduledAt: '2026-04-18 14:00', onboardingClass: ONBOARDING_CLASSES[1], url: 'https://meet.tradeit.global/onb/def456', host: '양민지', createdAt: '2026-04-14' },
    { id: 3,  scheduledAt: '2026-04-20 10:00', onboardingClass: ONBOARDING_CLASSES[2], url: 'https://meet.tradeit.global/onb/ghi789', host: '정유나', createdAt: '2026-04-15' },
    { id: 4,  scheduledAt: '2026-04-23 14:00', onboardingClass: ONBOARDING_CLASSES[3], url: 'https://meet.tradeit.global/onb/jkl012', host: '이한열', createdAt: '2026-04-18' },
    { id: 5,  scheduledAt: '2026-04-25 10:00', onboardingClass: ONBOARDING_CLASSES[4], url: 'https://meet.tradeit.global/onb/mno345', host: '양민지', createdAt: '2026-04-20' },
    { id: 6,  scheduledAt: '2026-04-27 14:00', onboardingClass: ONBOARDING_CLASSES[5], url: 'https://meet.tradeit.global/onb/now111', host: '정유나', createdAt: '2026-04-22' },
    { id: 7,  scheduledAt: '2026-04-29 10:00', onboardingClass: ONBOARDING_CLASSES[0], url: 'https://meet.tradeit.global/onb/pqr678', host: '이한열', createdAt: '2026-04-23' },
    { id: 8,  scheduledAt: '2026-04-30 14:00', onboardingClass: ONBOARDING_CLASSES[1], url: 'https://meet.tradeit.global/onb/stu901', host: '양민지', createdAt: '2026-04-24' },
    { id: 9,  scheduledAt: '2026-05-02 10:00', onboardingClass: ONBOARDING_CLASSES[2], url: 'https://meet.tradeit.global/onb/vwx234', host: '정유나', createdAt: '2026-04-25' },
    { id: 10, scheduledAt: '2026-05-05 14:00', onboardingClass: ONBOARDING_CLASSES[3], url: 'https://meet.tradeit.global/onb/yz1567', host: '이한열', createdAt: '2026-04-26' },
    { id: 11, scheduledAt: '2026-05-07 10:00', onboardingClass: ONBOARDING_CLASSES[4], url: 'https://meet.tradeit.global/onb/abc890', host: '양민지', createdAt: '2026-04-26' },
    { id: 12, scheduledAt: '2026-05-10 14:00', onboardingClass: ONBOARDING_CLASSES[5], url: 'https://meet.tradeit.global/onb/def111', host: '정유나', createdAt: '2026-04-27' },
];

interface Props {
    initialData?: unknown;
}

export default function OnboardingPage(_props: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<OnboardingRow[]>(MOCK_ROWS);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editRow, setEditRow] = useState<OnboardingRow | null>(null);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(0);
        }, 100);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const filtered = useMemo(() => {
        const kw = search.trim();
        if (!kw) return data;
        return data.filter(r => r.host.includes(kw) || r.url.includes(kw));
    }, [data, search]);

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / itemsPerPage));
    const pageData = filtered.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    const handleCreated = () => {
        setCurrentPage(0);
        setSearch('');
        setSearchInput('');
    };

    const handleEdit = (row: OnboardingRow) => {
        setEditingId(row.id);
        setEditRow({...row});
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditRow(null);
    };

    const handleChange = (field: keyof OnboardingRow, value: string) => {
        if (!editRow) return;
        setEditRow({...editRow, [field]: value});
    };

    const handleSave = () => {
        if (!editRow) return;
        setData(prev => prev.map(r => r.id === editRow.id ? editRow : r));
        addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
        setEditingId(null);
        setEditRow(null);
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 온보딩을 삭제하시겠습니까?'} callback={() => {
            setData(prev => prev.filter(r => r.id !== id));
            addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
        }}/>);
    };

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

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>웨비나 온보딩</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/onboarding'}>웨비나온보딩</Link></li>
                </ul>
            </div>

            <OnboardingCreateForm onCreated={handleCreated}/>

            <div className={'list_header'}>
                <p className={'result_count'}>Showing {pageData.length} of {totalElements.toLocaleString()} results</p>
                <div className={'search_area'}>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder={'진행자/URL 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'} onClick={() => { setSearchInput(''); setSearch(''); setCurrentPage(0); }}><span className={'admin_icon'}/> </button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => handleItemsPerPageChange(Number(e.target.value))}>
                        <option value={10}>10개씩</option>
                        <option value={20}>20개씩</option>
                        <option value={50}>50개씩</option>
                    </select>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'client_table onboarding_table'}>
                    <colgroup>
                        <col width={'60px'}/>
                        <col width={'120px'}/>
                        <col width={'200px'}/>
                        <col width={'240px'}/>
                        <col/>
                        <col width={'120px'}/>
                        <col width={'120px'}/>
                        <col width={'160px'}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>상태</th>
                        <th>일시</th>
                        <th>클래스</th>
                        <th>URL</th>
                        <th>진행자</th>
                        <th>생성일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <OnboardingTableBody
                        pageData={pageData}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        editingId={editingId}
                        editRow={editRow}
                        onEdit={handleEdit}
                        onCancel={handleCancel}
                        onChange={handleChange}
                        onSave={handleSave}
                        onDelete={handleDelete}
                    />
                </table>
            </div>

            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}><span className={'admin_icon'}/> </button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => setCurrentPage(page - 1)}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => setCurrentPage(groupEnd)}><span className={'admin_icon'}/></button>
            </div>
        </div>
    );
}
