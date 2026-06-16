'use client'
import React, {useEffect, useMemo, useRef, useState} from "react";
import BuyerInfoBox from "@/app/(Auth)/project/global-sales/tracker/component/buyer-detail/BuyerInfoBox";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {usePopupStore} from "@/stores/common/popupStore";
import PopupRegister from "@/app/(Auth)/project/global-sales/tracker/component/buyer-list/PopupRegister";
import {BuyerStepEnum, BuyerStepType} from "@/types/enums";
import {safeCompare, sortByKey} from "@/utill/compare";
import ProjectBuyerItem from "@/app/(Auth)/project/global-sales/tracker/component/buyer-list/ProjectBuyerItem";
import Link from "next/link";
import {BuyerSchema, BuyerType} from "@/types/buyer/buyer";
import ExcelDownloadButton from "@/app/(Auth)/project/global-sales/tracker/component/buyer-list/ExcelDownloadButton";
import {useLoadingStore} from "@/stores/common/loadingStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

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
    const {setIsLoading} = useLoadingStore();
    const {selectedProject,buyers,setBuyers} = useProjectTrackerStore();

    const [pageNationOption, setPageNationOption] = useState<PageNationOptionType>({
        page: 1,
        perPage: 7,
    });

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

    const fileInput = useRef<HTMLInputElement>(null);
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ?? []; // 선택된 파일 목록
        if (files.length > 0) {
            const excelExts = ["xlsx","xlsm"];
            const file = files[0];
            // input 초기화
            if (fileInput.current) {
                fileInput.current.value = '';
            }
            const ext = file.name.split('.').pop();
            if(!excelExts.includes(ext?.toLowerCase() ?? "")){
                addPopup(<AlertComponent alertType={"error"} infoContent={"엑셀 파일을 선택해주세요"}/>);
                return false;
            }
            const formData = new FormData();
            formData.append("file", file);

            const options: RequestInit = {
                method: 'POST',
                credentials: 'include',
                body: formData
            }
            const apiRes = await callApi(`/api/admin/project/${selectedProject.id}/buyer/excel-upload`, options);
            if (apiRes.result) {
                const apiData = apiRes.data as BuyerType[];
                setBuyers(apiData);
                addPopup(<AlertComponent alertType={"confirm"} infoContent={"저장 되었습니다"}/>);
            } else {
                if (apiRes.message) {
                    addPopup(<AlertComponent alertType={"error"} infoContent={apiRes.message}/>);
                }
            }
            setIsLoading(false);
        }
    }
    return (
        <section className={'buyer_list_box'}>
            <div className={`contents_wrap ${buyers.length > 0 ? 'noBackground' : ''}`}>
                <div className="sorting_wrap">
                    <div className="left_wrap">
                        <div className={'product_count'}>
                            총 바이어수 : <b>{buyers.length}</b>
                        </div>
                    </div>
                    <div className="right_wrap">
                        {buyers.length > 0 && <ExcelDownloadButton/>}
                        <Link className="main_btn"
                            href={`/api/admin/common/buyer-excel-form`}
                            download={"바이어 DB 등록_표준서식.xlsm"}>엑셀서식 다운로드
                        </Link>
                    </div>
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
                                    <option value={BuyerStepEnum.enum.DB}>DB</option>
                                    <option value={BuyerStepEnum.enum.List}>List</option>
                                    <option value={BuyerStepEnum.enum.Lead}>Lead</option>
                                    <option value={BuyerStepEnum.enum.Target}>Target</option>
                                    <option value={BuyerStepEnum.enum.Client}>Client</option>
                                </select>
                                <input className={'search_box'} type="text"
                                       value={filterOption.searchText}
                                       onChange={(e) => setFilterOption({...filterOption, searchText: e.target.value})}
                                       placeholder={'바이어기업 검색'}/>
                            </div>
                            <div className={'btn_box'}>
                                <input type="file" id="file" ref={fileInput} onChange={handleFileUpload} hidden={true}/>
                                <label htmlFor="file">엑셀 업로드</label>
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