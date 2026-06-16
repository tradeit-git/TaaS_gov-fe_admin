'use client'

import * as XLSX from 'xlsx-js-style';
import React from "react";
import {BuyerType} from "@/types/buyer/buyer";
import {BuyerManagerType} from "@/types/buyer/buyerManager";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import callApi from "@/utill/apiRequest";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {BuyerStepEnum} from "@/types/enums";

export default function ExcelDownloadButton() {

    const {appConfig} = useAppConfigStore();
    const {selectedProject} = useProjectTrackerStore();

    function columnIndexToLetter(colIndex: number): string {
        const _AsciiCodeA = 'A'.charCodeAt(0);

        let letter = '';
        colIndex += 1; // Excel은 1-based

        while (colIndex > 0) {
            colIndex--; // A=0 맞춰주기
            letter = String.fromCharCode(_AsciiCodeA + (colIndex % 26)) + letter;
            colIndex = Math.floor(colIndex / 26);
        }

        return letter;
    }

    const fetchData = async () => {
        const result = {
            buyers: [] as BuyerType[],
            managers: [] as BuyerManagerType[],
        }
        const options: RequestInit = {
            method: 'GET',
            credentials: 'include',
        };
        {
            const apiRes = await callApi(`/api/admin/project/${selectedProject.id}/buyer/list`, options);
            if (apiRes.result) {
                const apiData = apiRes.data as BuyerType[];
                result.buyers = [...apiData];
            }
        }
        {
            const apiRes = await callApi(`/api/admin/project/${selectedProject.id}/buyer/manager/list`, options);
            if (apiRes.result) {
                const apiData = apiRes.data as BuyerManagerType[];
                result.managers = [...apiData];
            }
        }

        return result;
    }

    const getWorkSheet = (buyers: BuyerType[], buyerManagers: Record<number, BuyerManagerType[]>, wsData: (string | number)[][], merges: XLSX.Range[]) => {
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
        const bodyBorder = {
            top: {style: "thin", color: {rgb: "000000"}},
            bottom: {style: "thin", color: {rgb: "000000"}},
            left: {style: "thin", color: {rgb: "000000"}},
            right: {style: "thin", color: {rgb: "000000"}}
        };
        const centerColumns = ['C', 'D', 'E', 'H', 'I', 'U', 'AE', 'AO'];
        buyers.forEach((buyer, index) => {
            const row: (string | number)[] = [];
            row.push(index + 1) // no
            row.push(buyer.companyName)
            row.push(appConfig.geoCodes.find(geoCode => geoCode.code === buyer.geoCode.code)?.name ?? "") //국가
            row.push(appConfig.geoCodes.find(geoCode => geoCode.code === buyer.geoCode.code.slice(0, 3))?.name ?? "") //지역
            row.push(appConfig.geoCodes.find(geoCode => geoCode.code === buyer.geoCode.code.slice(0, 1))?.name ?? "") //대륙
            row.push(buyer.googleMapAddress ?? "") // 구글맵  기반 주소
            row.push(buyer.homepage ?? "") // 홈페이지
            if (buyer.currencyUnit) {
                row.push(`${buyer.currencyUnit.isoCode} ${buyer.currencyUnit.symbol}(${buyer.currencyUnit.currencyName})`); //화페단위
                row.push(buyer.currencyUnit.symbol); //통화기호
            } else {
                row.push("");
                row.push("");
            }
            row.push(buyer.revenue ?? ""); // 매출액
            row.push(buyer.keyItems ?? "") // 주요아이템

            const companyContacts = buyer.companyContacts.split(",");
            row.push(companyContacts[0] ?? ""); // 연락처 1
            row.push(companyContacts[1] ?? ""); // 연락처 2
            row.push(companyContacts[2] ?? ""); // 연락처 3

            const companyEmails = buyer.companyEmails.split(",");
            row.push(companyEmails[0] ?? ""); // e-mail 1
            row.push(companyEmails[1] ?? ""); // e-mail 2
            row.push(companyEmails[2] ?? ""); // e-mail 3

            row.push(buyer.facebook ?? "");
            row.push(buyer.linkedin ?? "");
            row.push(buyer.youtube ?? "");

            for (const buyerManager of buyerManagers[buyer.id] ?? []) {
                row.push(buyerManager.role ?? "");
                row.push(buyerManager.name ?? "");
                row.push(buyerManager.position ?? "");
                row.push(buyerManager.contact ?? "");
                row.push(buyerManager.phone ?? "");
                row.push(buyerManager.email ?? "");
                row.push(buyerManager.facebook ?? "");
                row.push(buyerManager.twitter ?? "");
                row.push(buyerManager.linkedin ?? "");
                row.push(buyerManager.instagram ?? "");
            }

            for (let i = 0; i < 3 - (buyerManagers[buyer.id] ?? []).length; i++) {
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
                row.push("");
            }

            wsData.push(row);
        })

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // 셀 병합 적용
        ws['!merges'] = merges;
        wsData.forEach((_, rowIndex) => {
            for (let colIndex = 0; colIndex < wsData[0].length; colIndex++) {
                const column = columnIndexToLetter(colIndex);
                const cellRef = column + (rowIndex + 1);
                if (!ws[cellRef]) ws[cellRef] = {};
                if (rowIndex < 2) {
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
            }
        })

        ws["!rows"] = [
            {hpt: 25}, // 1행의 높이: 30 포인트
        ];

        // 컬럼 너비 설정
        ws['!cols'] = [
            {width: 5},  //A
            {width: 30}, //B
            {width: 15}, //C
            {width: 15}, //D
            {width: 15}, //E
            {width: 30}, //F
            {width: 40}, //G
            {width: 13}, //H
            {width: 13}, //I
            {width: 13}, //J
            {width: 45}, //K
            {width: 20}, //L
            {width: 20}, //M
            {width: 20}, //N
            {width: 20}, //O
            {width: 20}, //P
            {width: 20}, //Q
            {width: 20}, //R
            {width: 20}, //S
            {width: 20}, //T

            {width: 10}, //U
            {width: 10}, //V
            {width: 10}, //W
            {width: 20}, //X
            {width: 20}, //Y
            {width: 20}, //Z
            {width: 20}, //AA
            {width: 20}, //AB
            {width: 20}, //AC
            {width: 20}, //AD

            {width: 10}, //AE
            {width: 10}, //AF
            {width: 10}, //AG
            {width: 20}, //AH
            {width: 20}, //AI
            {width: 20}, //AJ
            {width: 20}, //AK
            {width: 20}, //AL
            {width: 20}, //AM
            {width: 20}, //AN

            {width: 10}, //AO
            {width: 10}, //AP
            {width: 10}, //AQ
            {width: 20}, //AR
            {width: 20}, //AS
            {width: 20}, //AT
            {width: 20}, //AU
            {width: 20}, //AV
            {width: 20}, //AW
            {width: 20}, //AX
        ];

        return ws;
    }


    const downloadUsersExcel = async () => {

        const {buyers, managers} = await fetchData();
        const buyerManagers: Record<number, BuyerManagerType[]> = managers
            .reduce((acc, manager) => {
                const buyerId = manager.buyerId;
                if (!acc[buyerId]) acc[buyerId] = [];
                acc[buyerId].push(manager);
                return acc;
            }, {} as Record<number, BuyerManagerType[]>);

        const companyColumns: Record<string, string[]> = {
            'no': [],
            'company': [],
            'continent - subregion - nation': ['nation', 'sub-region', 'continent'],
            'google map address': [],
            'company website URL': [],
            'sales': ['화페단위', '통화기호', '매출액'],
            'key items': [],
            'company number': ['number_1', 'number_2', 'number_3'],
            'company e-mail': ['e-mail_1', 'e-mail_2', 'e-mail_3'],
            'company sns': ['facebook', 'linked-in', 'youtube']
        }
        const managerColumns: string[] = ['role', 'name', 'position', 'contact number', 'call phone', 'e-mail', 'facebook URL', 'twitter URL', 'linked-in URL', 'instagram URL'];

        const wsData: (string | number)[][] = [[], []];
        const merges: XLSX.Range[] = [];

        let index = 0;
        for (const key of Object.keys(companyColumns)) {
            const subColumns = companyColumns[key];
            const header1: string[] = subColumns.length > 0 ? [key, ...new Array(subColumns.length - 1).fill('')] : [key];
            const header2: string[] = subColumns.length > 0 ? subColumns : [''];
            wsData[0] = [...wsData[0], ...header1]
            wsData[1] = [...wsData[1], ...header2]

            if (subColumns.length === 0) {
                merges.push({
                    s: {r: 0, c: index},
                    e: {r: 1, c: index}
                });
            } else {
                merges.push({
                    s: {r: 0, c: index},
                    e: {r: 0, c: index + subColumns.length - 1}
                });
            }
            index += subColumns.length > 0 ? subColumns.length : 1;
        }
        for (let i = 1; i <= 3; i++) {
            const manager = `person_${i}`;
            const header1: string[] = [manager, ...new Array(managerColumns.length - 1).fill('')];
            const header2: string[] = managerColumns;
            wsData[0] = [...wsData[0], ...header1]
            wsData[1] = [...wsData[1], ...header2]

            if (managerColumns.length === 0) {
                merges.push({
                    s: {r: 0, c: index},
                    e: {r: 1, c: index}
                });
            } else {
                merges.push({
                    s: {r: 0, c: index},
                    e: {r: 0, c: index + managerColumns.length - 1}
                });
            }
            index += managerColumns.length > 0 ? managerColumns.length : 1;
        }

        // 워크시트 생성
        const wb = XLSX.utils.book_new();
        BuyerStepEnum.options.forEach((step) => {
            const buyersByStep = buyers.filter(buyer => buyer.step === step);

            if (buyersByStep.length) {
                // 워크북 생성
                const ws = getWorkSheet(buyersByStep, buyerManagers, [...wsData], merges);
                XLSX.utils.book_append_sheet(wb, ws, step);
            }
        })

        // 파일 다운로드
        XLSX.writeFile(wb, "프로젝트 바이어 목록.xlsx");

        // let no = 1;
        // data.forEach(project => {
        //
        //     const projectPeriod = project.startDate && project.endDate ?
        //         project.startDate + " ~ " + project.endDate : "-";
        //
        //
        //     const creater = project.createdAdmin ?
        //         `${project.createdAdmin.name}(관리자)` : project.createUser.name;
        //
        //     const baseData = [no++, getProjectNo(project), project.createUser.companyName, project.name,
        //         projectPeriod, project.buyerCountPerStep.List ?? 0,
        //         project.buyerCountPerStep.Lead ?? 0,
        //         project.buyerCountPerStep.Client ?? 0,
        //         project.buyerCountPerStep.Target ?? 0, project.totalSalesLogCount, creater, project.createdAt.substring(0, 10)];
        //
        //     // 자격증이 없는 경우
        //     wsData.push([...baseData]);
        // });


        return;


    }

    return <button onClick={() => downloadUsersExcel()} className={'strongGray_btn'}>바이어 데이터 다운로드</button>
}