import {usePopupStore} from "@/stores/common/popupStore";
import {useEffect, useMemo, useState} from "react";
import {BuyerSalesLogType} from "@/types/buyer/buyerSalesLog";
import {BuyerType} from "@/types/buyer/buyer";
import {safeCompare, sortByKey} from "@/utill/compare";
import TxView from "@/components/txContent/TxView";

const tagOptions = ["N/A", "Inquiry", "RFQ", "Quotation"];
type FilterOptionType = {
    tags: string[],
}
type SortByOptionType =
    | "date_desc"
    | "date_asc"

function formatByteToUnit(size: number) {
    const _divide = 1024;
    const _units = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PT'];
    const _step = null;

    size = Number(size);
    if (isNaN(size)) {
        return 'no number';
    }
    for (let i = 0; i < _units.length; i++) {
        if (i === _step) {
            return `${size.toFixed(2)} ${_units[i]}`;
        }
        if (size / _divide < 1) {
            return `${size.toFixed(2)} ${_units[i]}`;
        }
        if (i !== _units.length - 1) {
            size = size / _divide;
        }
    }
    return `${size.toFixed(2)} ${_units.pop()}`;
}


export default function PopupAllView(
    props: {
        uId?: string;
        buyer: BuyerType;
        buyerSalesLogs: BuyerSalesLogType[];
    }
) {
    const {closePopup} = usePopupStore();

    const [filterOption, setFilterOption] = useState<FilterOptionType>({
        tags: tagOptions
    })

    const [sortByOption, setSortByOption] = useState<SortByOptionType>("date_asc");

    const [buyerSalesLogs, setBuyerSalesLogs] = useState<BuyerSalesLogType[]>(props.buyerSalesLogs);
    useEffect(() => {
        setBuyerSalesLogs(props.buyerSalesLogs)
    }, [props.buyerSalesLogs]);


    const filteredItems = useMemo(() => {
        if (buyerSalesLogs.length === 0) return [];
        return buyerSalesLogs
            .filter(buyerSalesLog =>
                filterOption.tags.includes(buyerSalesLog.topic))
            .sort((a, b) => {
                switch (sortByOption) {
                    case "date_desc":
                        return sortByKey(a, b, 'date', 'desc', 'date') || safeCompare(b.createdAt, a.createdAt, 'date')
                    case "date_asc":
                        return sortByKey(a, b, 'date', 'asc', 'date') || safeCompare(a.createdAt, b.createdAt, 'date')
                    default:
                        return 0;
                }
            });
    }, [buyerSalesLogs, filterOption, sortByOption])

    return (
        <section className={'popupSection reportAllView'}>
            <div className={'popupContainer'}>
                <h4>{props.buyer.companyName || '바이어 정보'}</h4>
                <div className={'popupContentTop'}>
                    <div className={'topLeft'}>
                        <p>
                            총 등록수 : {props.buyerSalesLogs.length}건
                        </p>
                        <ul>
                            <li className={sortByOption === 'date_desc' ? 'on' : ''}
                                onClick={() => setSortByOption("date_desc")}>최신등록순
                            </li>
                            <li className={sortByOption === 'date_asc' ? 'on' : ''}
                                onClick={() => setSortByOption("date_asc")}>과거등록순
                            </li>
                        </ul>
                    </div>
                    <ul className={'topRight'}>
                        {tagOptions.map((option, index) => (
                            <li className={'tagSelectedBox'} key={index}>
                                <input type={'checkbox'} id={`tag_${index}`}
                                       checked={filterOption.tags.includes(option)}
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
                </div>
                <div className={'report_all_content'}>
                    {filteredItems.length > 0 ? (
                        <ul>
                            {filteredItems.map((buyerSalesLog) => (
                                <li key={buyerSalesLog.id}>
                                    <span className={'report-date'}>{buyerSalesLog.date}</span>
                                    <div className={'report_content_box'}>
                                        <h5>
                                            <span>{buyerSalesLog.topic}</span>
                                            {buyerSalesLog.title}
                                        </h5>
                                        <div className={'report_file'}>
                                            {/* 첨부파일이 있다면 표시, 없으면 '첨부파일 없음' 메시지 */}
                                            {buyerSalesLog.files && buyerSalesLog.files.length > 0 ? (
                                                buyerSalesLog.files.map((file, fileIndex) => (
                                                    <p key={fileIndex}>{file.s3File.fileName} ({formatByteToUnit(file.s3File.fileSize)})</p> // 파일 크기는 임의로 추가
                                                ))
                                            ) : (
                                                <p>첨부파일 없음</p>
                                            )}
                                        </div>
                                        <div className={'report_content'}>
                                            <TxView className="txt_box" content={buyerSalesLog.content}></TxView>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>표시할 활동 보고서가 없습니다.</p>
                    )}
                </div>
                <div className={'btn_box'}>
                    <button onClick={() => closePopup(props.uId ?? "")}>닫기</button>
                </div>
            </div>
        </section>
    )
}