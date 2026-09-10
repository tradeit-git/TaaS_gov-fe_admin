'use client'

import {useState} from "react";
import ActivityItem from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/ActivityItem";
import {
    ActivityRow,
    EMPTY,
    GRADE_LABELS,
    gradeClass,
    RoundRow,
    resultClass,
    resultLabel,
} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    rounds: RoundRow[];
    onAddActivity: (round: RoundRow) => void;
    onEditRound: (round: RoundRow) => void;
    onEditActivity: (activity: ActivityRow) => void;
    onDeleteActivity: (activity: ActivityRow) => void;
}

const period = (round: RoundRow) => {
    const from = round.startedOn?.replace(/-/g, '.').slice(0, 7) ?? '';
    const to = round.endedOn ? round.endedOn.replace(/-/g, '.').slice(0, 7) : '';
    return `${from} ~ ${to}`;
};

export default function RoundAccordion({rounds, onAddActivity, onEditRound, onEditActivity, onDeleteActivity}: Props) {
    // 열린 회차를 기본으로 펼친다. 담당자가 지금 보려는 건 진행중인 회차다
    const [openIds, setOpenIds] = useState<number[]>(() => {
        const open = rounds.filter(r => r.open).map(r => r.id);
        return open.length > 0 ? open : rounds.slice(-1).map(r => r.id);
    });

    const toggle = (id: number) => {
        setOpenIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
    };

    if (rounds.length === 0) {
        return <div className={'ds_section_empty'}>회차가 없습니다.</div>;
    }

    return (
        <>
            {rounds.map(round => {
                const expanded = openIds.includes(round.id);
                return (
                    <div key={round.id} className={'ds_round'}>
                        <button type="button" className={'ds_round_head'} onClick={() => toggle(round.id)}>
                            <span className={'ds_arrow'}>{expanded ? '▾' : '▸'}</span>
                            <span className={'ds_round_no'}>{round.roundNo}차</span>
                            <span className={'ds_round_period ds_num'}>{period(round)}</span>

                            {round.salesGrade
                                ? <span className={`grade_badge ${gradeClass(round.salesGrade)}`}>
                                      {GRADE_LABELS[round.salesGrade] ?? round.salesGrade}
                                  </span>
                                : <span className={'ds_empty'}>{EMPTY}</span>}

                            <span className={`ds_result_badge ${resultClass(round.result)}`}>
                                {resultLabel(round.result)}
                            </span>

                            {round.salesType && <span className={'ds_sub'}>{round.salesType}</span>}
                            <span className={'ds_round_count'}>활동 {round.activityCount}건</span>
                        </button>

                        {expanded && (
                            <div className={'ds_round_body'}>
                                <div className={'ds_round_actions'}>
                                    <button type="button" className={'ds_ghost_btn'}
                                            onClick={() => onAddActivity(round)}>활동 등록</button>
                                    <button type="button" className={'ds_ghost_btn'}
                                            onClick={() => onEditRound(round)}>회차 정보 수정</button>
                                </div>

                                {round.activities.length === 0
                                    ? <div className={'ds_section_empty'}>등록된 활동이 없습니다.</div>
                                    : round.activities.map(activity => (
                                        <ActivityItem key={activity.id} activity={activity}
                                                      onEdit={onEditActivity}
                                                      onDelete={onDeleteActivity}/>
                                    ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
}
