'use client'

import * as XLSX from "xlsx-js-style";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {BuyerType} from "@/types/buyer/buyer";

// 업로드 양식과 동일한 헤더 (다운로드 → 수정 → 재업로드 호환)
const HEADERS = [
    "회사명", "국가", "바이어 소재지 및 주소(구글맵 기준)", "웹사이트",
    "회사 연락처1", "회사 연락처2", "회사 메일1", "회사 메일2",
    "주요품목", "페이스북 URL", "링크드인 URL", "유튜브 URL",
];
const STEPS = ["DB", "List", "Lead", "Target", "Client"];

const rowOf = (b: BuyerType): string[] => {
    const contacts = (b.companyContacts ?? "").split(",");
    const emails = (b.companyEmails ?? "").split(",");
    return [
        b.companyName ?? "",
        b.geoCode?.name ?? "",
        b.googleMapAddress ?? "",
        b.homepage ?? "",
        contacts[0] ?? "", contacts[1] ?? "",
        emails[0] ?? "", emails[1] ?? "",
        b.keyItems ?? "",
        b.facebook ?? "", b.linkedin ?? "", b.youtube ?? "",
    ];
};

export default function BuyerExcelDownloadButton() {
    const {buyers, selectedProject} = useProjectTrackerStore();

    const download = () => {
        const wb = XLSX.utils.book_new();
        const whiteBorder = {style: "thin", color: {rgb: "FFFFFF"}};

        STEPS.forEach((step) => {
            const list = (buyers ?? []).filter((b) => b.step === step);
            const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...list.map(rowOf)]);
            ws["!cols"] = HEADERS.map((h) => ({wch: Math.max(14, h.length + 4)}));
            ws["!rows"] = [{hpt: 28}];

            HEADERS.forEach((_, i) => {
                const ref = XLSX.utils.encode_cell({r: 0, c: i});
                if (ws[ref]) ws[ref].s = {
                    fill: {patternType: "solid", fgColor: {rgb: "2E75B6"}},
                    font: {name: "맑은 고딕", sz: 11, bold: true, color: {rgb: "FFFFFF"}},
                    alignment: {horizontal: "center", vertical: "center", wrapText: true},
                    border: {top: whiteBorder, bottom: whiteBorder, left: whiteBorder, right: whiteBorder},
                };
            });
            ws["!autofilter"] = {ref: `A1:${XLSX.utils.encode_col(HEADERS.length - 1)}1`};
            XLSX.utils.book_append_sheet(wb, ws, step);
        });

        const fileName = selectedProject?.name ? `${selectedProject.name}_바이어목록.xlsx` : "바이어목록.xlsx";
        XLSX.writeFile(wb, fileName);
    };

    return (
        <button type="button" className={'excel_down_btn'} onClick={download}>엑셀 다운로드</button>
    );
}
