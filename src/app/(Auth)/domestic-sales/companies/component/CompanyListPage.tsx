'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import CompanyListTableBody from "@/app/(Auth)/domestic-sales/companies/component/CompanyListTableBody";
import TagFilter from "@/app/(Auth)/domestic-sales/component/TagFilter";
import TagEditPopup from "@/app/(Auth)/domestic-sales/component/TagEditPopup";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";
import AddTargetPopup from "@/app/(Auth)/domestic-sales/companies/component/AddTargetPopup";
import MultiSelectFilter from "@/app/(Auth)/domestic-sales/companies/component/MultiSelectFilter";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {
    API_BASE,
    buildCompanyQuery,
    CompanyFilters,
    CompanyListData,
    CompanyRow,
    GRADE_FILTER_OPTIONS,
    PAGE_SIZE_OPTIONS,
    RESULT_FILTER_OPTIONS,
    SORT_OPTIONS,
} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    data: CompanyListData;
    filters: CompanyFilters;
    tags: TagRow[];
}

const BASE_PATH = '/domestic-sales/companies';

export default function CompanyListPage({data, filters, tags}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();

    // 풀 SSR: 표시값은 전부 서버 props 에서 파생한다 (URL = 단일 진실)
    const {rows, totalElements, totalPages} = data;
    const currentPage = filters.page;   // 0-based

    // 선택은 지금 보이는 페이지 안에서만 유효하다.
    // 페이지·필터가 바뀌면 화면에 없는 기업이 선택된 채로 남아 사고가 난다
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [working, setWorking] = useState(false);
    useEffect(() => {
        setSelected(new Set());
    }, [rows]);

    const toggleRow = (targetId: number) => setSelected(prev => {
        const next = new Set(prev);
        if (!next.delete(targetId)) next.add(targetId);
        return next;
    });

    /** 기업정보조회 목록과 같은 자리·같은 팝업. 태그는 기준 DB 기업에 붙으므로 customerId 로 저장한다 */
    const editTags = (row: CompanyRow) => {
        addPopup(<TagEditPopup customerId={row.customerId} companyName={row.name} current={row.tags}
                               allTags={tags} onSaved={() => router.refresh()}/>);
    };

    // TODO(임시) 자동 매칭 일괄 실행 버튼. 운영에서 한 번 돌리려고 둔 것이라 쓰고 나면 지운다.
    //   지울 때 이 블록과 아래 「자동 매칭 실행」 버튼 두 군데만 지우면 된다.
    const [rematching, setRematching] = useState(false);
    const runRematch = () => {
        addPopup(<AlertComponent
            alertType={'confirm'}
            infoContent={`사업자번호가 일치하는 미연결 가입계정을 한 번에 붙입니다.
이미 연결된 계정과 관리기업 목록은 건드리지 않습니다.`}
            callback={async () => {
                setRematching(true);
                const res = await callApi(`${API_BASE}/rematch`, {
                    method: 'POST',
                    credentials: 'include',
                });
                setRematching(false);

                if (res.result) {
                    const linked = (res.data as { linked?: number } | null)?.linked ?? 0;
                    addPopup(<AlertComponent alertType={'alert'}
                                             infoContent={`가입계정 ${linked}건을 연결했습니다.`}/>);
                    router.refresh();
                } else {
                    addPopup(<AlertComponent alertType={'alert'}
                                             infoContent={res.message || '실행에 실패했습니다.'}/>);
                }
            }}/>);
    };

    const allOn = rows.length > 0 && selected.size === rows.length;
    const toggleAll = () => setSelected(allOn ? new Set() : new Set(rows.map(r => r.targetId)));

    /**
     * 지금 보고 있는 화면이 곧 방향이다. 기본 조회에는 숨긴 기업이 없으니 숨길 일밖에 없고,
     * 「숨긴 기업만」에는 숨긴 것뿐이니 되돌릴 일밖에 없다. 그래서 버튼이 하나면 된다.
     */
    const bulkStatus = () => {
        const next = filters.dormantOnly ? 'ACTIVE' : 'DORMANT';
        const ids = [...selected];
        addPopup(<AlertComponent
            alertType={'confirm'}
            infoContent={filters.dormantOnly
                ? `${ids.length}건을 다시 보이게 하시겠습니까?`
                : `${ids.length}건을 숨기시겠습니까?
목록 기본 조회에서 빠집니다. 회차와 활동 이력은 그대로 남습니다.`}
            callback={async () => {
                setWorking(true);
                const results = await Promise.all(ids.map(id =>
                    callApi(`${API_BASE}/companies/${id}/status?status=${next}`, {
                        method: 'PUT',
                        credentials: 'include',
                    })));
                setWorking(false);

                // 일부만 실패해도 나머지는 이미 바뀌었다. 새로 그리고 실패한 건수만 알린다
                const failed = results.filter(r => !r.result).length;
                setSelected(new Set());
                router.refresh();
                if (failed > 0) {
                    addPopup(<AlertComponent alertType={'alert'}
                                             infoContent={`${ids.length}건 중 ${failed}건이 실패했습니다.`}/>);
                }
            }}/>);
    };

    // 검색어만 입력 중 로컬 상태. 디바운스 후 네비게이션하고, 서버값이 오면 다시 맞춘다
    const [searchInput, setSearchInput] = useState(filters.keyword);
    useEffect(() => {
        setSearchInput(filters.keyword);
    }, [filters.keyword]);

    const navigate = (next: Partial<CompanyFilters>) => {
        const qs = buildCompanyQuery({...filters, ...next});
        router.replace(qs ? `${BASE_PATH}?${qs}` : BASE_PATH);
    };

    // 활동 본문까지 LIKE 로 훑는 쿼리라 타이핑마다 때리면 안 된다
    useEffect(() => {
        if (searchInput === filters.keyword) return;
        const t = setTimeout(() => navigate({keyword: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    /** 필터가 바뀌면 항상 1페이지로. 안 그러면 결과가 없는 페이지에 남는다 */
    const changeFilter = (key: keyof CompanyFilters) => (value: string | boolean) =>
        navigate({[key]: value, page: 0} as Partial<CompanyFilters>);

    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: Math.max(0, groupEnd - groupStart + 1)}, (_, i) => groupStart + i);

    const sortLabel = SORT_OPTIONS.find(o => o.value === filters.sort)?.label ?? SORT_OPTIONS[0].label;

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>관리기업</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>국내고객사영업</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={BASE_PATH}>관리기업</Link></li>
                </ul>
            </div>

            <div className={'ds_filter_bar'}>
                <input type="text" className={'ds_keyword'} value={searchInput}
                       onChange={e => setSearchInput(e.target.value)}
                       placeholder={'기업명 · 사업자번호 · 활동내용 검색'}/>

                <MultiSelectFilter label={'영업등급'} options={GRADE_FILTER_OPTIONS}
                                   value={filters.salesGrade}
                                   onChange={next => navigate({salesGrade: next, page: 0})}/>

                <MultiSelectFilter label={'진행상태'} options={RESULT_FILTER_OPTIONS}
                                   value={filters.roundResult}
                                   onChange={next => navigate({roundResult: next, page: 0})}/>

                <select value={filters.linked} onChange={e => changeFilter('linked')(e.target.value)}>
                    <option value={''}>가입여부 전체</option>
                    <option value={'true'}>가입계정 있음</option>
                    <option value={'false'}>가입계정 없음</option>
                </select>

                <TagFilter allTags={tags} value={filters.tagIds}
                           onChange={next => navigate({tagIds: next, page: 0})}/>

                <button type="button" className={`ds_toggle${filters.mineOnly ? ' on' : ''}`}
                        onClick={() => changeFilter('mineOnly')(!filters.mineOnly)}>
                    내가 활동한 기업
                </button>

                {/* 기본이 「숨김 제외」다. 숨김은 목록 밖으로 치우려고 만든 상태라
                    전체를 보는 자리를 따로 두지 않았다 — 이걸 켜면 숨긴 것만 나온다.
                    종료(CLOSED)와는 다른 축이다 — 종료는 영업을 끝냈다는 사실이라 목록에 그대로 나온다 */}
                <button type="button" className={`ds_toggle${filters.dormantOnly ? ' on' : ''}`}
                        onClick={() => changeFilter('dormantOnly')(!filters.dormantOnly)}>
                    숨긴 기업만
                </button>

                <select value={filters.sort} onChange={e => changeFilter('sort')(e.target.value)}>
                    {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>

                {/* 관리 대상은 기준 DB 에서 골라 담는다. 여기에 등록 폼을 두지 않는다.
                    페이지를 옮기면 담고 나서 다시 돌아와야 해서 팝업으로 처리한다 */}
                <button type="button" className={'ds_primary_btn'}
                        onClick={() => addPopup(<AddTargetPopup/>)}>
                    + 관리기업 추가
                </button>
            </div>

            <div className={'ds_list_head'}>
                <p className={'ds_count'}>
                    총 <b>{totalElements.toLocaleString()}</b>건
                    {selected.size > 0 && <span className={'ds_sub'}> · 선택 {selected.size}건</span>}
                </p>

                <div className={'ds_list_head_right'}>
                    {/* TODO(임시) 한 번 돌리고 지울 버튼 */}
                    {/*<button type="button" className={'ds_ghost_btn'} disabled={rematching}*/}
                    {/*        onClick={runRematch}>*/}
                    {/*    {rematching ? '실행 중...' : '자동 매칭 실행'}*/}
                    {/*</button>*/}

                    {/* 고른 게 있을 때만 띄웠더니 체크박스가 왜 있는지 알 수가 없었다.
                        늘 보이게 두고 아무것도 안 골랐을 때는 눌리지만 않게 한다 */}
                    <button type="button" disabled={selected.size === 0 || working}
                            className={`ds_status_btn${filters.dormantOnly ? ' restore' : ''}`}
                            onClick={bulkStatus}>
                        {working
                            ? '처리 중...'
                            : `${filters.dormantOnly ? '다시 보이기' : '숨기기'}${selected.size > 0 ? ` (${selected.size})` : ''}`}
                    </button>
                    {/* 개수를 바꾸면 1페이지로 — 5페이지에서 100개씩으로 늘리면 그 페이지가 없다 */}
                    <select className={'ds_page_size'} value={filters.size}
                            onChange={e => navigate({size: Number(e.target.value), page: 0})}>
                        {PAGE_SIZE_OPTIONS.map(n => (
                            <option key={n} value={n}>{n}개씩</option>
                        ))}
                    </select>

                    <span className={'ds_sub'}>정렬 · {sortLabel}</span>
                </div>
            </div>

            <div className={'table_wrap'}>
                <table className={'contact_table'}>
                    {/* 태그 열을 넣느라 나머지를 한 번씩 줄였다. 전체 폭은 넣기 전과 같다 */}
                    <colgroup>
                        <col style={{width: 36}}/>
                        <col style={{width: 160}}/>
                        <col style={{width: 115}}/>
                        <col style={{width: 100}}/>
                        <col style={{width: 150}}/>
                        <col style={{width: 80}}/>
                        <col style={{width: 55}}/>
                        <col style={{width: 90}}/>
                        <col style={{width: 135}}/>
                        <col style={{width: 135}}/>
                        <col style={{width: 80}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th className={'ds_check_cell'}>
                            <input type="checkbox" checked={allOn} disabled={rows.length === 0}
                                   onChange={toggleAll} aria-label={'전체 선택'}/>
                        </th>
                        <th>기업명</th>
                        <th>사업자번호</th>
                        <th>지역</th>
                        <th>태그</th>
                        <th>영업등급</th>
                        <th>회차</th>
                        <th>가입계정</th>
                        <th>영업활동</th>
                        <th>TM 접촉</th>
                        <th>상태</th>
                    </tr>
                    </thead>
                    <CompanyListTableBody data={rows} selected={selected} onToggle={toggleRow}
                                          onEditTags={editTags}/>
                </table>
            </div>

            <div className={'pagination'}>
                <button type="button" className={'btn_prev'} disabled={currentGroup <= 1}
                        onClick={() => navigate({page: groupStart - pageGroupSize - 1})}>
                    <span className={'admin_icon'}/>
                </button>
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => navigate({page: page - 1})}>{page}</button>
                ))}
                <button type="button" className={'btn_next'} disabled={groupEnd >= totalPages}
                        onClick={() => navigate({page: groupEnd})}>
                    <span className={'admin_icon'}/>
                </button>
            </div>
        </div>
    );
}
