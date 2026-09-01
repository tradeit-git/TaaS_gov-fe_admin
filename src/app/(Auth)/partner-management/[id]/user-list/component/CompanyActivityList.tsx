'use client';

import {useState, useRef, useEffect, useCallback} from "react";
import callApi from "@/utill/apiRequest";
import TmInputDrawer from "@/app/(Auth)/partner-management/[id]/user-list/component/TmInputDrawer";
import {
    ADOPTION_TIMING_LABEL,
    AdoptionTiming,
    CustomerGrade,
    TmMemberResponse,
    TmMemberRow,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

type SortKey =
    | 'latest'
    | 'noContact'
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
    {key: 'noContact', label: '미접촉 ↓'},
    {key: 'aiCore', label: 'AI Core ↓'},
    {key: 'blSearch', label: 'B.L Search ↓'},
    {key: 'supplyChain', label: 'Supply Chain ↓'},
    {key: 'buyerEnrich', label: 'Buyer Enrich ↓'},
    {key: 'buyerFit', label: 'Buyer Fit(적합도분석) ↓'},
    {key: 'salesActivity', label: '영업활동일지 ↓'},
    {key: 'buyerTotal', label: '바이어 등록 ↓'},
    {key: 'totalAccess', label: '총접속수 ↓'},
];

const GRADE_NONE = 'NONE'; // 등급 미설정 (A~E 와 겹치지 않는 값)
type GradeFilter = CustomerGrade | typeof GRADE_NONE | '';
const GRADE_OPTIONS: CustomerGrade[] = ['A', 'B', 'C', 'D', 'E'];
const TIMING_OPTIONS: AdoptionTiming[] = ['IMMEDIATE', 'M1', 'M3', 'M6', 'HOLD'];
const NO_CONTACT_THRESHOLD = 7; // 미접촉 경과일 강조 기준

// 새 탭으로 여는 <a href> 는 next/link 를 거치지 않으므로 앱 basePath 를 직접 붙여야 한다.
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const SIZE_OPTIONS = [10, 50, 100];
const PAGE_GROUP = 10;

// 프론트 정렬키 → 백엔드 sort 파라미터 (latest 는 sort 미전송 = 최신 승인순 기본)
const SORT_PARAM: Record<SortKey, string | null> = {
    latest: null,
    noContact: 'noContact',
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

interface Props {
    partnerId: string; // 제휴 PK
    basePath: string; // 상세보기 라우팅 베이스 (/partner-management | /poc-management)
}

export default function CompanyActivityList({partnerId, basePath}: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('latest');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(SIZE_OPTIONS[0]);
    const [rows, setRows] = useState<TmMemberRow[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    // TM 영업관리 필터
    const [gradeFilter, setGradeFilter] = useState<GradeFilter>('');
    const [timingFilter, setTimingFilter] = useState<AdoptionTiming | ''>('');
    // TM 입력 드로어 대상 행 (null 이면 닫힘)
    const [tmTarget, setTmTarget] = useState<TmMemberRow | null>(null);

    const fetchStats = useCallback(async () => {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('size', String(size));
        if (search.trim()) params.set('companyName', search.trim());
        const sortParam = SORT_PARAM[sortKey];
        if (sortParam) {
            params.set('sort', sortParam);
            params.set('direction', 'desc'); // 활동량 많은 순
        }
        if (gradeFilter) params.set('grade', gradeFilter);
        if (timingFilter) params.set('adoptionTiming', timingFilter);

        // TM 값(등급/도입시기/접촉)이 섞여 나오므로 CRM 공개 API 가 아니라 어드민 전용 API 를 쓴다.
        const res = await callApi(
            `/api/admin/partner-keys/${partnerId}/tm-members?${params.toString()}`,
            {method: 'GET', credentials: 'include'},
        );
        if (res.result && res.data) {
            const body = res.data as unknown as TmMemberResponse;
            setRows(body.content);
            setTotalPages(Math.max(1, body.totalPages));
        }
    }, [partnerId, page, size, search, sortKey, gradeFilter, timingFilter]);

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
                    {/* TM 영업관리 필터 */}
                    <select className={'v2_tm_filter'} value={gradeFilter}
                            onChange={e => {
                                setGradeFilter(e.target.value as GradeFilter);
                                setPage(1);
                            }}>
                        <option value="">등급 전체</option>
                        {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        <option value={GRADE_NONE}>미설정</option>
                    </select>
                    <select className={'v2_tm_filter'} value={timingFilter}
                            onChange={e => {
                                setTimingFilter(e.target.value as AdoptionTiming | '');
                                setPage(1);
                            }}>
                        <option value="">도입시기 전체</option>
                        {TIMING_OPTIONS.map(t => <option key={t} value={t}>{ADOPTION_TIMING_LABEL[t]}</option>)}
                    </select>
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
                    <select className={'v2_tm_filter'} value={size}
                            onChange={e => {
                                setSize(Number(e.target.value));
                                setPage(1); // 페이지 수가 줄어 현재 페이지가 사라질 수 있다
                            }}>
                        {SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}개씩</option>)}
                    </select>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'v2_table_wrap'}>
                <table className={'v2_table v2_activity_table'}>
                    {/* 상세보기 열 자리를 TM 영업관리 4컬럼이 대신한다 (진입은 미접촉 칸의 ✎ 아이콘) */}
                    <colgroup>
                        <col style={{width: '44px'}}/>{/* 좌측 고정 — CSS sticky left 값과 맞춰야 한다 */}
                        <col style={{width: '170px'}}/>{/* 좌측 고정. 회사명 + 상세보기 아이콘 */}
                        <col style={{width: '4%'}}/>{/* TM 등급 */}
                        <col style={{width: '5.5%'}}/>{/* TM 도입시기 */}
                        <col style={{width: '5.5%'}}/>{/* TM 최근접촉 */}
                        <col style={{width: '6.5%'}}/>{/* TM 미접촉 + ✎ */}
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '4.4%'}}/>
                        <col style={{width: '4.4%'}}/>
                        <col style={{width: '4.4%'}}/>
                        <col style={{width: '4.4%'}}/>
                        <col style={{width: '5.3%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '7.8%'}}/>
                    </colgroup>
                    <thead>
                    <tr className={'v2_thead_group'}>
                        <th rowSpan={2}>순번</th>
                        <th rowSpan={2}>회사명</th>
                        <th colSpan={4} className={'v2_th_group v2_th_tm'}>TM 영업관리</th>
                        <th colSpan={6} className={'v2_th_group'}>주요기능 이용현황</th>
                        <th colSpan={5} className={'v2_th_group'}>바이어 등록현황</th>
                        <th colSpan={2} className={'v2_th_group'}>접속 트래픽</th>
                    </tr>
                    <tr className={'v2_thead_sub'}>
                        <th className={'v2_th_tm'}>등급</th>
                        <th className={'v2_th_tm'}>도입<br/>시기</th>
                        <th className={'v2_th_tm'}>최근<br/>접촉</th>
                        <th className={'v2_th_tm'}>미접촉</th>
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
                        <th>총 접속수</th>
                        <th>최근접속일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={19} className={'v2_empty_td'}>등록된 기업 활동 데이터가 없습니다.</td>
                        </tr>
                    ) : rows.map((r, i) => (
                        <tr key={r.id}>
                            <td>{(page - 1) * size + i + 1}</td>
                            <td className={'v2_td_company'} title={r.companyName}>
                                <span className={'v2_company_name'}>
                                    {r.companyName.length > 11 ? r.companyName.slice(0, 11) + '...' : r.companyName}
                                </span>
                                {/* 상세보기 — TM 입력 중 화면을 잃지 않도록 새 탭으로 연다 */}
                                <a className={'v2_btn_detail'}
                                   href={`${APP_BASE_PATH}${basePath}/${partnerId}/user-list/${r.id}`}
                                   target="_blank" rel="noopener noreferrer"
                                   title={'상세보기 (새 탭)'}>↗</a>
                            </td>
                            {/* TM 영업관리 — 4칸 전체가 드로어 진입 영역 (별도 버튼 컬럼을 두지 않는다) */}
                            <td className={'v2_td_tm'} onClick={() => setTmTarget(r)}>
                                {r.customerGrade
                                    ? <span className={'v2_grade_badge'}>{r.customerGrade}</span>
                                    : <span className={'v2_grade_badge empty'}>–</span>}
                            </td>
                            <td className={'v2_td_tm'} onClick={() => setTmTarget(r)}>
                                {r.adoptionTiming ? ADOPTION_TIMING_LABEL[r.adoptionTiming] : '-'}
                            </td>
                            <td className={'v2_td_tm'} onClick={() => setTmTarget(r)}>
                                {formatDate(r.lastContactedOn)}
                            </td>
                            <td className={'v2_td_tm v2_td_tm_last'} onClick={() => setTmTarget(r)}>
                                {r.noContactDays === null
                                    ? <span className={'v2_no_contact none'}>-</span>
                                    : <span className={`v2_no_contact ${r.noContactDays >= NO_CONTACT_THRESHOLD ? 'warn' : ''}`}>
                                        {r.noContactDays}일
                                    </span>}
                                <button type="button" className={'v2_btn_tm_edit'} title={'TM 입력'}
                                        onClick={e => {
                                            e.stopPropagation();
                                            setTmTarget(r);
                                        }}>✎</button>
                            </td>
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
                                {formatNumber(r.visitDays)}
                                <span className={'v2_day_suffix'}> 일</span>
                            </td>
                            <td>{formatDate(r.lastLoginAt)}</td>
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

            {tmTarget && (
                <TmInputDrawer
                    partnerId={partnerId}
                    row={tmTarget}
                    onClose={() => setTmTarget(null)}
                    onSaved={fetchStats}
                />
            )}
        </div>
    );
}
