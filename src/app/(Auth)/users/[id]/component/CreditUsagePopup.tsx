'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import callApi from "@/utill/apiRequest";
import {formatDateTimeDot} from "@/utill/format";

type TransactionType = 'GRANT' | 'USE' | 'EXPIRE' | 'REVOKE';
type GrantType = 'SUBSCRIPTION' | 'UPGRADE_DIFF' | 'FREE';
type ServiceType =
    | 'BL_SEARCH'
    | 'BUYER_ENRICH'
    | 'BUYER_FIT'
    | 'AI_CORE'
    | 'APOLLO_ORG_SEARCH'
    | 'APOLLO_ORG_ENRICH'
    | 'APOLLO_PEOPLE_ENRICH'
    | 'APOLLO_PHONE_REVEAL';
type ExpireType = 'PERIOD_EXPIRED' | 'OVER_LIMIT';

interface TransactionApiRow {
    id: number;
    transactionDate: string;
    transactionType: TransactionType;
    grantType: GrantType | null;
    serviceType: ServiceType | null;
    expireType: ExpireType | null;
    expiredTargetMonth: string | null;
    amount: number;
    balanceAfter: number;
    walletBalanceAfter: number;
    referenceType: string | null;
    referenceId: number | null;
    eventKey: string | null;
}

export interface TransactionsResponse {
    content: TransactionApiRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

interface BlSearchQuery {
    id: number;
    hash: string;
    hsCode: string;
    productKeyword: string;
    buyerName: string;
    supplierName: string;
    originclCountryCode: string;
    destiCountryCode: string;
    startDate: string;
    endDate: string;
    perPage: number;
    curPage: number;
    total: number;
    rowCount: number;
    createdAt: string;
}

interface BlSearchHistoryDetail {
    id: number;
    userId: number;
    createdAt: string;
    query: BlSearchQuery;
}

interface Props {
    uId?: string;
    userId: number | string;
    planId: number;
    roundId: number;
    initialData: TransactionsResponse;
}

const TYPE_LABEL: Record<Lowercase<TransactionType>, string> = {
    grant: '지급',
    use: '사용',
    expire: '소멸',
    revoke: '회수',
};

const TYPE_CLASS: Record<Lowercase<TransactionType>, string> = {
    grant: 'type_grant',
    use: 'type_use',
    expire: 'type_expire',
    revoke: 'type_revoke',
};

const GRANT_LABEL: Record<GrantType, string> = {
    SUBSCRIPTION: '플랜 구독 결제',
    UPGRADE_DIFF: '업그레이드 차액',
    FREE: '무료 지급',
};

const SERVICE_LABEL: Record<ServiceType, string> = {
    BL_SEARCH: 'BL 검색',
    BUYER_ENRICH: '바이어 Enrichment',
    BUYER_FIT: '바이어 적합도 분석',
    AI_CORE: 'AI Core',
    APOLLO_ORG_SEARCH: 'Apollo 기업 검색',
    APOLLO_ORG_ENRICH: 'Apollo 기업 상세 조회',
    APOLLO_PEOPLE_ENRICH: 'Apollo 직원 이메일 조회',
    APOLLO_PHONE_REVEAL: 'Apollo 직원 전화번호 조회',
};

const EXPIRE_LABEL: Record<ExpireType, string> = {
    PERIOD_EXPIRED: '기간만료',
    OVER_LIMIT: '한도초과',
};

const buildDescription = (row: TransactionApiRow): string => {
    switch (row.transactionType) {
        case 'GRANT':
            return (row.grantType && GRANT_LABEL[row.grantType]) || '지급';
        case 'USE':
            if (!row.serviceType) return '서비스 사용';
            return SERVICE_LABEL[row.serviceType] ?? row.serviceType;
        case 'EXPIRE':
            return (row.expireType && EXPIRE_LABEL[row.expireType]) || '소멸';
        case 'REVOKE':
            return '회수';
        default:
            return '-';
    }
};

const ITEMS_PER_PAGE = 10;

export default function CreditUsagePopup({uId, userId, planId, roundId, initialData}: Props) {
    const {closePopup} = usePopupStore();
    const [activeFilters, setActiveFilters] = useState<Set<Lowercase<TransactionType>>>(
        new Set(['grant', 'use', 'expire', 'revoke'])
    );
    const [currentPage, setCurrentPage] = useState(initialData.currentPage ?? 0);
    const [rows, setRows] = useState<TransactionApiRow[]>(initialData.content);
    const [totalElements, setTotalElements] = useState(initialData.totalElements);
    const [totalPages, setTotalPages] = useState(Math.max(1, initialData.totalPages));
    const [loading, setLoading] = useState(false);
    const isInitial = useRef(true);

    const [openDetailId, setOpenDetailId] = useState<number | null>(null);
    const [blDetail, setBlDetail] = useState<BlSearchHistoryDetail | null>(null);
    const [blDetailLoading, setBlDetailLoading] = useState(false);
    const [blDetailError, setBlDetailError] = useState<string | null>(null);

    const toggleBlDetail = async (rowId: number, referenceId: number) => {
        if (openDetailId === rowId) {
            setOpenDetailId(null);
            setBlDetail(null);
            setBlDetailError(null);
            return;
        }
        setOpenDetailId(rowId);
        setBlDetail(null);
        setBlDetailError(null);
        setBlDetailLoading(true);
        const res = await callApi(`/api/admin/bl-search-histories/${referenceId}`, {
            method: 'GET',
            credentials: 'include',
        });
        setBlDetailLoading(false);
        if (res.result && res.data) {
            setBlDetail(res.data as BlSearchHistoryDetail);
        } else {
            setBlDetailError(res.message || '조회에 실패했습니다.');
        }
    };

    const fetchTransactions = useCallback(async () => {
        // 필터가 모두 해제됐으면 빈 결과 표시 (호출 생략)
        if (activeFilters.size === 0) {
            setRows([]);
            setTotalElements(0);
            setTotalPages(1);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(currentPage));
            params.set('size', String(ITEMS_PER_PAGE));
            // 4개 전체 활성이면 types 미전송 (서버 기본 = 전체)
            if (activeFilters.size < 4) {
                activeFilters.forEach(t => params.append('types', t.toUpperCase()));
            }
            const res = await callApi(
                `/api/admin/members/users/${userId}/credit-plans/${planId}/rounds/${roundId}/transactions?${params.toString()}`,
                {method: 'GET', credentials: 'include'},
            );
            if (res.result && res.data) {
                const body = res.data as TransactionsResponse;
                setRows(body.content);
                setTotalElements(body.totalElements);
                setTotalPages(Math.max(1, body.totalPages));
            } else {
                setRows([]);
                setTotalElements(0);
                setTotalPages(1);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, planId, roundId, currentPage, activeFilters]);

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        fetchTransactions();
    }, [fetchTransactions]);

    const toggleFilter = (type: Lowercase<TransactionType>) => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
        setCurrentPage(0);
    };

    // 필터/페이징 모두 서버 처리 — rows는 이미 필터·페이징 적용된 결과
    const visibleRows = rows;

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

    const getDeltaClass = (type: TransactionType) => {
        if (type === 'GRANT' || type === 'REVOKE') return 'delta_positive';
        if (type === 'USE') return 'delta_negative';
        if (type === 'EXPIRE') return 'delta_expire';
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
                        {visibleRows.length > 0 ? visibleRows.map((row, i) => {
                            const typeLower = row.transactionType.toLowerCase() as Lowercase<TransactionType>;
                            const rowNum = totalElements - (currentPage * ITEMS_PER_PAGE) - i;
                            const hasBlDetail = row.transactionType === 'USE'
                                && row.serviceType === 'BL_SEARCH'
                                && row.referenceId != null;
                            return (
                                <tr key={row.id}>
                                    <td>{rowNum}</td>
                                    <td>{formatDateTimeDot(row.transactionDate)}</td>
                                    <td>
                                        <span className={`usage_badge ${TYPE_CLASS[typeLower]}`}>{TYPE_LABEL[typeLower]}</span>
                                    </td>
                                    <td className={'desc_cell'}>
                                        {buildDescription(row)}
                                        {hasBlDetail && (
                                            <span className={'desc_tag_wrap'}>
                                                <button type={'button'} className={'desc_tag'}
                                                        onClick={() => toggleBlDetail(row.id, row.referenceId!)}>
                                                    검색쿼리
                                                </button>
                                                {openDetailId === row.id && (
                                                    <div className={'detail_popup'}>
                                                        <div className={'detail_popup_header'}>
                                                            <strong>BL 검색 쿼리</strong>
                                                            <button type={'button'} onClick={() => { setOpenDetailId(null); setBlDetail(null); setBlDetailError(null); }}>
                                                                <span className={'admin_icon'}/>
                                                            </button>
                                                        </div>
                                                        {blDetailLoading && <p className={'detail_popup_state'}>불러오는 중...</p>}
                                                        {blDetailError && <p className={'detail_popup_state error'}>{blDetailError}</p>}
                                                        {blDetail && (
                                                            <dl className={'detail_popup_body'}>
                                                                <dt>HS 코드</dt><dd>{blDetail.query.hsCode || '-'}</dd>
                                                                <dt>키워드</dt><dd>{blDetail.query.productKeyword || '-'}</dd>
                                                                <dt>수입자</dt><dd>{blDetail.query.buyerName || '-'}</dd>
                                                                <dt>수출자</dt><dd>{blDetail.query.supplierName || '-'}</dd>
                                                                <dt>수출국가</dt><dd>{blDetail.query.originclCountryCode || '-'}</dd>
                                                                <dt>수입국가</dt><dd>{blDetail.query.destiCountryCode || '-'}</dd>
                                                                <dt>검색기간</dt><dd>{blDetail.query.startDate} ~ {blDetail.query.endDate}</dd>
                                                                <dt>총 갯수</dt><dd>{blDetail.query.total.toLocaleString()}건</dd>
                                                                <dt>현재 페이지</dt><dd>{blDetail.query.curPage} / {Math.max(1, Math.ceil(blDetail.query.total / Math.max(1, blDetail.query.perPage)))}</dd>
                                                            </dl>
                                                        )}
                                                    </div>
                                                )}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`num ${getDeltaClass(row.transactionType)}`}>{formatDelta(row.amount)}</td>
                                    <td className={'num'}>{row.walletBalanceAfter.toLocaleString()}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className={'empty'}>{loading ? '불러오는 중...' : '데이터가 없습니다.'}</td>
                            </tr>
                        )}
                        {Array.from({length: Math.max(0, ITEMS_PER_PAGE - Math.max(1, visibleRows.length))}).map((_, idx) => (
                            <tr key={`placeholder-${idx}`} className={'placeholder_row'} aria-hidden>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                        ))}
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
