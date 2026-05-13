'use client';

import {useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";

interface UsageDetail {
    hsCode: string;
    keyword: string;
    importer: string;
    exporter: string;
    exportCountry: string;
    importCountry: string;
    searchPeriod: string;
    totalCount: string;
    currentPage: string;
}

interface UsageRow {
    id: number;
    date: string;
    type: 'grant' | 'use' | 'expire' | 'revoke';
    description: string;
    tag?: string;
    detail?: UsageDetail;
    delta: number;
    balance: number;
}

interface Props {
    uId?: string;
}

const TYPE_LABEL: Record<string, string> = {
    grant: '지급',
    use: '사용',
    expire: '소멸',
    revoke: '회수',
};

const TYPE_CLASS: Record<string, string> = {
    grant: 'type_grant',
    use: 'type_use',
    expire: 'type_expire',
    revoke: 'type_revoke',
};

// 목업 데이터
const MOCK_USAGE: UsageRow[] = [
    {id: 9999, date: '2026.05.11 14:41', type: 'expire', description: '기간만료', delta: -8400, balance: 0},
    {id: 13, date: '2026.05.11 14:41', type: 'revoke', description: '데이터 처리 실패에 따른 반환', delta: 100, balance: 8400},
    {id: 12, date: '2026.05.11 14:41', type: 'use', description: 'B/L 검색', tag: '검색쿼리', detail: {hsCode: '-', keyword: 'led', importer: 'hcom', exporter: '-', exportCountry: 'KR,CN', importCountry: 'VN', searchPeriod: '2023-05-11 ~ 2026-05-11', totalCount: '7건', currentPage: '1 / 1'}, delta: -100, balance: 8300},
    {id: 11, date: '2026.05.11 14:41', type: 'use', description: 'Buyer search', delta: -100, balance: 8400},
    {id: 10, date: '2026.05.11 14:41', type: 'use', description: 'Buyer enrich', delta: -100, balance: 8500},
    {id: 9, date: '2026.05.11 14:41', type: 'use', description: 'People enrich', delta: -100, balance: 8600},
    {id: 8, date: '2026.05.11 14:41', type: 'use', description: 'People number', delta: -100, balance: 8700},
    {id: 7, date: '2026.05.11 14:41', type: 'use', description: 'Buyer Fit', delta: -100, balance: 8800},
    {id: 6, date: '2026.05.11 14:41', type: 'use', description: 'AI Core', delta: -100, balance: 8900},
    {id: 5, date: '2026.05.11 14:41', type: 'grant', description: '대구무역협회제휴 가입 계정 혜택 20%', delta: 1000, balance: 9000},
    {id: 4, date: '2026.05.11 14:41', type: 'grant', description: '해외영업실행 플랜 구독 결제', delta: 3000, balance: 8000},
    {id: 3, date: '2026.05.11 14:41', type: 'grant', description: '회원가입 무료 지급', delta: 5000, balance: 5000},
];

const ITEMS_PER_PAGE = 10;

export default function CreditUsagePopup({uId}: Props) {
    const {closePopup} = usePopupStore();
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['grant', 'use', 'expire', 'revoke']));
    const [currentPage, setCurrentPage] = useState(0);
    const [openDetailId, setOpenDetailId] = useState<number | null>(null);

    const toggleFilter = (type: string) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                next.delete(type);
            } else {
                next.add(type);
            }
            return next;
        });
        setCurrentPage(0);
    };

    const filtered = MOCK_USAGE.filter(r => activeFilters.has(r.type));
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paged = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    const pageGroupSize = 10;
    const displayPage = currentPage + 1;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    const formatDelta = (delta: number) => {
        const sign = delta > 0 ? '+' : '';
        return `${sign}${delta.toLocaleString()}`;
    };

    const getDeltaClass = (type: string) => {
        if (type === 'grant' || type === 'revoke') return 'delta_positive';
        if (type === 'use') return 'delta_negative';
        if (type === 'expire') return 'delta_expire';
        return '';
    };

    return (
        <div className={'alertSection'}>
            <div className={'credit_usage_popup'}>
                {/* 헤더 */}
                <div className={'popup_header'}>
                    <h4>크레딧 사용내역</h4>
                    <div className={'filter_chips'}>
                        {(['grant', 'use', 'expire', 'revoke'] as const).map(type => (
                            <button key={type} type={'button'}
                                    className={`chip ${activeFilters.has(type) ? 'on' : ''} ${TYPE_CLASS[type]}`}
                                    onClick={() => toggleFilter(type)}>
                                {TYPE_LABEL[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 테이블 */}
                <div className={'usage_table_wrap'}>
                    <table style={{tableLayout: 'fixed', width: '100%'}}>
                        <colgroup>
                            <col style={{width: '8%'}}/>
                            <col style={{width: '20%'}}/>
                            <col style={{width: '8%'}}/>
                            <col style={{width: '34%'}}/>
                            <col style={{width: '14%'}}/>
                            <col style={{width: '14%'}}/>
                        </colgroup>
                        <thead>
                        <tr>
                            <th>순번</th>
                            <th>일시</th>
                            <th>유형</th>
                            <th>내역</th>
                            <th className={'num'}>증감</th>
                            <th className={'num'}>잔여 크레딧</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paged.length > 0 ? paged.map((row, i) => {
                            const rowNum = filtered.length - (currentPage * ITEMS_PER_PAGE) - i;
                            return (
                            <tr key={row.id}>
                                <td>{rowNum}</td>
                                <td>{row.date}</td>
                                <td>
                                    <span className={`usage_badge ${TYPE_CLASS[row.type]}`}>{TYPE_LABEL[row.type]}</span>
                                </td>
                                <td className={'desc_cell'}>
                                    {row.description}
                                    {row.detail && (
                                        <span className={'desc_tag_wrap'}>
                                            <button type={'button'} className={'desc_tag'}
                                                    onClick={() => setOpenDetailId(openDetailId === row.id ? null : row.id)}>
                                                {row.tag}
                                            </button>
                                            {openDetailId === row.id && (
                                                <div className={'detail_popup'}>
                                                    <div className={'detail_popup_header'}>
                                                        <strong>BL 검색 쿼리</strong>
                                                        <button type={'button'} onClick={() => setOpenDetailId(null)}>
                                                            <span className={'admin_icon'}/>
                                                        </button>
                                                    </div>
                                                    <dl className={'detail_popup_body'}>
                                                        <dt>HS 코드</dt><dd>{row.detail.hsCode}</dd>
                                                        <dt>키워드</dt><dd>{row.detail.keyword}</dd>
                                                        <dt>수입자</dt><dd>{row.detail.importer}</dd>
                                                        <dt>수출자</dt><dd>{row.detail.exporter}</dd>
                                                        <dt>수출국가</dt><dd>{row.detail.exportCountry}</dd>
                                                        <dt>수입국가</dt><dd>{row.detail.importCountry}</dd>
                                                        <dt>검색기간</dt><dd>{row.detail.searchPeriod}</dd>
                                                        <dt>총 갯수</dt><dd>{row.detail.totalCount}</dd>
                                                        <dt>현재 페이지</dt><dd>{row.detail.currentPage}</dd>
                                                    </dl>
                                                </div>
                                            )}
                                        </span>
                                    )}
                                    {row.tag && !row.detail && <span className={'desc_tag'}>{row.tag}</span>}
                                </td>
                                <td className={`num ${getDeltaClass(row.type)}`}>{formatDelta(row.delta)}</td>
                                <td className={'num'}>{row.balance.toLocaleString()}</td>
                            </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className={'empty'}>데이터가 없습니다.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* 페이지네이션 */}
                <div className={'pagination'}>
                    <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                            onClick={() => setCurrentPage(groupStart - pageGroupSize - 1)}>
                        <span className={'admin_icon'}/>
                    </button>
                    {pageNumbers.map(page => (
                        <button key={page} type="button"
                                className={`btn_page ${page === displayPage ? 'on' : ''}`}
                                onClick={() => setCurrentPage(page - 1)}>{page}</button>
                    ))}
                    <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                            onClick={() => setCurrentPage(groupEnd)}>
                        <span className={'admin_icon'}/>
                    </button>
                </div>

                {/* 닫기 */}
                <div className={'popup_footer'}>
                    <button type={'button'} className={'btn_close'} onClick={() => closePopup(uId ?? '')}>닫기</button>
                </div>
            </div>
        </div>
    );
}