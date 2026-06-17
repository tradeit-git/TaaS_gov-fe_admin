'use client'

import React, {ChangeEvent, useMemo, useRef, useState} from "react";
import * as XLSX from "xlsx-js-style";
import {usePopupStore} from "@/stores/common/popupStore";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import PopupRegisterNationSearch from "@/app/(Auth)/managed-users/[id]/projects/[projectId]/component/buyer-list/PopupRegisterNationSearch";
import {BuyerSchema, BuyerType} from "@/types/buyer/buyer";
import {GeoCodeDataTypeEnum, GeoCodeSchema, GeoCodeType} from "@/types/common/geoCode";

/** 엑셀 헤더 ↔ 데이터 키 매핑 (양식 다운로드 헤더와 동일해야 매칭됨). companyName만 필수. */
const COLUMN_MAP: { header: string; key: string; required?: boolean }[] = [
    {header: "회사명", key: "companyName", required: true},
    {header: "국가", key: "country"},
    {header: "바이어 소재지 및 주소(구글맵 기준)", key: "googleMapAddress"},
    {header: "웹사이트", key: "homepage"},
    {header: "회사 연락처1", key: "companyContact1"},
    {header: "회사 연락처2", key: "companyContact2"},
    {header: "회사 메일1", key: "companyEmail1"},
    {header: "회사 메일2", key: "companyEmail2"},
    {header: "주요품목", key: "keyItems"},
    {header: "페이스북 URL", key: "facebook"},
    {header: "링크드인 URL", key: "linkedin"},
    {header: "유튜브 URL", key: "youtube"},
];

const COUNTRY_KEY = "country";
const COUNTRY_HEADER = "국가";
const CHUNK_SIZE = 10;   // 행마다 구글맵 위경도/시차 병렬 조회 → BE 권장 10건 단위
const EXCEL_EXTS = ["xlsx", "xlsm", "xls"];

type RenderCol =
    | { type: "text"; header: string; key: string; required?: boolean }
    | { type: "textarea"; header: string; key: string }
    | { type: "country"; header: string }
    | { type: "stack"; header: string; keys: [string, string] };

const RENDER_COLUMNS: RenderCol[] = [
    {type: "text", header: "회사명", key: "companyName", required: true},
    {type: "country", header: "국가"},
    {type: "textarea", header: "소재지 주소", key: "googleMapAddress"},
    {type: "text", header: "웹사이트", key: "homepage"},
    {type: "stack", header: "회사 연락처", keys: ["companyContact1", "companyContact2"]},
    {type: "stack", header: "회사 메일", keys: ["companyEmail1", "companyEmail2"]},
    {type: "textarea", header: "주요품목", key: "keyItems"},
    {type: "text", header: "페이스북", key: "facebook"},
    {type: "text", header: "링크드인", key: "linkedin"},
    {type: "text", header: "유튜브", key: "youtube"},
];

interface Row {
    data: Record<string, string>;
    geoCode: GeoCodeType;
    countryRaw: string;
    countryMatched: boolean;
}

// 발음기호 제거 + 소문자 + 트림
const norm = (s: string) =>
    s.normalize("NFD").replace(new RegExp("[̀-ͯ]", "g"), "").toLowerCase().trim();

export default function BuyerExcelUploadPopup({uId}: { uId?: string }) {
    const {addPopup, closePopup} = usePopupStore();
    const {appConfig} = useAppConfigStore();
    const {userId, selectedProject, buyers, setBuyers} = useProjectTrackerStore();

    const fileInput = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState<Row[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);

    const baseBuyer = useMemo<BuyerType>(() => BuyerSchema.parse({}), []);

    // config 국가 리스트 → 이름/ISO 후보로 역인덱스
    const countryIndex = useMemo(() => {
        const map = new Map<string, GeoCodeType>();
        appConfig.geoCodes
            .filter((g) => g.type === GeoCodeDataTypeEnum.enum.COUNTRY)
            .forEach((c) => {
                [c.name, c.isoCode ?? "", c.countryCode ?? "", c.code].forEach((n) => {
                    const k = norm(String(n));
                    if (k && !map.has(k)) map.set(k, c);
                });
            });
        return map;
    }, [appConfig.geoCodes]);

    const matchCountry = (raw: string): GeoCodeType | null => {
        const k = norm(raw);
        return k ? countryIndex.get(k) ?? null : null;
    };

    const close = () => {
        if (uploading) return;
        closePopup(uId ?? "");
    };

    // 빈 양식(헤더만) 다운로드
    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([COLUMN_MAP.map((c) => c.header)]);
        ws["!cols"] = COLUMN_MAP.map((c) => ({wch: Math.max(14, c.header.length + 6)}));
        ws["!rows"] = [{hpt: 32}];

        const whiteBorder = {style: "thin", color: {rgb: "FFFFFF"}};
        COLUMN_MAP.forEach((c, i) => {
            const ref = XLSX.utils.encode_cell({r: 0, c: i});
            ws[ref].s = {
                fill: {patternType: "solid", fgColor: {rgb: c.required ? "1F4E79" : "2E75B6"}},
                font: {name: "맑은 고딕", sz: 11, bold: true, color: {rgb: "FFFFFF"}},
                alignment: {horizontal: "center", vertical: "center", wrapText: true},
                border: {top: whiteBorder, bottom: whiteBorder, left: whiteBorder, right: whiteBorder},
            };
        });
        ws["!autofilter"] = {ref: `A1:${XLSX.utils.encode_col(COLUMN_MAP.length - 1)}1`};

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "바이어");
        XLSX.writeFile(wb, "바이어 일괄등록 양식.xlsx");
    };

    // 엑셀 파싱 → COLUMN_MAP 기준 + 국가 매칭
    const parseFile = async (file: File) => {
        if (fileInput.current) fileInput.current.value = "";

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!EXCEL_EXTS.includes(ext)) {
            addPopup(<AlertComponent alertType={"error"} infoContent={"엑셀 파일(.xlsx, .xlsm)만 업로드할 수 있습니다."}/>);
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, {type: "array"});
            const ws = wb.Sheets[wb.SheetNames[0]];
            const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {defval: ""});

            const parsed: Row[] = raw
                .map((r) => {
                    const data: Record<string, string> = {};
                    COLUMN_MAP.forEach(({header, key}) => {
                        if (key === COUNTRY_KEY) return;
                        data[key] = String(r[header] ?? "").trim();
                    });
                    const countryRaw = String(r[COUNTRY_HEADER] ?? "").trim();
                    const matched = matchCountry(countryRaw);
                    return {
                        data,
                        geoCode: matched ?? GeoCodeSchema.parse({}),
                        countryRaw,
                        countryMatched: !!matched,
                    };
                })
                .filter((row) => row.countryRaw !== "" || Object.values(row.data).some((v) => v !== ""));

            if (parsed.length === 0) {
                addPopup(<AlertComponent alertType={"error"}
                                        infoContent={"읽을 데이터가 없습니다. 양식의 헤더명이 일치하는지 확인해 주세요."}/>);
                return;
            }

            setFileName(file.name);
            setRows(parsed);
            setUploadedCount(0);
        } catch {
            addPopup(<AlertComponent alertType={"error"}
                                    infoContent={"엑셀을 읽는 중 오류가 발생했습니다. 파일을 확인해 주세요."}/>);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) void parseFile(f);
    };

    // 드래그 & 드롭
    const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current += 1; setDragOver(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current -= 1; if (dragCounter.current === 0) setDragOver(false); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragOver(false); dragCounter.current = 0;
        const f = e.dataTransfer?.files?.[0];
        if (f) void parseFile(f);
    };

    const updateCell = (idx: number, key: string, value: string) => {
        setRows((prev) => prev.map((r, i) => (i === idx ? {...r, data: {...r.data, [key]: value}} : r)));
    };
    const updateGeo = (idx: number, geoCode: GeoCodeType) => {
        const matched = !!geoCode.code;
        setRows((prev) => prev.map((r, i) =>
            i === idx ? {...r, geoCode, countryMatched: matched, countryRaw: matched ? "" : r.countryRaw} : r));
    };
    const deleteRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

    const chunks = useMemo(() => {
        const out: Row[][] = [];
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) out.push(rows.slice(i, i + CHUNK_SIZE));
        return out;
    }, [rows]);

    // 필수: companyName만. (국가 미매칭은 비차단 — geoCode 선택값)
    const invalidCount = useMemo(() => rows.filter((r) => !r.data.companyName?.trim()).length, [rows]);
    const unmatchedCount = useMemo(() => rows.filter((r) => r.countryRaw && !r.countryMatched).length, [rows]);
    const progress = rows.length > 0 ? Math.floor((uploadedCount / rows.length) * 100) : 0;

    // Row → BuyerType (연락처/메일 콤마 병합 최대 3개, source=EXCEL_UPLOAD)
    const buildDto = (row: Row): BuyerType => {
        const d = row.data;
        const join = (...vals: string[]) => vals.map((v) => (v ?? "").trim()).filter(Boolean).slice(0, 3).join(",");
        const buyer = BuyerSchema.parse({});
        buyer.companyName = (d.companyName ?? "").trim();
        buyer.geoCode = row.geoCode;
        buyer.googleMapAddress = (d.googleMapAddress ?? "").trim();
        buyer.homepage = (d.homepage ?? "").trim();
        buyer.companyContacts = join(d.companyContact1, d.companyContact2);
        buyer.companyEmails = join(d.companyEmail1, d.companyEmail2);
        buyer.keyItems = (d.keyItems ?? "").trim();
        buyer.facebook = (d.facebook ?? "").trim();
        buyer.linkedin = (d.linkedin ?? "").trim();
        buyer.youtube = (d.youtube ?? "").trim();
        buyer.source = "EXCEL_UPLOAD";
        return buyer;
    };

    const handleUpload = async () => {
        if (rows.length === 0 || uploading) return;
        if (invalidCount > 0) {
            addPopup(<AlertComponent alertType={"error"}
                                    infoContent={`회사명이 비어있는 행이 ${invalidCount}건 있습니다. 수정 후 업로드해 주세요.`}/>);
            return;
        }

        setUploading(true);
        setUploadedCount(0);
        const saved: BuyerType[] = [];
        try {
            for (let i = 0; i < chunks.length; i++) {
                const body = chunks[i].map(buildDto);
                const res = await callApi(
                    `/api/admin/managed-users/${userId}/projects/${selectedProject.id}/buyer/bulk-create`,
                    {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        credentials: "include",
                        body: JSON.stringify(body),
                    },
                );
                if (!res.result) {
                    addPopup(<AlertComponent alertType={"error"} infoContent={res.message || "업로드에 실패했습니다."}/>);
                    return;
                }
                saved.push(...((res.data ?? []) as BuyerType[]));
                setUploadedCount(Math.min((i + 1) * CHUNK_SIZE, rows.length));
            }
            setBuyers([...buyers, ...saved]);
            addPopup(<AlertComponent alertType={"alert"} infoContent={`${saved.length}건 업로드가 완료되었습니다.`}/>);
            closePopup(uId ?? "");
        } finally {
            setUploading(false);
        }
    };

    const hasData = rows.length > 0;

    return (
        <section className={"popupSection buyer_excel_upload"}>
            <div className={`popupContainer${hasData ? " wide" : ""}`}>
                {uploading && (
                    <div className={"upload_block"}>
                        <div className={"upload_progress"}>
                            <p className={"up_label"}>업로드 중… {uploadedCount}/{rows.length} ({progress}%)</p>
                            <div className={"up_track"}><div className={"up_fill"} style={{width: `${progress}%`}}/></div>
                            <p className={"up_sub"}>완료될 때까지 창을 닫지 마세요.</p>
                        </div>
                    </div>
                )}

                <div className={"bx_head"}>
                    <h3>엑셀 업로드</h3>
                    <div className={"bx_head_btns"}>
                        <button type={"button"} className={"bx_template_btn"} onClick={downloadTemplate} disabled={uploading}>양식 다운로드</button>
                        <button type={"button"} className={"bx_close"} onClick={close} disabled={uploading} aria-label={"close"}>✕</button>
                    </div>
                </div>

                <input type="file" ref={fileInput} accept=".xlsx,.xlsm,.xls" onChange={handleFileChange} hidden/>

                {!hasData ? (
                    <div className={`bx_dropzone${dragOver ? " over" : ""}`}
                         onClick={() => fileInput.current?.click()}
                         onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
                        <p className={"bx_drop_title"}>엑셀 파일을 끌어다 놓거나 클릭해서 선택하세요</p>
                        <p className={"bx_drop_sub"}>.xlsx, .xlsm</p>
                    </div>
                ) : (
                    <div className={"bx_preview"}>
                        <div className={"bx_preview_bar"}>
                            <span>📄 {fileName} · 총 <b>{rows.length}</b>건 · {chunks.length}개 묶음({CHUNK_SIZE}건 단위)
                                {unmatchedCount > 0 && <span className={"bx_warn"}> · 국가 미매칭 {unmatchedCount}건</span>}
                            </span>
                            <button type={"button"} className={"bx_reselect"} onClick={() => fileInput.current?.click()} disabled={uploading}>다른 파일 선택</button>
                        </div>
                        <div className={"bx_table_scroll"}>
                            <table className={"bx_table"}>
                                <thead>
                                <tr>
                                    <th className={"bx_th_del"}/>
                                    <th className={"bx_th_idx"}>#</th>
                                    {RENDER_COLUMNS.map((c) => (
                                        <th key={c.header}>{c.header}{"required" in c && c.required && <span className={"bx_req"}> *</span>}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className={"bx_td_del"}>
                                            <button type={"button"} className={"bx_row_del"} onClick={() => deleteRow(idx)} title={"행 삭제"}>✕</button>
                                        </td>
                                        <td className={"bx_td_idx"}>{idx + 1}</td>
                                        {RENDER_COLUMNS.map((c) => {
                                            if (c.type === "country") {
                                                return (
                                                    <td key={c.header} className={"bx_td_country"}>
                                                        <PopupRegisterNationSearch
                                                            buyer={{...baseBuyer, geoCode: row.geoCode}}
                                                            setBuyer={(b) => updateGeo(idx, b.geoCode)}/>
                                                        {row.countryRaw && !row.countryMatched && (
                                                            <div className={"bx_country_warn"}>미매칭: {row.countryRaw}</div>
                                                        )}
                                                    </td>
                                                );
                                            }
                                            if (c.type === "stack") {
                                                return (
                                                    <td key={c.header} className={"bx_td"}>
                                                        <div className={"bx_stack"}>
                                                            {c.keys.map((k) => (
                                                                <input key={k} value={row.data[k]} onChange={(e) => updateCell(idx, k, e.target.value)}/>
                                                            ))}
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            if (c.type === "textarea") {
                                                return (
                                                    <td key={c.header} className={"bx_td"}>
                                                        <textarea value={row.data[c.key]} onChange={(e) => updateCell(idx, c.key, e.target.value)}/>
                                                    </td>
                                                );
                                            }
                                            const invalid = c.required && !row.data[c.key]?.trim();
                                            return (
                                                <td key={c.header} className={"bx_td"}>
                                                    <input className={invalid ? "invalid" : ""} value={row.data[c.key]}
                                                           placeholder={c.required ? "필수" : ""}
                                                           onChange={(e) => updateCell(idx, c.key, e.target.value)}/>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className={"bx_footer"}>
                    <button type={"button"} className={"bx_cancel"} onClick={close} disabled={uploading}>취소</button>
                    <button type={"button"} className={"bx_upload"} onClick={handleUpload} disabled={!hasData || uploading}>
                        {uploading ? `업로드 중… (${uploadedCount}/${rows.length})` : "업로드"}
                    </button>
                </div>
            </div>
        </section>
    );
}
