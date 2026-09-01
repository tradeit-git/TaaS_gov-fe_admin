'use client'

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import PartnerCreateForm from "@/app/(Auth)/partner-management/component/PartnerCreateForm";
import PartnerEditForm from "@/app/(Auth)/partner-management/component/PartnerEditForm";
import PartnerTableBody from "@/app/(Auth)/partner-management/component/PartnerTableBody";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {
    buildPartnerQuery,
    PartnerCategory,
    PartnerFilters,
    PartnerListData,
    PartnerRow,
} from "@/app/(Auth)/partner-management/component/types";

interface Props {
    data: PartnerListData;
    filters: PartnerFilters;
    /**
     * 이 페이지가 다루는 제휴 카테고리. 화면에 필터를 두지 않고 페이지가 고정으로 넘긴다.
     * 미지정이면 전체(협회제휴관리).
     */
    category?: PartnerCategory;
    title?: string;
    /** 가입명단 등 하위 화면의 라우트 베이스 (기본 /partner-management) */
    basePath?: string;
}

export default function PartnerPage({data, filters, category, title = '협회제휴관리', basePath = '/partner-management'}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();

    // 풀 SSR: 표시값은 전부 서버 props 에서 파생 (URL = 단일 진실)
    const totalElements = data.totalElements;
    const totalPages = data.totalPages;
    const currentPage = filters.page;       // 0-based
    const itemsPerPage = filters.size;

    // 검색어만 입력 중 로컬 상태 (디바운스 후 네비게이션). 네비게이션 완료 시 서버값과 동기화.
    const [searchInput, setSearchInput] = useState(filters.search);
    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    // 즐겨찾기는 서버 렌더를 기다리지 않고 먼저 반영한다. 새 서버 데이터가 오면 비운다.
    const [favoriteOverride, setFavoriteOverride] = useState<Record<number, boolean>>({});
    useEffect(() => {
        setFavoriteOverride({});
    }, [data]);

    const rows = data.rows.map(r => (r.id in favoriteOverride ? {...r, favorite: favoriteOverride[r.id]} : r));

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<PartnerFilters>) => {
        const qs = buildPartnerQuery({...filters, ...next});
        router.replace(qs ? `${basePath}?${qs}` : basePath);
    };

    // 가입명단으로 들고 갈 현재 검색조건. 거기서 "목록으로" 를 누르면 이 상태로 돌아온다.
    const listQuery = buildPartnerQuery(filters);

    // 검색 디바운스 → 네비게이션 (실제로 바뀐 경우만)
    useEffect(() => {
        if (searchInput === filters.search) return;
        const t = setTimeout(() => navigate({search: searchInput, page: 0}), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    const displayPage = currentPage + 1;
    const pageGroupSize = 10;
    const currentGroup = Math.ceil(displayPage / pageGroupSize);
    const groupStart = (currentGroup - 1) * pageGroupSize + 1;
    const groupEnd = Math.min(currentGroup * pageGroupSize, totalPages);
    const pageNumbers = Array.from({length: groupEnd - groupStart + 1}, (_, i) => groupStart + i);

    // 목록을 바꾸는 작업은 현재 필터/페이지 그대로 서버에서 다시 렌더한다.
    const refresh = () => router.refresh();

    const handleOpenCreatePopup = () => {
        addPopup(<PartnerCreateForm category={category} onCreated={refresh}/>);
    };

    const handleReset = () => {
        setSearchInput('');
        router.replace(basePath);
    };

    // 즐겨찾기만 보기 상태면 목록에서 빠져야 하므로 성공 후 서버 렌더를 다시 받는다.
    const handleToggleFavorite = async (row: PartnerRow) => {
        const next = !row.favorite;
        setFavoriteOverride(prev => ({...prev, [row.id]: next}));

        const res = await callApi(`/api/admin/partner-keys/${row.id}/favorite`, {
            method: next ? 'POST' : 'DELETE',
            credentials: 'include',
        });

        if (!res.result) {
            setFavoriteOverride(prev => {
                const rollback = {...prev};
                delete rollback[row.id];
                return rollback;
            });
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '즐겨찾기 처리에 실패했습니다.'}/>);
            return;
        }
        refresh();
    };

    const handleEdit = (row: PartnerRow) => {
        addPopup(<PartnerEditForm partner={row} onEdited={refresh}/>);
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 제휴를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/partner-keys/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                refresh();
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'admin_page partner_page'}>
            <div className={'page_start_box'}>
                <h2>{title}</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={basePath}>{title}</Link></li>
                </ul>
            </div>

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>{totalElements.toLocaleString()} records founds</p>
                <div className={'search_area'}>
                    <select value={filters.status} onChange={e => navigate({status: e.target.value, page: 0})}>
                        <option value="">상태 전체</option>
                        <option value="예정">예정</option>
                        <option value="진행">진행</option>
                        <option value="종료">종료</option>
                    </select>
                    <button type="button"
                            className={`btn_favorite_filter ${filters.favoriteOnly ? 'on' : ''}`}
                            onClick={() => navigate({favoriteOnly: !filters.favoriteOnly, page: 0})}>
                        <span className={'star'}>★</span> 즐겨찾기만
                    </button>
                    <div className={'search_input_wrap'}>
                        <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                               placeholder={'제휴명 검색'}/>
                        {searchInput && <button type="button" className={'btn_clear'}
                                                onClick={() => setSearchInput('')}><span className={'admin_icon'}/></button>}
                    </div>
                    <select value={itemsPerPage} onChange={e => navigate({size: Number(e.target.value), page: 0})}>
                        <option value={15}>15개씩 보기</option>
                        <option value={30}>30개씩 보기</option>
                        <option value={50}>50개씩 보기</option>
                    </select>
                    <button type="button" className={'btn_register'} onClick={handleOpenCreatePopup}>신규등록</button>
                    <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table partner_table'}>
                    <colgroup>
                        <col style={{width: '3%'}}/>
                        <col style={{width: '3.5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '12.5%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '6%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '7%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '5%'}}/>
                        <col style={{width: '19%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>★</th>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th>상태</th>
                        <th>로고</th>
                        <th>제휴기관</th>
                        <th>교유식별자</th>
                        <th>모집기간</th>
                        <th>모집인원</th>
                        <th>보너스 크레딧(%)</th>
                        <th>대시보드 접속코드</th>
                        <th>신청수</th>
                        <th>승인수</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <PartnerTableBody
                        data={rows}
                        totalElements={totalElements}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        formatDate={formatDateDot}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onToggleFavorite={handleToggleFavorite}
                        basePath={basePath}
                        listQuery={listQuery}
                    />
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className={'pagination'}>
                {currentGroup > 1 &&
                    <button type="button" className={'btn_prev'}
                            onClick={() => navigate({page: groupStart - pageGroupSize - 1})}><span
                        className={'admin_icon'}/></button>}
                {pageNumbers.map(page => (
                    <button key={page} type="button"
                            className={`btn_page ${page === displayPage ? 'on' : ''}`}
                            onClick={() => navigate({page: page - 1})}>{page}</button>
                ))}
                {groupEnd < totalPages &&
                    <button type="button" className={'btn_next'}
                            onClick={() => navigate({page: groupEnd})}><span
                        className={'admin_icon'}/></button>}
            </div>
        </div>
    );
}
