'use client';

import {useState, useRef, useEffect, useCallback, useMemo} from "react";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {MemberStatsResponse, MemberStatsRow} from "@/app/(Auth)/partner-management/[id]/user-list/types";

type SortKey =
    | 'latest'
    | 'aiCore'
    | 'blSearch'
    | 'supplyChain'
    | 'buyerEnrich'
    | 'buyerFit'
    | 'salesActivity'
    | 'buyerTotal'
    | 'totalAccess';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    {key: 'latest', label: '최신 승인순'},
    {key: 'aiCore', label: 'AI Core ↓'},
    {key: 'blSearch', label: 'B.L Search ↓'},
    {key: 'supplyChain', label: 'Supply Chain ↓'},
    {key: 'buyerEnrich', label: 'Buyer Enrich ↓'},
    {key: 'buyerFit', label: 'Buyer Fit(적합도분석) ↓'},
    {key: 'salesActivity', label: '영업활동일지 ↓'},
    {key: 'buyerTotal', label: '바이어 등록 ↓'},
    {key: 'totalAccess', label: '총접속수 ↓'},
];

const SIZE = 10;
const PAGE_GROUP = 10;

// 프론트 정렬키 → 백엔드 sort 파라미터 (latest 는 sort 미전송 = 최신 승인순 기본)
const SORT_PARAM: Record<SortKey, string | null> = {
    latest: null,
    aiCore: 'aiCore',
    blSearch: 'blSearch',
    supplyChain: 'supplyChain',
    buyerEnrich: 'buyerEnrich',
    buyerFit: 'buyerFit',
    salesActivity: 'salesLog',
    buyerTotal: 'buyerTotal',
    totalAccess: 'visitDays',
};

const formatNumber = (n: number) => n.toLocaleString();

const formatDate = (d: string | null) => {
    if (!d) return '-';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

// "YYYY-MM-DD"(또는 앞 10자) → 로컬 자정 Date (TZ 밀림 방지)
const parseLocalDate = (s: string): Date => {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtWeek = (d: Date): string =>
    `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
const isoDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface WeekOption {
    label: string; // 화면 표시용 "YY.MM.DD~YY.MM.DD"
    start: string; // API 전송용 "YYYY-MM-DD"
    end: string;
}

export interface StatsPeriod {
    start: string | null; // 크레딧 스케줄 min start_date
    end: string | null; // 크레딧 스케줄 max expiration_date
}

/**
 * 집계 기간 [min, max]을 주(일~토) 단위로 분할해 옵션 목록 생성(최신 주가 앞).
 * - 상한은 min(max, 오늘): 이번 주가 진행 중이면 오늘까지만 끊는다(예: 오늘 목요일 → 일~목).
 * - max(만료일) 없으면 무만료(운영중) → 오늘까지. min(시작일) 없으면 빈 배열.
 */
const generateWeekOptions = (minStr: string | null, maxStr: string | null): WeekOption[] => {
    if (!minStr) return [];
    const min = parseLocalDate(minStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const max = maxStr ? parseLocalDate(maxStr) : today; // 무만료면 오늘까지
    const end = max.getTime() < today.getTime() ? max : today;
    if (end.getTime() < min.getTime()) return [];

    const options: WeekOption[] = [];
    let weekStart = min;
    while (weekStart.getTime() <= end.getTime()) {
        const calSat = addDays(weekStart, 6 - weekStart.getDay()); // 그 주의 토요일
        const weekEnd = calSat.getTime() > end.getTime() ? end : calSat;
        options.push({label: `${fmtWeek(weekStart)}~${fmtWeek(weekEnd)}`, start: isoDate(weekStart), end: isoDate(weekEnd)});
        weekStart = addDays(calSat, 1); // 다음 주 일요일
    }
    return options.reverse();
};

interface Props {
    partnerId: string; // 상세보기 라우팅용 (제휴 PK)
    partnerKey: string;
    // 제휴 대시보드 접속코드. CRM 은 쿠키에서 읽지만 admin 은 제휴 상세에서 받아 그대로 넘긴다.
    code: string;
    // 주 옵션/선택값은 상위(UserListPage)에서 보관 → 탭 전환(언마운트)에도 유지된다.
    statsPeriod: StatsPeriod;
    setStatsPeriod: (p: StatsPeriod) => void;
    selectedWeek: WeekOption | null;
    setSelectedWeek: (w: WeekOption | null) => void;
}

export default function CompanyActivityList({partnerId, partnerKey, code, statsPeriod, setStatsPeriod, selectedWeek, setSelectedWeek}: Props) {
    const router = useRouter();
    const [sortKey, setSortKey] = useState<SortKey>('latest');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<MemberStatsRow[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    // 집계 기간(크레딧 스케줄 min~max)을 주(일~토) 단위로 분할. 기간 없으면 빈 목록.
    const WEEK_OPTIONS = useMemo(
        () => generateWeekOptions(statsPeriod.start, statsPeriod.end),
        [statsPeriod],
    );
    const weekRange = selectedWeek?.label ?? ''; // 트리거 표시용 주 label
    // 주 옵션이 생기면 선택값이 없거나 유효하지 않을 때만 최신 주로 기본 선택(상위 상태 유지).
    useEffect(() => {
        if (WEEK_OPTIONS.length === 0) return;
        if (!selectedWeek || !WEEK_OPTIONS.some(o => o.label === selectedWeek.label)) {
            setSelectedWeek(WEEK_OPTIONS[0]);
        }
    }, [WEEK_OPTIONS, selectedWeek, setSelectedWeek]);
    const [weekOpen, setWeekOpen] = useState(false);
    const [weekDropPos, setWeekDropPos] = useState<{ top: number; left: number }>({top: 0, left: 0});
    const weekRef = useRef<HTMLDivElement>(null);
    const weekTriggerRef = useRef<HTMLButtonElement>(null);

    const openWeekDropdown = useCallback(() => {
        if (weekTriggerRef.current) {
            const rect = weekTriggerRef.current.getBoundingClientRect();
            setWeekDropPos({top: rect.bottom + 4, left: rect.left + rect.width / 2 - 75});
        }
        setWeekOpen(prev => !prev);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (weekRef.current && !weekRef.current.contains(e.target as Node)) setWeekOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchStats = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('size', String(SIZE));
        if (search.trim()) params.set('companyName', search.trim());
        const sortParam = SORT_PARAM[sortKey];
        if (sortParam) {
            params.set('sort', sortParam);
            params.set('direction', 'desc'); // 활동량 많은 순
        }
        if (selectedWeek) {
            params.set('weekStart', selectedWeek.start);
            params.set('weekEnd', selectedWeek.end);
        }
        if (code) params.set('code', code);

        const res = await callApi(
            `/api/crm/partner-keys/common/${encodeURIComponent(partnerKey)}/dashboard/members/stats?${params.toString()}`,
            {method: 'GET', credentials: 'include'},
        );
        if (res.result && res.data) {
            const body = res.data as unknown as MemberStatsResponse;
            setRows(body.content);
            setTotalPages(Math.max(1, body.totalPages));
            setStatsPeriod({start: body.statsStartDate, end: body.statsEndDate});
        }
    }, [partnerKey, code, page, search, sortKey, selectedWeek?.start, selectedWeek?.end, setStatsPeriod]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // 검색 디바운스
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchInput]);

    const handleSort = (key: SortKey) => {
        setSortKey(key);
        setPage(1);
    };

    const currentGroup = Math.ceil(page / PAGE_GROUP);
    const groupStart = (currentGroup - 1) * PAGE_GROUP + 1;
    const groupEnd = Math.min(currentGroup * PAGE_GROUP, totalPages);
    const pageNumbers = Array.from({length: Math.max(0, groupEnd - groupStart + 1)}, (_, i) => groupStart + i);

    return (
        <div className={'v2_activity_list'}>
            {/* 정렬 + 검색 */}
            <div className={'v2_activity_header'}>
                <div className={'v2_sort_buttons'}>
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            className={`v2_sort_btn ${sortKey === opt.key ? 'on' : ''}`}
                            onClick={() => handleSort(opt.key)}
                        >
                            <span className={'content_icon'}/>
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className={'v2_activity_actions'}>
                    <div className={'v2_search_wrap'}>
                        <svg className={'v2_search_icon'} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="#999" strokeWidth="1.5"/>
                            <line x1="10" y1="10" x2="13" y2="13" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="회사명 검색"
                            value={searchInput}
                            name="v2-company-search"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore=""
                            data-form-type="other"
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'v2_table_wrap'}>
                <table className={'v2_table v2_activity_table'}>
                    <colgroup>
                        <col style={{width: '3.5%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '7.5%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4.7%'}}/>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '5.5%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '5.5%'}}/>
                        <col style={{width: '5.8%'}}/>
                        <col style={{width: '6%'}}/>{/* 상세보기 (우측 고정) */}
                    </colgroup>
                    <thead>
                    <tr className={'v2_thead_group'}>
                        <th rowSpan={2}>순번</th>
                        <th rowSpan={2}>회사명</th>
                        <th rowSpan={2}>사업자번호</th>
                        <th colSpan={6} className={'v2_th_group'}>주요기능 이용현황</th>
                        <th colSpan={5} className={'v2_th_group'}>바이어 등록현황</th>
                        <th colSpan={3} className={'v2_th_group'}>접속 트래픽</th>
                        <th rowSpan={2} className={'v2_col_detail'}>상세보기</th>
                    </tr>
                    <tr className={'v2_thead_sub'}>
                        <th>AI<br/>Core</th>
                        <th>B.L<br/>Search</th>
                        <th>Supply<br/>chain</th>
                        <th>Buyer<br/>Enrich</th>
                        <th>Buyer Fit<br/>(적합도분석)</th>
                        <th>영업<br/>활동일지</th>
                        <th><span className={'v2_buyer_badge b1'}>1</span><br/>List</th>
                        <th><span className={'v2_buyer_badge b2'}>2</span><br/>Lead</th>
                        <th><span className={'v2_buyer_badge b3'}>3</span><br/>Target</th>
                        <th><span className={'v2_buyer_badge b4'}>4</span><br/>Client</th>
                        <th>합계</th>
                        <th>
                            <div className={'v2_week_header'}>주간 접속수</div>
                            <div className={`v2_week_custom ${weekOpen ? 'open' : ''}`} ref={weekRef}>
                                <button type="button" className={'v2_week_trigger'} ref={weekTriggerRef} onClick={openWeekDropdown}>
                                    {weekRange}
                                    <span className={'v2_week_arrow'}/>
                                </button>
                                {weekOpen && (
                                    <ul className={'v2_week_dropdown'} style={{top: weekDropPos.top, left: weekDropPos.left}}>
                                        {WEEK_OPTIONS.map(opt => (
                                            <li key={opt.label}>
                                                <button
                                                    type="button"
                                                    className={weekRange === opt.label ? 'on' : ''}
                                                    onClick={() => { setSelectedWeek(opt); setWeekOpen(false); }}
                                                >
                                                    {opt.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </th>
                        <th>총 접속수</th>
                        <th>최근접속일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={18} className={'v2_empty_td'}>등록된 기업 활동 데이터가 없습니다.</td>
                        </tr>
                    ) : rows.map((r, i) => (
                        <tr key={r.id}>
                            <td>{(page - 1) * SIZE + i + 1}</td>
                            <td className={'v2_td_company'} title={r.companyName}>
                                {r.companyName.length > 12 ? r.companyName.slice(0, 12) + '...' : r.companyName}
                            </td>
                            <td>{r.businessNumber || '-'}</td>
                            <td>{formatNumber(r.aiCore)}</td>
                            <td>{formatNumber(r.blSearch)}</td>
                            <td>{formatNumber(r.supplyChain)}</td>
                            <td>{formatNumber(r.buyerEnrich)}</td>
                            <td>{formatNumber(r.buyerFit)}</td>
                            <td>{formatNumber(r.salesLog)}</td>
                            <td>{formatNumber(r.list)}</td>
                            <td>{formatNumber(r.lead)}</td>
                            <td>{formatNumber(r.target)}</td>
                            <td>{formatNumber(r.client)}</td>
                            <td className={'v2_td_total'}>{formatNumber(r.buyerTotal)}</td>
                            <td>
                                {formatNumber(r.weeklyVisitDays)}
                                <span className={'v2_day_suffix'}> 일</span>
                            </td>
                            <td>
                                {formatNumber(r.visitDays)}
                                <span className={'v2_day_suffix'}> 일</span>
                            </td>
                            <td>{formatDate(r.lastLoginAt)}</td>
                            <td className={'v2_col_detail'}>
                                <button type="button" className={'v2_btn_view'}
                                        onClick={() => router.push(`/partner-management/${partnerId}/user-list/${r.id}`)}>
                                    보기
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'v2_pagination'}>
                <button type="button" disabled={currentGroup <= 1} onClick={() => setPage(groupStart - 1)}>‹</button>
                {pageNumbers.map(p => (
                    <button key={p} type="button" className={p === page ? 'on' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button type="button" disabled={groupEnd >= totalPages} onClick={() => setPage(groupEnd + 1)}>›</button>
            </div>
        </div>
    );
}
