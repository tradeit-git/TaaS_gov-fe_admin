'use client'

import {useState} from "react";
import {EMPTY, shortDate, TimelineItem} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    items: TimelineItem[];
}

/**
 * TM 접촉이력은 한두 줄인데 영업활동은 20줄이라, 그대로 섞으면
 * 타임라인이 영업활동 하나로 도배된다. 여기서도 접는다 (기획서 5.2).
 */
function TimelineBody({content}: { content: string }) {
    const lines = content.split('\n').length;
    const foldable = lines > 2 || content.length > 120;
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className={`ds_activity_body${foldable && !open ? ' folded' : ''}`}>{content}</div>
            {foldable && (
                <button type="button" className={'ds_fold_btn'} onClick={() => setOpen(v => !v)}>
                    {open ? '접기' : `펼치기 (${lines}줄)`}
                </button>
            )}
        </>
    );
}

export default function TimelineList({items}: Props) {
    // 서버에서 채워져 오므로 로딩 상태가 없다
    if (items.length === 0) return <div className={'ds_section_empty'}>기록이 없습니다.</div>;

    return (
        <>
            {items.map(item => (
                <div key={`${item.type}-${item.id}`} className={'ds_timeline_item'}>
                    <div className={'ds_timeline_date'}>{shortDate(item.date)}</div>
                    <div className={`ds_timeline_kind ${item.type === 'TM' ? 'kind_tm' : 'kind_sales'}`}>
                        {item.type === 'TM' ? 'TM' : '영업'}
                    </div>
                    <div className={'ds_timeline_main'}>
                        <div className={'ds_activity_head'}>
                            <span>{item.adminName ?? EMPTY}</span>
                            {item.type === 'SALES' && item.roundNo && <span className={'ds_sub'}>{item.roundNo}차</span>}
                            {item.type === 'TM' && item.userName && <span className={'ds_sub'}>{item.userName} 님 접촉</span>}
                        </div>
                        <TimelineBody content={item.content}/>
                    </div>
                </div>
            ))}
        </>
    );
}
