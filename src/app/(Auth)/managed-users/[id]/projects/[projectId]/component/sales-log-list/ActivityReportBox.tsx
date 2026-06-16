import {useEffect, useMemo, useState} from "react";
import ReportListItems from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/sales-log-list/ReportListItems"
import {usePopupStore} from "@/stores/common/popupStore";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import {BuyerSalesLogSchema, BuyerSalesLogType} from "@/types/buyer/buyerSalesLog";
import ReportForm from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/sales-log-detail/ReportForm";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import PopupAllView from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/sales-log-list/PopupAllView";
import {safeCompare, sortByKey} from "@/utill/compare";
import {fetchBuyerSalesLogDetail, fetchBuyerSalesLogs} from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/PageComponent";

const tagOptions = ["N/A", "Inquiry", "RFQ", "Quotation"];
type FilterOptionType = {
    tags: string[],
}

export default function ActivityReportBox() {
    const {addPopup} = usePopupStore();
    const {selectedProject, selectedBuyerId, buyers} = useProjectTrackerStore();
    const [buyerSalesLogs, setBuyerSalesLogs] = useState<BuyerSalesLogType[]>([]);

    const [selectedBuyerSalesLogId, setSelectedBuyerSalesLogId] = useState<number>(0);

    useEffect(() => {
        setSelectedBuyerSalesLogId(0);
        const findBuyer = buyers.find(buyer => buyer.id === selectedBuyerId);
        fetchBuyerSalesLogs(selectedProject.id, findBuyer?.id ?? 0).then(res => {
            const {buyerSalesLogs: _buyerSalesLogs} = res;
            setBuyerSalesLogs(_buyerSalesLogs);
        });
    }, [selectedProject, buyers, selectedBuyerId]);
    const [buyerSalesLog, setBuyerSalesLog] = useState<BuyerSalesLogType>(BuyerSalesLogSchema.parse({}));

    useEffect(() => {
        const findBuyerSalesLog = buyerSalesLogs.find(buyerSalesLog => buyerSalesLog.id === selectedBuyerSalesLogId);

        fetchBuyerSalesLogDetail(selectedProject.id, selectedBuyerId, findBuyerSalesLog?.id ?? 0)
            .then(res => {
                const {buyerSalesLog: _buyerSalesLog} = res;
                setBuyerSalesLog(_buyerSalesLog)
            });

    }, [selectedProject, buyerSalesLogs, selectedBuyerSalesLogId]);

    const [filterOption, setFilterOption] = useState<FilterOptionType>({
        tags: tagOptions
    })

    const filteredItems = useMemo(() => {
        if (buyerSalesLogs.length === 0) return [];
        return buyerSalesLogs
            .filter(buyerSalesLog =>
                filterOption.tags.includes(buyerSalesLog.topic))
            .sort((a, b) => sortByKey(a, b, 'date', 'desc', 'date') || safeCompare(b.createdAt, a.createdAt, 'date'));
    }, [buyerSalesLogs, filterOption])

    return (
        <section className={'activityReportBox'}>
            <div className={'report_list'}>
                <ul className={'reportTag_box'}>
                    {tagOptions.map((option, index) => (
                        <li className={'tagSelectedBox'} key={index}>
                            <input type={'checkbox'} id={`tag_${index}`} checked={filterOption.tags.includes(option)}
                                   onChange={(e) => {
                                       const checked = e.target.checked;
                                       if (checked) setFilterOption({
                                           ...filterOption,
                                           tags: [...filterOption.tags, option]
                                       })
                                       else setFilterOption({
                                           ...filterOption,
                                           tags: filterOption.tags.filter(tag => tag !== option)
                                       })
                                   }}/>
                            <label htmlFor={`tag_${index}`}>{option}</label>
                        </li>
                    ))}
                </ul>
                <div className={'activityReportAll'}>
                    <span>등록수 : {buyerSalesLogs.length}건</span>
                    {buyerSalesLogs.length > 0 && (
                        <button className={'view_all'}
                                onClick={async () => {
                                    const buyer = buyers.find(item => item.id === selectedBuyerId);
                                    if (!buyer) {
                                        addPopup(<AlertComponent alertType={"error"} infoContent={"바이어를 선택해 주세요"}/>);
                                        return;
                                    }
                                    const options: RequestInit = {
                                        method: 'GET',
                                        credentials: 'include'
                                    }
                                    const apiRes = await callApi(`/api/admin/managed-users/${useProjectTrackerStore.getState().userId}/projects/${selectedProject.id}/buyer/${buyer.id}/salesLogs`, options);
                                    if (apiRes.result) {
                                        const apiData = apiRes.data as BuyerSalesLogType[];
                                        if (apiData === null || apiData.length === 0) {
                                            addPopup(<AlertComponent alertType={"error"}
                                                                     infoContent={"등록된 영업일지가 없습니다."}/>);
                                            return;
                                        }
                                        addPopup(<PopupAllView buyer={buyer} buyerSalesLogs={apiData}/>);
                                    }
                                }}>View All</button>
                    )}

                </div>
                {selectedBuyerId !== 0 && (
                    <button className={'create_btn'} onClick={() => setSelectedBuyerSalesLogId(0)}>+</button>
                )}
                <ul>
                    {filteredItems.map((item, index) => (
                        <ReportListItems
                            key={index}
                            no={filteredItems.length - index}
                            salesLog={item}
                            isSelected={item.id === selectedBuyerSalesLogId}
                            onSelect={setSelectedBuyerSalesLogId}
                        />
                    ))}
                    {filteredItems.length === 0 && (
                        <li style={{textAlign: 'center', padding: '20px 0', color: '#888'}}>
                            선택된 태그에 해당하는 보고서가 없습니다.
                        </li>
                    )}
                </ul>
            </div>
            <ReportForm buyerSalesLog={buyerSalesLog}
                        onSelect={setSelectedBuyerSalesLogId}
            />
        </section>
    )
}