'use client'

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {API_BASE, EMPTY, regionText, TARGET_STATUS_LABELS} from "@/app/(Auth)/domestic-sales/companies/types";
import {
    buildMasterQuery,
    MasterCompanyRow,
    MasterFilters,
    MasterListData,
} from "@/app/(Auth)/domestic-sales/company-info/types";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";
import CompanyFormPopup from "@/app/(Auth)/domestic-sales/company-info/component/CompanyFormPopup";
import TagFilter from "@/app/(Auth)/domestic-sales/component/TagFilter";
import TagEditPopup from "@/app/(Auth)/domestic-sales/component/TagEditPopup";

interface Props {
    data: MasterListData;
    filters: MasterFilters;
    tags: TagRow[];
}

const BASE_PATH = '/domestic-sales/company-info';

export default function MasterListPage({data, filters, tags}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const {appConfig} = useAppConfigStore();
    const divisions = appConfig.administrativeDivisions;

    const {rows, totalElements, totalPages} = data;
    const [adding, setAdding] = useState<number | null>(null);

    const sidoList = useMemo(() => divisions.filter(d => d.level === 1), [divisions]);
    const sigunguList = useMemo(
        () => filters.sidoId ? divisions.filter(d => d.upId === filters.sidoId) : [],
        [filters.sidoId, divisions]);

    const [searchInput, setSearchInput] = useState(filters.keyword);
    useEffect(() => {
        setSearchInput(filters.keyword);
    }, [filters.keyword]);

    const navigate = (next: Partial<MasterFilters>) => {
        const qs = buildMasterQuery({...filters, ...next});
        router.replace(qs ? `${BASE_PATH}?${qs}` : BASE_PATH);
    };

    useEffect(() => {
        if (searchInput === filters.keyword) return;
        const t = setTimeout(() => navigate({keyword: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    /**
     * 관리 대상으로 담는다. 서버가 1차 회차를 자동으로 열고,
     * 예전에 뺐던 기업이면 삭제 행을 되살려 이력까지 같이 돌아온다.
     * <p>
     * 담고 나서 상세로 보내지 않는다 — 여기는 여러 건을 훑으며 고르는 화면이라
     * 한 건 담을 때마다 튕겨나가면 필터와 페이지를 다시 잡아야 한다.
     * 담은 행은 관리상태가 「관리중 →」 링크로 바뀌므로 가고 싶으면 그걸 누르면 된다.
     */
    const addTarget = async (row: MasterCompanyRow) => {
        setAdding(row.customerId);
        const res = await callApi(`${API_BASE}/companies`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({customerId: row.customerId}),
        });
        setAdding(null);

        if (res.result) {
            router.refresh();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '추가에 실패했습니다.'}/>);
        }
    };

    /** 기준 DB 기업정보 수정. 저장하면 태그까지 같이 반영된다 (팝업이 한 폼이다) */
    const editCompany = (row: MasterCompanyRow) => {
        addPopup(<CompanyFormPopup allTags={tags} row={row} onSuccess={() => router.refresh()}/>);
    };

    const editTags = (row: MasterCompanyRow) => {
        addPopup(<TagEditPopup customerId={row.customerId} companyName={row.name} current={row.tags}
                               allTags={tags} onSaved={() => router.refresh()}/>);
    };

    /** 기준 DB 에 없는 기업을 직접 만든다. 등록한 기업만 보이게 검색어를 갈아끼운다 */
    const openRegister = () => {
        addPopup(<CompanyFormPopup allTags={tags}
                                   onSuccess={name => navigate({keyword: name, sidoId: 0, sigunguId: 0, page: 0})}/>);
    };

    const displayPage = filters.page + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: Math.max(0, groupEnd - groupStart + 1)}, (_, i) => groupStart + i);

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>기업정보조회</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>국내고객사영업</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={BASE_PATH}>기업정보조회</Link></li>
                </ul>
            </div>

            <div className={'ds_link_notice'} style={{marginBottom: 16}}>
                국내 기업정보 기준 DB 입니다. 여기서 기업을 찾아 <b>관리기업으로 추가</b>하면 영업 기록을 쌓을 수 있습니다.
                태그를 달아두면 다음에 그 태그로 찾을 수 있습니다.
                <b>기업명</b>이나 <b>태그</b> 칸을 누르면 그 자리에서 고칠 수 있습니다.
            </div>

            <div className={'ds_filter_bar'}>
                <input type="text" className={'ds_keyword'} value={searchInput}
                       onChange={e => setSearchInput(e.target.value)}
                       placeholder={'기업명 · 사업자번호 검색'}/>

                <select value={filters.sidoId}
                        onChange={e => navigate({sidoId: Number(e.target.value), sigunguId: 0, page: 0})}>
                    <option value={0}>시도 전체</option>
                    {sidoList.map(d => <option key={d.id} value={d.id}>{d.nameKr}</option>)}
                </select>

                <select value={filters.sigunguId} disabled={!filters.sidoId}
                        onChange={e => navigate({sigunguId: Number(e.target.value), page: 0})}>
                    <option value={0}>시군구 전체</option>
                    {sigunguList.map(d => <option key={d.id} value={d.id}>{d.nameKr}</option>)}
                </select>

                <TagFilter allTags={tags} value={filters.tagIds}
                           onChange={next => navigate({tagIds: next, page: 0})}/>

                <button type="button" className={`ds_toggle${filters.unmanagedOnly ? ' on' : ''}`}
                        onClick={() => navigate({unmanagedOnly: !filters.unmanagedOnly, page: 0})}>
                    미등록 기업만
                </button>

                <button type="button" className={'ds_ghost_btn'} style={{marginLeft: 'auto'}}
                        onClick={openRegister}>
                    + 고객사 신규등록
                </button>
            </div>

            <div className={'ds_list_head'}>
                <p className={'ds_count'}>총 <b>{totalElements.toLocaleString()}</b>건</p>
            </div>

            <div className={'table_wrap'}>
                <table className={'contact_table'}>
                    <colgroup>
                        <col style={{width: 200}}/>
                        <col style={{width: 130}}/>
                        <col style={{width: 90}}/>
                        <col style={{width: 130}}/>
                        <col style={{width: 140}}/>
                        <col style={{width: 190}}/>
                        <col style={{width: 120}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>기업명</th>
                        <th>사업자번호</th>
                        <th>대표자</th>
                        <th>지역</th>
                        <th>사업분야</th>
                        <th>태그</th>
                        <th>관리상태</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{textAlign: 'center', padding: '40px 0', color: '#999'}}>
                                조회된 기업이 없습니다.
                            </td>
                        </tr>
                    ) : rows.map(row => (
                        <tr key={row.customerId}>
                            <td>
                                <button type="button" className={'ds_cell_edit'} onClick={() => editCompany(row)}>
                                    {row.name}
                                </button>
                            </td>
                            <td>
                                {row.bizNo
                                    ? <span className={'ds_num'}>{row.bizNo}</span>
                                    : <span className={'ds_empty'}>미확인</span>}
                            </td>
                            <td>{row.ceoName || <span className={'ds_empty'}>{EMPTY}</span>}</td>
                            <td>{regionText(row.sidoName, row.sigunguName)}</td>
                            <td>{row.bizField || <span className={'ds_empty'}>{EMPTY}</span>}</td>
                            <td>
                                <button type="button" className={'ds_tag_cell'} onClick={() => editTags(row)}>
                                    {row.tags.length === 0
                                        ? <span className={'ds_tag_add'}>+ 태그</span>
                                        : row.tags.map(t => <span key={t.tagId} className={'ds_tag'}>{t.name}</span>)}
                                </button>
                            </td>
                            <td>
                                {row.targetId ? (
                                    <Link href={`/domestic-sales/companies/${row.targetId}`}>
                                        {TARGET_STATUS_LABELS[row.targetStatus ?? ''] ?? '관리중'} →
                                    </Link>
                                ) : (
                                    <button type="button" className={'ds_ghost_btn'}
                                            disabled={adding === row.customerId}
                                            onClick={() => addTarget(row)}>
                                        {adding === row.customerId ? '추가 중...' : '관리기업 추가'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
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
