'use client'

import * as XLSX from 'xlsx-js-style';
import React from "react";
import {STATUS_LABELS} from "@/utill/format";
import callApi from "@/utill/apiRequest";
import {UserApiRow} from "@/app/(Auth)/user/components/PageContent";

export default function ExcelDownloadButton({keyword}: { keyword: string }) {

    const downloadUsersExcel = async () => {
        const params = new URLSearchParams();
        if (keyword.trim()) params.set('keyword', keyword.trim());

        const res = await callApi(`/api/admin/members/users/download?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!res.result || !res.data) {
            alert('다운로드에 실패했습니다.');
            return;
        }

        const data = res.data as UserApiRow[];

        const colCount = 14;
        // 1행: 병합 헤더
        const headerRow1: (string | number)[] = [
            '순번', '회원상태', '이메일(ID)', '이름', '전화번호',
            '회사명', '부서', '직함',
            '크레딧 사용현황', '', '', '',
            '회원가입일', '최근접속일',
        ];
        // 2행: 크레딧 서브 헤더
        const headerRow2: (string | number)[] = [
            '', '', '', '', '',
            '', '', '',
            '전체', '사용', '소멸', '잔여',
            '', '',
        ];

        const wsData: (string | number)[][] = [];
        wsData.push(headerRow1);
        wsData.push(headerRow2);

        let no = 1;
        data.forEach(user => {
            wsData.push([
                no++,
                STATUS_LABELS[user.status] || '활성화',
                user.loginId || '',
                user.name || '',
                user.contact || '',
                user.companyName ?? '',
                user.department ?? '',
                user.position ?? '',
                user.creditTotal ?? '',
                user.creditUsed ?? '',
                user.creditExpired ?? '',
                user.creditBalance ?? '',
                user.createdAt ? user.createdAt.substring(0, 10) : '',
                user.lastLoginAt ? user.lastLoginAt.substring(0, 10) : '',
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 셀 병합: 크레딧 사용현황 (I1:L1), 나머지 1행-2행 세로 병합
        ws['!merges'] = [
            // 크레딧 사용현황 가로 병합 (I1:L1)
            {s: {r: 0, c: 8}, e: {r: 0, c: 11}},
            // 나머지 헤더 세로 병합 (1행~2행)
            {s: {r: 0, c: 0}, e: {r: 1, c: 0}},   // 순번
            {s: {r: 0, c: 1}, e: {r: 1, c: 1}},   // 회원상태
            {s: {r: 0, c: 2}, e: {r: 1, c: 2}},   // 이메일(ID)
            {s: {r: 0, c: 3}, e: {r: 1, c: 3}},   // 이름
            {s: {r: 0, c: 4}, e: {r: 1, c: 4}},   // 전화번호
            {s: {r: 0, c: 5}, e: {r: 1, c: 5}},   // 회사명
            {s: {r: 0, c: 6}, e: {r: 1, c: 6}},   // 부서
            {s: {r: 0, c: 7}, e: {r: 1, c: 7}},   // 직함
            {s: {r: 0, c: 12}, e: {r: 1, c: 12}}, // 회원가입일
            {s: {r: 0, c: 13}, e: {r: 1, c: 13}}, // 최근접속일
        ];

        const headerStyle = {
            font: { name: "굴림" },
            alignment: {horizontal: "center", vertical: "center"},
            fill: {fgColor: {rgb: "F2F2F2"}},
            border: {
                top: {style: "thin", color: {rgb: "000000"}},
                bottom: {style: "thin", color: {rgb: "000000"}},
                left: {style: "thin", color: {rgb: "000000"}},
                right: {style: "thin", color: {rgb: "000000"}}
            },
        };

        const centerColumns = ['A', 'B', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
        const bodyBorder = {
            top: {style: "thin", color: {rgb: "000000"}},
            bottom: {style: "thin", color: {rgb: "000000"}},
            left: {style: "thin", color: {rgb: "000000"}},
            right: {style: "thin", color: {rgb: "000000"}}
        };

        const getColLetter = (colIndex: number) => String.fromCharCode(65 + colIndex);

        // 1행, 2행 헤더 스타일
        for (let row = 1; row <= 2; row++) {
            for (let colIndex = 0; colIndex < colCount; colIndex++) {
                const cellRef = getColLetter(colIndex) + row;
                if (!ws[cellRef]) ws[cellRef] = {t: 's', v: ''};
                ws[cellRef].s = headerStyle;
            }
        }

        // 데이터 행 스타일 (3행부터)
        for (let rowIndex = 2; rowIndex < wsData.length; rowIndex++) {
            const row = rowIndex + 1;
            for (let colIndex = 0; colIndex < colCount; colIndex++) {
                const column = getColLetter(colIndex);
                const cellRef = column + row;
                if (!ws[cellRef]) ws[cellRef] = {t: 's', v: ''};

                if (centerColumns.includes(column)) {
                    ws[cellRef].s = {
                        font: { name: "굴림" },
                        alignment: {horizontal: "center", vertical: "center"},
                        border: bodyBorder,
                    };
                } else {
                    ws[cellRef].s = {
                        font: { name: "굴림" },
                        alignment: {vertical: "center"},
                        border: bodyBorder,
                    };
                }
            }
        }

        ws["!rows"] = [{hpt: 25}, {hpt: 25}];

        ws['!cols'] = [
            {width: 5},
            {width: 12},
            {width: 28},
            {width: 14},
            {width: 18},
            {width: 18},
            {width: 14},
            {width: 14},
            {width: 12},
            {width: 12},
            {width: 12},
            {width: 12},
            {width: 14},
            {width: 14},
        ];

        XLSX.utils.book_append_sheet(wb, ws, '사용자 목록');
        XLSX.writeFile(wb, "사용자 목록.xlsx");
    };

    return <button onClick={() => downloadUsersExcel()} className={'excel_btn'}>엑셀 다운로드</button>;
}
