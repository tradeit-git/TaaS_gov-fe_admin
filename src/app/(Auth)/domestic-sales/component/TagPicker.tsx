'use client';

import {useMemo, useState} from "react";
import {normalizeTag, TAG_MAX_LENGTH, TagRow} from "@/app/(Auth)/domestic-sales/component/tags";

interface Props {
    /** 지금 달려 있는 태그명 */
    value: string[];
    onChange: (next: string[]) => void;
    /** 이미 쓰이고 있는 태그 전체. 제안 목록의 출처다 */
    allTags: TagRow[];
    autoFocus?: boolean;
}

/** 입력이 비었을 때 미리 보여줄 개수. 다 펼치면 팝업이 목록에 잡아먹힌다 */
const IDLE_SUGGESTIONS = 12;

/**
 * 태그 입력 — 자유롭게 만들되, 이미 있는 태그를 먼저 보여준다.
 * <p>
 * 아무것도 안 쳤을 때도 많이 쓰인 태그를 깔아두는 것이 핵심이다.
 * 빈 입력창만 있으면 담당자는 어떤 태그가 있는지 모른 채 새로 만들고,
 * 그렇게 같은 뜻의 태그가 몇 개씩 쌓인다.
 */
export default function TagPicker({value, onChange, allTags, autoFocus}: Props) {
    const [input, setInput] = useState('');

    const picked = useMemo(() => new Set(value.map(normalizeTag)), [value]);

    const suggestions = useMemo(() => {
        const norm = normalizeTag(input);
        return allTags
            .filter(t => !picked.has(normalizeTag(t.name)))
            .filter(t => !norm || normalizeTag(t.name).includes(norm))
            .slice(0, norm ? 20 : IDLE_SUGGESTIONS);
    }, [allTags, picked, input]);

    /** 이미 달린 태그면 무시한다 — 「수출 유망」과 「수출유망」은 같은 것으로 본다 */
    const add = (name: string) => {
        const trimmed = name.trim().slice(0, TAG_MAX_LENGTH);
        if (!trimmed) return;
        if (!picked.has(normalizeTag(trimmed))) onChange([...value, trimmed]);
        setInput('');
    };

    const remove = (name: string) => onChange(value.filter(v => v !== name));

    const exactExists = allTags.some(t => normalizeTag(t.name) === normalizeTag(input));

    return (
        <div className={'ds_tag_picker'}>
            <div className={'ds_tag_box'}>
                {value.map(name => (
                    <span key={name} className={'ds_tag ds_tag_on'}>
                        {name}
                        <button type="button" onClick={() => remove(name)} aria-label={'태그 빼기'}>×</button>
                    </span>
                ))}
                <input type="text" value={input} autoFocus={autoFocus}
                       maxLength={TAG_MAX_LENGTH}
                       placeholder={value.length ? '' : '태그를 고르거나 새로 입력'}
                       onChange={e => setInput(e.target.value)}
                       onKeyDown={e => {
                           if (e.key === 'Enter') {
                               e.preventDefault();
                               add(input);
                           } else if (e.key === 'Backspace' && !input && value.length) {
                               remove(value[value.length - 1]);
                           }
                       }}/>
            </div>

            <div className={'ds_tag_suggest'}>
                {input.trim() && !exactExists && (
                    <button type="button" className={'ds_tag ds_tag_new'} onClick={() => add(input)}>
                        + 「{input.trim()}」 새로 만들기
                    </button>
                )}
                {suggestions.map(t => (
                    <button key={t.tagId} type="button" className={'ds_tag'} onClick={() => add(t.name)}>
                        {t.name}
                        {t.companyCount != null && <i>{t.companyCount}</i>}
                    </button>
                ))}
                {!suggestions.length && !input.trim() && (
                    <span className={'ds_sub'}>아직 만들어진 태그가 없습니다. 입력해서 첫 태그를 만드세요.</span>
                )}
            </div>
        </div>
    );
}
