'use client'

import * as XLSX from 'xlsx-js-style';
import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {formatNum} from "@/app/(Auth)/users/[id]/component/planShared";
import {CreditSummaryType} from "@/types/user/user";

// /download 응답(UserListDTO) 중 엑셀에 필요한 필드만 사용
interface DownloadRow {
    companyName: string | null;
    loginId: string;
    name: string;
    department: string | null;
    position: string | null;
    planName: string | null;
    planStartDate: string | null;
    planEndDate: string | null;
    isPartnerMember: boolean | null;
    partnerName: string | null;
    creditSummary: CreditSummaryType | null;
    createdAt: string;
}

interface Props {
    planName: string;
    hasPlan: string;
    isPartnerMember: string;
    keyword: string;
}

export default function UsersExcelDownloadButton({planName, hasPlan, isPartnerMember, keyword}: Props) {
    const [loading, setLoading] = useState(false);

    // 화면 테이블(CompanyManagementTableBody)과 동일한 표시 규칙
    const isTrial = (row: DownloadRow) => {
        if (row.planStartDate && row.planEndDate) return false;
        if (!row.createdAt) return false;
        const created = new Date(row.createdAt);
        if (isNaN(created.getTime())) return false;
        const oneMonthLater = new Date(created);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
        return new Date() < oneMonthLater;
    };
    const formatPlanName = (row: DownloadRow) => {
        if (row.planName === 'Free' && isTrial(row)) return 'Free(30day trial)';
        return row.planName || '-';
    };
    const formatPeriod = (row: DownloadRow) => {
        if (row.planStartDate && row.planEndDate) {
            return `${formatDateDot(row.planStartDate)} ~ ${formatDateDot(row.planEndDate)}`;
        }
        if (isTrial(row)) {
            const created = new Date(row.createdAt);
            const oneMonthLater = new Date(created);
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            return `${formatDateDot(row.createdAt)} ~ ${formatDateDot(oneMonthLater.toISOString())}`;
        }
        return '-';
    };
    const formatDeptPosition = (row: DownloadRow) => {
        const parts = [row.department, row.position].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
    };

    const download = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // 현재 화면 필터를 그대로 반영 (전체 결과 다운로드)
            const params = new URLSearchParams();
            if (keyword) params.set('keyword', keyword);
            if (planName) params.set('planName', planName);
            if (hasPlan) params.set('hasPlan', hasPlan);
            if (isPartnerMember) params.set('isPartnerMember', isPartnerMember);
            const qs = params.toString();

            const res = await callApi(
                `/api/admin/members/users/download${qs ? `?${qs}` : ''}`,
                {method: 'GET', credentials: 'include'}
            );
            if (!res.result || !Array.isArray(res.data)) {
                alert('엑셀 다운로드에 실패했습니다.');
                return;
            }
            const rows = res.data as DownloadRow[];

            const header = ['순번', '회사명', 'ID(e-mail)', '이름', '부서&직함', '제휴가입',
                '플랜', '이용기간', '지급', '사용', '소멸', '잔여', '회원가입일'];
            const wsData: (string | number)[][] = [header];
            rows.forEach((row, i) => {
                const c = row.creditSummary;
                wsData.push([
                    rows.length - i,                                    // 순번 (테이블과 동일: 최신이 큰 번호)
                    row.companyName || '-',
                    row.loginId,
                    row.name,
                    formatDeptPosition(row),
                    row.isPartnerMember ? (row.partnerName || '제휴가입사') : '-',
                    formatPlanName(row),
                    formatPeriod(row),
                    formatNum(c?.granted),
                    formatNum(c?.used),
                    formatNum(c?.expired),
                    formatNum(c?.balance),
                    formatDateDot(row.createdAt),
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            const border = {
                top: {style: 'thin', color: {rgb: 'D9D9D9'}},
                bottom: {style: 'thin', color: {rgb: 'D9D9D9'}},
                left: {style: 'thin', color: {rgb: 'D9D9D9'}},
                right: {style: 'thin', color: {rgb: 'D9D9D9'}},
            };
            const range = XLSX.utils.decode_range(ws['!ref'] as string);
            for (let r = range.s.r; r <= range.e.r; r++) {
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const ref = XLSX.utils.encode_cell({r, c: col});
                    if (!ws[ref]) ws[ref] = {t: 's', v: ''};
                    ws[ref].s = r === 0
                        ? {font: {name: '맑은 고딕', bold: true}, alignment: {horizontal: 'center', vertical: 'center'}, fill: {fgColor: {rgb: 'F2F2F2'}}, border}
                        : {font: {name: '맑은 고딕'}, alignment: {vertical: 'center'}, border};
                }
            }
            ws['!cols'] = [
                {width: 6}, {width: 24}, {width: 26}, {width: 12}, {width: 20}, {width: 10},
                {width: 18}, {width: 24}, {width: 12}, {width: 12}, {width: 12}, {width: 12}, {width: 14},
            ];
            ws['!rows'] = [{hpt: 22}];

            const d = new Date();
            const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '가입회원사');
            XLSX.writeFile(wb, `가입회원사_${stamp}.xlsx`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button type="button" className={'btn_excel_down'} onClick={download} disabled={loading}>
            {loading ? '다운로드 중...' : '엑셀 다운로드'}
        </button>
    );
}
