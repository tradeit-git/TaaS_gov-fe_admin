'use client'

import Link from "next/link";
import {
    ACCOUNT_TYPE_LABELS,
    CompanyRow,
    EMPTY,
    GRADE_LABELS,
    gradeClass,
    regionText,
    resultClass,
    resultLabel,
    shortDate,
} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    data: CompanyRow[];
    selected: Set<number>;
    onToggle: (targetId: number) => void;
    onEditTags: (row: CompanyRow) => void;
}

/** 태그 칸에 그대로 보여줄 개수. 넘는 만큼은 「+N」 으로 접는다 */
const TAG_SHOWN = 2;

/**
 * 가입계정 칸 — "3 (POC 2)" 처럼 총계 뒤에 성격을 붙인다.
 * 셋 다 있으면 길어지므로 가장 큰 것 하나만 보조로 쓴다.
 */
function accountText(row: CompanyRow) {
    if (!row.accountTotal) return <span className={'ds_empty'}>0</span>;

    const parts: Array<[string, number]> = [
        ['POC', row.accountPoc],
        ['PARTNER', row.accountPartner],
        ['ETC', row.accountEtc],
    ];
    const top = parts.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];

    return (
        <>
            {row.accountTotal}
            {top && <span className={'ds_sub'}> ({ACCOUNT_TYPE_LABELS[top[0]]} {top[1]})</span>}
        </>
    );
}

/** 날짜 + 작성자. 여러 명이 관여했으면 「외 N」 을 붙인다 */
function touchText(date: string | null, adminName: string | null, adminCount?: number | null) {
    if (!date) return <span className={'ds_empty'}>{EMPTY}</span>;

    const extra = adminCount && adminCount > 1 ? ` 외 ${adminCount - 1}` : '';
    return (
        <>
            <span className={'ds_num'}>{shortDate(date)}</span>
            {adminName && <span className={'ds_sub'}> {adminName}{extra}</span>}
        </>
    );
}

export default function CompanyListTableBody({data, selected, onToggle, onEditTags}: Props) {
    // 서버에서 채워져 오므로 로딩 상태가 없다
    if (data.length === 0) {
        return (
            <tbody>
            <tr>
                <td colSpan={11} style={{textAlign: 'center', padding: '40px 0', color: '#999'}}>
                    관리 중인 기업이 없습니다. 기업정보조회에서 기업을 찾아 추가해 주세요.
                </td>
            </tr>
            </tbody>
        );
    }

    return (
        <tbody>
        {data.map(row => (
            <tr key={row.targetId} className={selected.has(row.targetId) ? 'ds_row_on' : undefined}>
                <td className={'ds_check_cell'}>
                    <input type="checkbox" checked={selected.has(row.targetId)}
                           onChange={() => onToggle(row.targetId)}
                           aria-label={`${row.name} 선택`}/>
                </td>
                <td>
                    <Link href={`/domestic-sales/companies/${row.targetId}`}
                          className={'ds_name_link'}>{row.name}</Link>
                </td>
                <td>
                    {row.bizNo
                        ? <span className={'ds_num'}>{row.bizNo}</span>
                        : <span className={'ds_empty'}>미확인</span>}
                </td>
                <td>{regionText(row.sidoName, row.sigunguName)}</td>
                {/* 기업정보조회와 같은 자리·같은 동작 — 칸을 누르면 편집 팝업.
                    다만 여기는 한 줄로 묶는다. 태그 수에 따라 행 높이가 들쭉날쭉하면
                    옆 칸(영업활동·TM)의 날짜를 눈으로 훑을 수가 없다 */}
                <td>
                    <button type="button" className={'ds_tag_cell one_line'}
                            title={row.tags.map(t => t.name).join(', ')}
                            onClick={() => onEditTags(row)}>
                        {row.tags.length === 0
                            ? <span className={'ds_tag_add'}>+ 태그</span>
                            : <>
                                {row.tags.slice(0, TAG_SHOWN).map(t => (
                                    <span key={t.tagId} className={'ds_tag'}>{t.name}</span>
                                ))}
                                {row.tags.length > TAG_SHOWN && (
                                    <span className={'ds_tag_more'}>+{row.tags.length - TAG_SHOWN}</span>
                                )}
                            </>}
                    </button>
                </td>
                <td>
                    {row.salesGrade
                        ? <span className={`grade_badge ${gradeClass(row.salesGrade)}`}>
                              {GRADE_LABELS[row.salesGrade] ?? row.salesGrade}
                          </span>
                        : <span className={'ds_empty'}>{EMPTY}</span>}
                </td>
                <td>{row.roundNo ? `${row.roundNo}차` : <span className={'ds_empty'}>{EMPTY}</span>}</td>
                <td>{accountText(row)}</td>
                <td>{touchText(row.lastActivityDate, row.lastActivityAdminName, row.activityAdminCount)}</td>
                <td>{touchText(row.lastContactedOn, row.lastContactedAdminName)}</td>
                <td>
                    <span className={`ds_result_badge ${resultClass(row.roundResult)}`}>
                        {resultLabel(row.roundResult)}
                    </span>
                </td>
            </tr>
        ))}
        </tbody>
    );
}
