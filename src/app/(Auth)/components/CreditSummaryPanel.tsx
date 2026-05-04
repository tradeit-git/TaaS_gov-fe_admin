'use client'

import {useEffect, useMemo, useRef, useState} from "react";
import callApi from "@/utill/apiRequest";

export type CreditTransactionType = 'GRANT' | 'USE' | 'EXPIRE' | 'REVOKE';
export type CreditGrantType = 'FREE' | 'SUBSCRIPTION' | 'UPGRADE_DIFF';
export type CreditServiceType =
    | 'BUYER_ENRICH'
    | 'BUYER_FIT'
    | 'AI_CORE'
    | 'BL_SEARCH'
    | 'APOLLO_ORG_SEARCH'
    | 'APOLLO_ORG_ENRICH'
    | 'APOLLO_PEOPLE_ENRICH'
    | 'APOLLO_PHONE_REVEAL';
export type CreditExpireType = 'PERIOD_EXPIRED' | 'OVER_LIMIT';

export interface CreditTransactionResponse {
    id: number;
    transactionType: CreditTransactionType;
    grantType: CreditGrantType | null;
    serviceType: CreditServiceType | null;
    expireType: CreditExpireType | null;
    expiredTargetMonth: string | null;
    amount: number;
    balanceAfter: number;
    eventKey?: string;
    referenceType?: string | null;
    referenceId?: number | null;
    transactionDate: string;
}

interface BalanceResponse {
    freeBalance: number;
    paidBalance: number;
    totalBalance: number;
}

interface TransactionsPage {
    content: CreditTransactionResponse[];
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

const TRANSACTION_TYPE_LABEL: Record<CreditTransactionType, string> = {
    GRANT: '지급',
    USE: '사용',
    EXPIRE: '소멸',
    REVOKE: '회수',
};

const GRANT_TYPE_LABEL: Record<CreditGrantType, string> = {
    FREE: '무료 지급',
    SUBSCRIPTION: '구독 지급',
    UPGRADE_DIFF: '업그레이드 차액',
};

const SERVICE_TYPE_LABEL: Record<CreditServiceType, string> = {
    BUYER_ENRICH: '바이어 Enrichment',
    BUYER_FIT: '바이어 적합도 분석',
    AI_CORE: 'AI Core',
    BL_SEARCH: 'BL 검색',
    APOLLO_ORG_SEARCH: 'Apollo 기업 검색',
    APOLLO_ORG_ENRICH: 'Apollo 기업 상세 조회',
    APOLLO_PEOPLE_ENRICH: 'Apollo 직원 이메일 조회',
    APOLLO_PHONE_REVEAL: 'Apollo 직원 전화번호 조회',
};

const EXPIRE_TYPE_LABEL: Record<CreditExpireType, string> = {
    PERIOD_EXPIRED: '기간 만료',
    OVER_LIMIT: '한도 초과',
};

const TRANSACTION_TYPES: CreditTransactionType[] = ['GRANT', 'USE', 'EXPIRE', 'REVOKE'];

const MOCK_TRANSACTIONS: CreditTransactionResponse[] = [
    {id: 1, transactionType: 'GRANT', grantType: 'SUBSCRIPTION', serviceType: null, expireType: null, expiredTargetMonth: null, amount: 5000, balanceAfter: 5000, transactionDate: '2026-04-01T00:00:01'},
    {id: 2, transactionType: 'USE', grantType: null, serviceType: 'BUYER_ENRICH', expireType: null, expiredTargetMonth: null, amount: -50, balanceAfter: 4950, transactionDate: '2026-04-15T11:23:00'},
    {id: 3, transactionType: 'USE', grantType: null, serviceType: 'APOLLO_ORG_SEARCH', expireType: null, expiredTargetMonth: null, amount: -120, balanceAfter: 4830, transactionDate: '2026-04-22T09:45:12'},
    {id: 4, transactionType: 'USE', grantType: null, serviceType: 'BUYER_FIT', expireType: null, expiredTargetMonth: null, amount: -300, balanceAfter: 4530, transactionDate: '2026-04-25T16:21:33'},
    {id: 5, transactionType: 'EXPIRE', grantType: null, serviceType: null, expireType: 'PERIOD_EXPIRED', expiredTargetMonth: '2026-03', amount: -200, balanceAfter: 4330, transactionDate: '2026-04-28T00:00:00'},
];

const formatTransactionDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

const describeTransaction = (t: CreditTransactionResponse): string => {
    if (t.transactionType === 'GRANT') {
        return t.grantType ? GRANT_TYPE_LABEL[t.grantType] : '지급';
    }
    if (t.transactionType === 'USE') {
        if (!t.serviceType) return '서비스 사용';
        return SERVICE_TYPE_LABEL[t.serviceType] ?? t.serviceType;
    }
    if (t.transactionType === 'EXPIRE') {
        const base = t.expireType ? EXPIRE_TYPE_LABEL[t.expireType] : '소멸';
        if (t.expiredTargetMonth) {
            const [year, month] = t.expiredTargetMonth.split('-');
            return `${base} (${year}년 ${month}월)`;
        }
        return base;
    }
    if (t.transactionType === 'REVOKE') {
        return '회수';
    }
    return '';
};

const transactionTypeClass = (type: CreditTransactionType) => {
    if (type === 'GRANT') return 'type_grant';
    if (type === 'USE') return 'type_use';
    if (type === 'REVOKE') return 'type_revoke';
    return 'type_expire';
};

interface Props {
    userId?: number;
}

export default function CreditSummaryPanel({userId}: Props) {
    const [balance, setBalance] = useState<BalanceResponse | null>(null);
    const [transactions, setTransactions] = useState<CreditTransactionResponse[]>(userId ? [] : MOCK_TRANSACTIONS);
    const [filterTypes, setFilterTypes] = useState<CreditTransactionType[]>([...TRANSACTION_TYPES]);
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const [blDetailRefId, setBlDetailRefId] = useState<number | null>(null);
    const [blDetail, setBlDetail] = useState<BlSearchHistoryDetail | null>(null);
    const [blDetailLoading, setBlDetailLoading] = useState(false);
    const [blDetailError, setBlDetailError] = useState<string | null>(null);
    const [popoverPos, setPopoverPos] = useState<{top: number; left: number}>({top: 0, left: 0});
    const popoverRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            const [balanceRes, txRes] = await Promise.all([
                callApi(`/api/admin/users/${userId}/credits/balance`, {method: 'GET', credentials: 'include'}),
                callApi(`/api/admin/users/${userId}/credits/transactions?page=0&size=10000`, {method: 'GET', credentials: 'include'}),
            ]);
            if (cancelled) return;
            if (balanceRes.result && balanceRes.data) {
                setBalance(balanceRes.data as BalanceResponse);
            }
            if (txRes.result && txRes.data) {
                const body = txRes.data as TransactionsPage;
                setTransactions(body.content);
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const summary = useMemo(() => {
        let granted = 0;
        let used = 0;
        let expired = 0;
        for (const t of transactions) {
            if (t.transactionType === 'GRANT') granted += t.amount;
            else if (t.transactionType === 'USE') used += Math.abs(t.amount);
            else if (t.transactionType === 'EXPIRE') expired += Math.abs(t.amount);
        }
        const remaining = balance?.totalBalance ?? (transactions.length > 0
            ? [...transactions].sort((a, b) =>
                new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
            )[0].balanceAfter
            : 0);
        return {total: granted, granted, expired, used, remaining};
    }, [transactions, balance]);

    const filtered = useMemo(() => {
        return [...transactions]
            .sort((a, b) => {
                const diff = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
                return diff !== 0 ? diff : b.id - a.id;
            })
            .filter(t => filterTypes.includes(t.transactionType));
    }, [transactions, filterTypes]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

    const toggleFilter = (type: CreditTransactionType) => {
        setFilterTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
        setPage(0);
    };

    const closeBlDetail = () => {
        setBlDetailRefId(null);
        setBlDetail(null);
        setBlDetailError(null);
    };

    const handleBlDetail = async (e: React.MouseEvent<HTMLButtonElement>, referenceId: number) => {
        e.stopPropagation();
        if (blDetailRefId === referenceId) {
            closeBlDetail();
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const popoverWidth = 320;
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - popoverWidth - 8));
        setPopoverPos({top: rect.bottom + 6, left});
        setBlDetailRefId(referenceId);
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

    useEffect(() => {
        if (blDetailRefId === null) return;
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (popoverRef.current?.contains(target)) return;
            if (target.closest('.btn_bl_detail')) return;
            closeBlDetail();
        };
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [blDetailRefId]);

    return (
        <aside className={'credit_summary'}>
            <section className={'summary_cards'}>
                <div className={'panel_title'}>
                    <span className={'admin_icon'}/>
                    크레딧 현황
                </div>
                <ul className={'cards'}>
                    <li className={'card primary'}>
                        <p className={'label'}>총 크레딧</p>
                        <p className={'value'}>{summary.total.toLocaleString()}</p>
                    </li>
                    <li className={'card granted'}>
                        <p className={'label'}>지급</p>
                        <p className={'value'}>{summary.granted.toLocaleString()}</p>
                    </li>
                    <li className={'card expired'}>
                        <p className={'label'}>소멸</p>
                        <p className={'value'}>{summary.expired.toLocaleString()}</p>
                    </li>
                    <li className={'card used'}>
                        <p className={'label'}>사용</p>
                        <p className={'value'}>{summary.used.toLocaleString()}</p>
                    </li>
                    <li className={'card remaining'}>
                        <p className={'label'}>남은 크레딧</p>
                        <p className={'value'}>{summary.remaining.toLocaleString()}</p>
                    </li>
                </ul>
            </section>
            <section className={'usage_history'}>
                <div className={'panel_title'}>
                    <span className={'admin_icon'}/>
                    크레딧 사용 내역
                    <div className={'filter_chips'}>
                        {TRANSACTION_TYPES.map(type => (
                            <button key={type} type="button"
                                    className={`chip ${filterTypes.includes(type) ? 'on' : ''}`}
                                    onClick={() => toggleFilter(type)}>
                                {TRANSACTION_TYPE_LABEL[type]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={'history_table_wrap'}>
                    <table>
                        <colgroup>
                            <col width={'50px'}/>
                            <col width={'140px'}/>
                            <col width={'80px'}/>
                            <col/>
                            <col width={'90px'}/>
                            <col width={'100px'}/>
                        </colgroup>
                        <thead>
                        <tr>
                            <th className={'center'}>순번</th>
                            <th>일시</th>
                            <th>유형</th>
                            <th>내역</th>
                            <th className={'num'}>증감</th>
                            <th className={'num'}>잔여</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pageData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className={'empty'}>크레딧 사용 내역이 없습니다.</td>
                            </tr>
                        ) : pageData.map((t, i) => {
                            const no = filtered.length - (page * pageSize + i);
                            const isPositive = t.amount >= 0;
                            const hasBlDetail = t.transactionType === 'USE'
                                && t.serviceType === 'BL_SEARCH'
                                && t.referenceId != null;
                            return (
                                <tr key={t.id}>
                                    <td className={'center'}>{no}</td>
                                    <td>{formatTransactionDate(t.transactionDate)}</td>
                                    <td>
                                        <span className={`type_badge ${transactionTypeClass(t.transactionType)}`}>
                                            {TRANSACTION_TYPE_LABEL[t.transactionType]}
                                        </span>
                                    </td>
                                    <td className={'desc_cell'}>
                                        <span className={'desc_text'} title={describeTransaction(t)}>{describeTransaction(t)}</span>
                                        {hasBlDetail && (
                                            <button type="button" className={'btn_bl_detail'}
                                                    onClick={e => handleBlDetail(e, t.referenceId!)}>
                                                자세히
                                            </button>
                                        )}
                                    </td>
                                    <td className={`num delta ${t.transactionType === 'EXPIRE' || t.transactionType === 'REVOKE' ? 'expire' : isPositive ? 'positive' : 'negative'}`}>
                                        {isPositive ? '+' : ''}{t.amount.toLocaleString()}
                                    </td>
                                    <td className={'num balance'}>{t.balanceAfter.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className={'history_pagination'}>
                        <button type="button" className={'btn_prev'} disabled={page <= 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}>이전</button>
                        <span className={'page_info'}>{page + 1} / {totalPages}</span>
                        <button type="button" className={'btn_next'} disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>다음</button>
                    </div>
                )}
            </section>
            {blDetailRefId !== null && (
                <div ref={popoverRef} className={'bl_detail_popover'}
                     style={{position: 'fixed', top: popoverPos.top, left: popoverPos.left}}>
                    <div className={'popover_header'}>
                        <span>BL 검색 쿼리</span>
                        <button type="button" className={'btn_close'} onClick={closeBlDetail}>×</button>
                    </div>
                    {blDetailLoading && <p className={'popover_state'}>불러오는 중...</p>}
                    {blDetailError && <p className={'popover_state error'}>{blDetailError}</p>}
                    {blDetail && (
                        <dl className={'popover_body'}>
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
        </aside>
    );
}
