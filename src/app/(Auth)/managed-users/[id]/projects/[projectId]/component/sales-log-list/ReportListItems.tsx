import {BuyerSalesLogType} from "@/types/buyer/buyerSalesLog";
import {Dispatch} from "react";

export default function ReportListItems(props : {
    no : number;
    salesLog : BuyerSalesLogType;
    isSelected : boolean;
    onSelect : Dispatch<number>;
}) {
    return (
        <li className={`report_item ${props.isSelected ? 'selected' : ''}`} onClick={() => props.onSelect(props.salesLog.id)}>
            <div className={'first_row'}>
                <label className={'new'}>new</label>
                <span className={'number'}>{props.no}. </span>
                <h4> {props.salesLog.title}</h4>
            </div>
            <div className={'second_row'}>
                <p className={'date'}><span>#</span> {props.salesLog.date}</p>
                <p className={'tag'}><span>#</span> {props.salesLog.topic}</p>
            </div>
        </li>
    )
}