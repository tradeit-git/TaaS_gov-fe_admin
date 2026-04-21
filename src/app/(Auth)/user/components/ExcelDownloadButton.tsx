'use client'


import * as XLSX from 'xlsx-js-style';

import {UserType} from "@/types/user/user";
import React from "react";
import {sortByKey} from "@/utill/compare";
import {STATUS_LABELS} from "@/utill/format";

export default function ExcelDownloadButton(props: {
    users: UserType[],
}) {


    const downloadUsersExcel = () => {
        const data = [...props.users].sort((a, b) => sortByKey(a, b, 'id', 'asc', 'number'));

        const columns = ['순번', '회원상태', '이메일(ID)', '이름', '연락처',
            '크레딧 전체', '크레딧 사용', '크레딧 소멸', '크레딧 잔여',
            '회원가입일', '최근접속일'];
        const wsData: (string | number)[][] = [];
        wsData.push(columns);

        let no = 1;
        data.forEach(user => {
            const credit = user.creditSummary;
            wsData.push([
                no++,
                STATUS_LABELS[user.status] || '활성화',
                user.loginId,
                user.name,
                user.contact,
                credit ? credit.granted : '',
                credit ? credit.used : '',
                credit ? credit.expired : '',
                credit ? credit.balance : '',
                user.createdAt ? user.createdAt.substring(0, 10) : '',
                user.lastLoginAt ? user.lastLoginAt.substring(0, 10) : '',
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        const headerStyle = {
            font: {
                name: "굴림",
            },
            alignment: {horizontal: "center", vertical: "center"},
            fill: {fgColor: {rgb: "F2F2F2"}},
            border: {
                top: {style: "thin", color: {rgb: "000000"}},
                bottom: {style: "thin", color: {rgb: "000000"}},
                left: {style: "thin", color: {rgb: "000000"}},
                right: {style: "thin", color: {rgb: "000000"}}
            },
        };


        const centerColumns = ['A', 'B', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
        const bodyBorder = {
            top: {style: "thin", color: {rgb: "000000"}},
            bottom: {style: "thin", color: {rgb: "000000"}},
            left: {style: "thin", color: {rgb: "000000"}},
            right: {style: "thin", color: {rgb: "000000"}}
        };

        wsData.forEach((_, rowIndex) => {

            const row = rowIndex + 1;
            columns.forEach((_, colIndex) => {
                const _AsciiCodeA = 65
                const column = String.fromCharCode(_AsciiCodeA + colIndex);
                const cellRef = column + row;

                if (!ws[cellRef]) ws[cellRef] = {};

                if (row === 1) {

                    ws[cellRef].s = headerStyle;
                } else {
                    if (centerColumns.includes(column)) {
                        ws[cellRef].s = {
                            font: {
                                name: "굴림",
                            },
                            alignment: {horizontal: "center", vertical: "center"},
                            border: bodyBorder,
                        }
                    } else {
                        ws[cellRef].s = {
                            font: {
                                name: "굴림",
                            },
                            alignment: {vertical: "center"},
                            border: bodyBorder,
                        }
                    }
                }
            });


        })

        ws["!rows"] = [
            {hpt: 25},
        ];

        ws['!cols'] = [
            {width: 5},
            {width: 12},
            {width: 28},
            {width: 14},
            {width: 18},
            {width: 12},
            {width: 12},
            {width: 12},
            {width: 12},
            {width: 14},
            {width: 14},
        ];

        XLSX.utils.book_append_sheet(wb, ws, '사용자 목록');

        XLSX.writeFile(wb, "사용자 목록.xlsx");
    }


    return <button onClick={() => downloadUsersExcel()} className={'excel_btn'}>엑셀 다운로드</button>
}
