'use client';

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import TmInputDrawer from "@/app/(Auth)/partner-management/[id]/user-list/component/TmInputDrawer";
import {
    ADOPTION_TIMING_LABEL,
    AdoptionTiming,
    DEFAULT_SORT_DIRECTION,
    GRADE_FILTER_LABEL,
    GRADE_FILTER_OPTIONS,
    GradeFilter,
    SIZE_OPTIONS,
    SortDirection,
    SortKey,
    TmMemberResponse,
    TmMemberRow,
    UserListFilters,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

// 방향 화살표는 label 에 넣지 않는다. 선택된 버튼만 현재 방향을, 나머지는 처음 눌렀을 때의 방향(내림차순)을 보여준다.
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    {key: 'latest', label: '최신 승인순'},
    {key: 'noContact', label: '미접촉'},
    {key: 'aiCore', label: 'AI Core'},
    {key: 'blSearch', label: 'B.L Search'},
    {key: 'supplyChain', label: 'Supply Chain'},
    {key: 'buyerEnrich', label: 'Buyer Enrich'},
    {key: 'buyerFit', label: 'Buyer Fit(적합도분석)'},
    {key: 'salesActivity', label: '영업활동일지'},
    {key: 'buyerTotal', label: '바이어 등록'},
    {key: 'totalAccess', label: '총접속수'},
];

const TIMING_OPTIONS: AdoptionTiming[] = ['IMMEDIATE', 'M1', 'M3', 'M6', 'HOLD'];
const NO_CONTACT_THRESHOLD = 7; // 미접촉 경과일 강조 기준

// 새 탭으로 여는 <a href> 는 next/link 를 거치지 않으므로 앱 basePath 를 직접 붙여야 한다.
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const PAGE_GROUP = 10;

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
    data: TmMemberResponse;
    filters: UserListFilters;
    navigate: (next: Partial<UserListFilters>) => void;
}

export default function CompanyActivityList({partnerId, basePath, data, filters, navigate}: Props) {
    const router = useRouter();

    // 풀 SSR: 표시값은 전부 서버 props 에서 파생 (URL = 단일 진실)
    const rows = data.content;
    const totalPages = Math.max(1, data.totalPages);
    const page = filters.page;
    const size = filters.size;

    // TM 입력 드로어 대상 행 (null 이면 닫힘)
    const [tmTarget, setTmTarget] = useState<TmMemberRow | null>(null);

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.q);
    useEffect(() => {
        setSearchInput(filters.q);
    }, [filters.q]);

    useEffect(() => {
        if (searchInput === filters.q) return;
        const t = setTimeout(() => navigate({q: searchInput, page: 1}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    // 같은 정렬을 다시 누르면 방향만 뒤집고, 다른 정렬로 옮기면 내림차순부터 시작한다.
    const toggleSort = (key: SortKey) => {
        if (key === 'latest') {
            navigate({sort: 'latest', dir: DEFAULT_SORT_DIRECTION, page: 1});
            return;
        }
        const dir: SortDirection = filters.sort === key && filters.dir === 'desc' ? 'asc' : DEFAULT_SORT_DIRECTION;
        navigate({sort: key, dir, page: 1});
    };

    // 등급 다중 선택 드롭다운. 바깥을 누르면 닫는다.
    const [gradeOpen, setGradeOpen] = useState(false);
    const gradeRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!gradeOpen) return;
        const onDown = (e: MouseEvent) => {
            if (!gradeRef.current?.contains(e.target as Node)) setGradeOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [gradeOpen]);

    // 필터 없음(= 전체)은 "전부 선택"과 결과가 같으므로 체크박스도 전부 켜서 보여준다.
    const gradeAll = filters.grade.length === 0;
    const gradeChecked = (g: GradeFilter) => gradeAll || filters.grade.includes(g);

    // 체크 토글. 옵션 순서를 유지해야 URL(grade=A,B) 이 선택 순서와 무관하게 일정해진다.
    const toggleGrade = (g: GradeFilter) => {
        const current = gradeAll ? GRADE_FILTER_OPTIONS : filters.grade;
        const next = current.includes(g)
            ? current.filter(v => v !== g)
            : GRADE_FILTER_OPTIONS.filter(o => o === g || current.includes(o));
        // 전부 선택 / 전부 해제는 둘 다 "전체"와 같다. 빈 배열로 정규화해 URL 에 grade 가 남지 않게 한다.
        const all = next.length === 0 || next.length === GRADE_FILTER_OPTIONS.length;
        navigate({grade: all ? [] : next, page: 1});
    };

    const gradeLabel = gradeAll
        ? '등급 전체'
        : filters.grade.length <= 3
            ? `등급 ${filters.grade.map(g => GRADE_FILTER_LABEL[g]).join(', ')}`
            : `등급 ${filters.grade.length}개 선택`;

    const currentGroup = Math.ceil(page / PAGE_GROUP);
    const groupStart = (currentGroup - 1) * PAGE_GROUP + 1;
    const groupEnd = Math.min(currentGroup * PAGE_GROUP, totalPages);
    const pageNumbers = Array.from({length: Math.max(0, groupEnd - groupStart + 1)}, (_, i) => groupStart + i);

    return (
        <div className={'v2_activity_list'}>
            {/* 정렬 + 검색 */}
            <div className={'v2_activity_header'}>
                <div className={'v2_sort_buttons'}>
                    {SORT_OPTIONS.map(opt => {
                        const on = filters.sort === opt.key;
                        // latest 는 백엔드가 방향을 받지 않으므로 화살표도 토글도 없다.
                        const directional = opt.key !== 'latest';
                        const dir = on ? filters.dir : DEFAULT_SORT_DIRECTION;
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                className={`v2_sort_btn ${on ? 'on' : ''}`}
                                title={directional ? (dir === 'desc' ? '내림차순 (다시 누르면 오름차순)' : '오름차순 (다시 누르면 내림차순)') : undefined}
                                onClick={() => toggleSort(opt.key)}
                            >
                                <span className={'content_icon'}/>
                                {opt.label}
                                {directional && <span className={'v2_sort_arrow'}>{dir === 'desc' ? '↓' : '↑'}</span>}
                            </button>
                        );
                    })}
                </div>
                <div className={'v2_activity_actions'}>
                    {/* TM 영업관리 필터 — 등급은 다중 선택 (선택 없음 = 전체) */}
                    <div className={'v2_multi_filter'} ref={gradeRef}>
                        <button type="button"
                                className={`v2_tm_filter v2_multi_filter_btn ${gradeAll ? '' : 'on'}`}
                                onClick={() => setGradeOpen(o => !o)}>
                            <span className={'v2_multi_filter_label'} title={gradeLabel}>{gradeLabel}</span>
                            <span className={'v2_multi_filter_caret'}>▾</span>
                        </button>
                        {gradeOpen && (
                            <div className={'v2_multi_filter_panel'}>
                                {GRADE_FILTER_OPTIONS.map(g => (
                                    <label key={g} className={'v2_multi_filter_item'}>
                                        <input type="checkbox"
                                               checked={gradeChecked(g)}
                                               onChange={() => toggleGrade(g)}/>
                                        <span>{GRADE_FILTER_LABEL[g]}</span>
                                    </label>
                                ))}
                                <button type="button" className={'v2_multi_filter_clear'}
                                        disabled={gradeAll}
                                        onClick={() => navigate({grade: [], page: 1})}>
                                    초기화
                                </button>
                            </div>
                        )}
                    </div>
                    <select className={'v2_tm_filter'} value={filters.timing}
                            onChange={e => navigate({timing: e.target.value, page: 1})}>
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
                            onChange={e => navigate({size: Number(e.target.value), page: 1})}>
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
                <button type="button" disabled={currentGroup <= 1} onClick={() => navigate({page: groupStart - 1})}>‹</button>
                {pageNumbers.map(p => (
                    <button key={p} type="button" className={p === page ? 'on' : ''} onClick={() => navigate({page: p})}>{p}</button>
                ))}
                <button type="button" disabled={groupEnd >= totalPages} onClick={() => navigate({page: groupEnd + 1})}>›</button>
            </div>

            {tmTarget && (
                <TmInputDrawer
                    partnerId={partnerId}
                    row={tmTarget}
                    onClose={() => setTmTarget(null)}
                    onSaved={() => router.refresh()}
                />
            )}
        </div>
    );
}
