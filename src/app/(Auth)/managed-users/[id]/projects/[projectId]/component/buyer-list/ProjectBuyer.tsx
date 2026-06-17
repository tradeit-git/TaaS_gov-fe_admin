'use client'
import React, {useEffect, useMemo, useRef, useState} from "react";
import BuyerInfoBox from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-detail/BuyerInfoBox";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {usePopupStore} from "@/stores/common/popupStore";
import PopupRegister from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/PopupRegister";
import {BuyerStepEnum, BuyerStepType} from "@/types/enums";
import {safeCompare, sortByKey} from "@/utill/compare";
import ProjectBuyerItem from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/ProjectBuyerItem";
import BuyerExcelUploadPopup from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/BuyerExcelUploadPopup";
import BuyerExcelDownloadButton from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/BuyerExcelDownloadButton";
import {BuyerSchema} from "@/types/buyer/buyer";

type PageNationOptionType = {
    perPage: number;
    page: number;
}

type FilterOptionType = {
    searchText: string,
    selectedStep: BuyerStepType,
}

type SortByOptionType =
 "companyName_desc"
    | "companyName_asc"
    | "createdAt_desc"
    | "createdAt_asc"

export default function ProjectBuyer() {
    const {addPopup} = usePopupStore();
    const {buyers, setBuyers, infoCollapsed} = useProjectTrackerStore();

    const [pageNationOption, setPageNationOption] = useState<PageNationOptionType>({
        page: 1,
        perPage: 7,
    });

    // 하단 정보 접힘 → perPage 15, 펼침 → 7. 변경 시 현재 첫 행 기준으로 페이지 역산.
    useEffect(() => {
        const newPerPage = infoCollapsed ? 15 : 7;
        setPageNationOption(prev => {
            if (prev.perPage === newPerPage) return prev;
            const firstIdx = prev.perPage * (prev.page - 1);
            const newPage = Math.max(1, Math.floor(firstIdx / newPerPage) + 1);
            return {page: newPage, perPage: newPerPage};
        });
    }, [infoCollapsed]);

    const [filterOption, setFilterOption] = useState<FilterOptionType>({
        searchText: "",
        selectedStep: BuyerStepEnum.enum.DB,
    })

    const [sortByOption, ] = useState<SortByOptionType>("createdAt_desc");

    const filteredBuyers = useMemo(() => {
        if (!buyers || !Array.isArray(buyers)) return [];
        const searchText = filterOption.searchText.toLowerCase();

        return buyers
            .filter((buyer) => {
                const isSearchText =  !searchText || buyer.companyName.toLowerCase().includes(searchText);
                const isBuyerStep = buyer.step === filterOption.selectedStep;
                return  isSearchText && isBuyerStep;
            }).sort((a, b) => {
                switch (sortByOption) {
                    case "createdAt_desc":
                        return sortByKey(a, b, 'createdAt', 'desc', 'date') || safeCompare(b.id, a.id, 'number');
                    case "createdAt_asc":
                        return sortByKey(a, b, 'createdAt', 'asc', 'date') || safeCompare(a.id, b.id, 'number');
                    case "companyName_desc":
                        return sortByKey(a, b, 'companyName', 'desc', 'string') || safeCompare(b.id, a.id, 'number');
                    case "companyName_asc":
                        return sortByKey(a, b, 'companyName', 'asc', 'string') || safeCompare(a.id, b.id, 'number');
                }
            });
        // 2. 정렬
    }, [buyers, filterOption , sortByOption])

    // 단계별 바이어 수 (셀렉트 옵션 표시용)
    const stepCounts = useMemo(() => {
        const counts: Record<string, number> = {DB: 0, List: 0, Lead: 0, Target: 0, Client: 0};
        (buyers ?? []).forEach(b => { if (counts[b.step] !== undefined) counts[b.step]++; });
        return counts;
    }, [buyers]);

    const maxPage = useMemo(() => {
        const {perPage} = pageNationOption;
        return Math.max(Math.floor(filteredBuyers.length / perPage) + (filteredBuyers.length % perPage === 0 ? 0 : 1), 1);
    }, [filteredBuyers, pageNationOption])

    useEffect(() => {
        if (maxPage < pageNationOption.page) {
            setPageNationOption(prev => ({...prev, page: maxPage}));
        }
    }, [maxPage, pageNationOption.page]);

    const displayBuyers = useMemo(() => {
        if (!filteredBuyers || !Array.isArray(filteredBuyers)) return [];
        const {perPage, page} = pageNationOption;
        // 3. 페이지네이션
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return filteredBuyers.slice(start, end);
    }, [filteredBuyers, pageNationOption]);

    const navigationCnt = 10;
    const navigations = useMemo(() => {
        const {page} = pageNationOption;
        const groupStart = Math.floor((page - 1) / navigationCnt) * navigationCnt + 1;
        const groupEnd = Math.min(groupStart + 9, maxPage);
        const result = [];
        for (let i = groupStart; i <= groupEnd; i++) {
            result.push(i);
        }
        return result;
    }, [maxPage, pageNationOption]);

    return (
        <section className={'buyer_list_box'}>
            <div className={'contents_wrap noBackground'}>
                <div className="sorting_wrap">
                    <div className="left_wrap">
                        <div className={'product_count'}>
                            총 바이어수 : <b>{buyers.length}</b>
                        </div>
                    </div>
                    <BuyerExcelDownloadButton/>
                </div>
                <div className={'left_buyer_content'}>
                    <div className={`buyer_table ${!buyers.length ? 'noBackground' : ''}`}>
                        <div className={'buyer_table_top'}>
                            <div className={'left_wrap'}>
                                <select name="buyerGradeFilter" id="buyerGradeFilter"
                                        value={filterOption.selectedStep}
                                        onChange={(e) => setFilterOption({
                                            ...filterOption,
                                            selectedStep: e.target.value as BuyerStepType
                                        })}>
                                    <option value={BuyerStepEnum.enum.DB}>DB ({stepCounts.DB})</option>
                                    <option value={BuyerStepEnum.enum.List}>List ({stepCounts.List})</option>
                                    <option value={BuyerStepEnum.enum.Lead}>Lead ({stepCounts.Lead})</option>
                                    <option value={BuyerStepEnum.enum.Target}>Target ({stepCounts.Target})</option>
                                    <option value={BuyerStepEnum.enum.Client}>Client ({stepCounts.Client})</option>
                                </select>
                                <input className={'search_box'} type="text"
                                       value={filterOption.searchText}
                                       onChange={(e) => setFilterOption({...filterOption, searchText: e.target.value})}
                                       placeholder={'바이어기업 검색'}/>
                            </div>
                            <div className={'btn_box'}>
                                <button onClick={() => addPopup(<BuyerExcelUploadPopup/>)}>엑셀 업로드</button>
                                <button onClick={() => {
                                    addPopup(<PopupRegister buyer={BuyerSchema.parse({})} buyerManagers={[]}/>)
                                }}>신규등록
                                </button>
                            </div>
                        </div>
                        <div className="table_wrap">
                            <table className="contents_box">
                                <colgroup>
                                    <col style={{width: '40px'}}/>
                                    <col style={{width: '53px'}}/>
                                    <col style={{width: '40px'}}/>
                                    <col style={{width: '53px'}}/>
                                    <col style={{width: '212px'}}/>
                                    <col style={{width: '100px'}}/>
                                    <col style={{width: '70px'}}/>
                                {/*  퍼센트로 잡으니까 리스트 없을 때 width 가 줄어들어서 px로 다 고정함.  */}
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>선택</th>
                                    <th>공개</th>
                                    <th>고정</th>
                                    <th>등급</th>
                                    <th>바이어기업명</th>
                                    <th>등록일</th>
                                    <th>관리</th>
                                </tr>
                                </thead>
                                <tbody className="list_box">
                                {
                                    displayBuyers.length > 0
                                        ? displayBuyers.map((buyer, index) => {
                                            const no = (pageNationOption.perPage * (pageNationOption.page - 1)) + index;
                                            return (
                                                <ProjectBuyerItem
                                                    key={buyer.id}
                                                    total={filteredBuyers.length}
                                                    index={no}
                                                    buyer={buyer}
                                                />
                                            );
                                        })
                                        : <tr>
                                            <td className={'no_buyer_list'} colSpan={12}
                                                style={{textAlign: 'center', padding: '20px'}}>
                                                등록된 바이어 데이터가 없습니다.
                                            </td>
                                        </tr>
                                }
                                </tbody>
                            </table>
                        </div>
                        <ul className="pagination">
                            <li
                                className="prev_arrow icon_admin"
                                onClick={() => {
                                    const {page} = pageNationOption;
                                    if ((page - 1) - navigationCnt < 0) return;
                                    const movePage = (Math.floor(((page - 1) - navigationCnt) / navigationCnt) + 1) * navigationCnt;
                                    setPageNationOption({...pageNationOption, page: movePage})
                                }}/>
                            {
                                navigations.map((item) => (
                                    <li
                                        key={item}
                                        className={`page_item ${pageNationOption.page === (item) ? 'on' : ''}`}
                                        onClick={() => {
                                            if (item <= maxPage) setPageNationOption({...pageNationOption, page: item})
                                        }}>{item}</li>
                                ))
                            }
                            <li
                                className="next_arrow icon_admin"
                                onClick={() => {
                                    const {page} = pageNationOption;
                                    const movePage = (Math.floor((page - 1) / navigationCnt) + 1) * navigationCnt + 1;
                                    if (movePage > maxPage) return;
                                    setPageNationOption({...pageNationOption, page: movePage})
                                }}/>
                        </ul>
                    </div>
                    <BuyerInfoBox/>
                </div>
            </div>
        </section>
    )
}