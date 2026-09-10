'use client'

import {useState} from "react";
import {ActivityRow, shortDate} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    activity: ActivityRow;
    /** 회차 안에서는 회차번호가 이미 헤더에 있으므로 숨긴다. 타임라인에서는 보여준다 */
    showRound?: boolean;
    onEdit?: (activity: ActivityRow) => void;
    onDelete?: (activity: ActivityRow) => void;
}

/** 이 줄 수를 넘으면 접는다. 미팅 한 건에 20줄씩 쓰는 게 이 팀의 방식이라 안 접으면 화면이 잠긴다 */
const FOLD_THRESHOLD = 3;

export default function ActivityItem({activity, showRound, onEdit, onDelete}: Props) {
    const lines = activity.content.split('\n').length;
    const foldable = lines > FOLD_THRESHOLD || activity.content.length > 160;
    const [open, setOpen] = useState(false);

    return (
        <div className={'ds_activity'}>
            <div className={'ds_activity_head'}>
                <span className={'ds_num'}>{shortDate(activity.activityDate)}</span>
                <span>·</span>
                <span>{activity.adminName ?? '-'}</span>
                {showRound && activity.roundNo && <span className={'ds_sub'}>{activity.roundNo}차</span>}

                {activity.editable && (onEdit || onDelete) && (
                    <div className={'ds_activity_actions'}>
                        {onEdit && <button type="button" onClick={() => onEdit(activity)}>수정</button>}
                        {onDelete && <button type="button" onClick={() => onDelete(activity)}>삭제</button>}
                    </div>
                )}
            </div>

            <div className={`ds_activity_body${foldable && !open ? ' folded' : ''}`}>
                {activity.content}
            </div>

            {foldable && (
                <button type="button" className={'ds_fold_btn'} onClick={() => setOpen(v => !v)}>
                    {open ? '접기' : `펼치기 (${lines}줄)`}
                </button>
            )}
        </div>
    );
}
