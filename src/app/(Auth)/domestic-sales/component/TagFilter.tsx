'use client';

import {useEffect, useMemo, useRef, useState} from "react";
import {normalizeTag, TagRow} from "@/app/(Auth)/domestic-sales/component/tags";

interface Props {
    allTags: TagRow[];
    /** 고른 태그 pk */
    value: number[];
    onChange: (next: number[]) => void;
}

/**
 * 태그 필터 — 고른 태그를 <b>전부</b> 가진 기업만 (AND).
 * <p>
 * 다른 필터처럼 「전체에서 하나씩 빼는」 방식이 아니다. 태그는 자유 입력이라 계속 늘어나서
 * 전부 켜진 상태가 기본이면 새 태그가 생길 때마다 조건이 저절로 바뀐다.
 * <p>
 * 건수를 같이 찍는 것이 이 화면의 핵심이다 — 1건짜리 오타 태그와 300건짜리 주력 태그를
 * 이름만 보고는 구분할 수 없다.
 */
export default function TagFilter({allTags, value, onChange}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const shown = useMemo(() => {
        const norm = normalizeTag(search);
        return norm ? allTags.filter(t => normalizeTag(t.name).includes(norm)) : allTags;
    }, [allTags, search]);

    const toggle = (tagId: number) => {
        onChange(value.includes(tagId) ? value.filter(v => v !== tagId) : [...value, tagId]);
    };

    const summary = value.length === 0 ? '전체' : `${value.length}개`;

    return (
        <div className={'ds_multi'} ref={boxRef}>
            <button type="button" className={`ds_multi_btn${value.length ? ' on' : ''}`}
                    onClick={() => setOpen(v => !v)}>
                태그 {summary}
                <span className={'ds_multi_caret'}/>
            </button>

            {open && (
                <div className={'ds_multi_panel ds_tag_panel'}>
                    <input type="text" className={'ds_tag_search'} value={search} autoFocus
                           placeholder={'태그 검색'}
                           onChange={e => setSearch(e.target.value)}/>

                    {value.length > 0 && (
                        <button type="button" className={'ds_tag_clear'} onClick={() => onChange([])}>
                            선택 해제 ({value.length})
                        </button>
                    )}

                    <div className={'ds_tag_panel_list'}>
                        {allTags.length === 0 ? (
                            <p className={'ds_sub'}>아직 만들어진 태그가 없습니다.</p>
                        ) : shown.length === 0 ? (
                            <p className={'ds_sub'}>「{search}」 로 찾은 태그가 없습니다.</p>
                        ) : shown.map(t => (
                            <label key={t.tagId} className={'ds_multi_item'}>
                                <input type="checkbox" checked={value.includes(t.tagId)}
                                       onChange={() => toggle(t.tagId)}/>
                                {t.name}
                                <i className={'ds_tag_count'}>{t.companyCount ?? 0}</i>
                            </label>
                        ))}
                    </div>

                    {value.length > 1 && (
                        <p className={'ds_sub ds_tag_and'}>고른 태그를 <b>전부</b> 가진 기업만 나옵니다.</p>
                    )}
                </div>
            )}
        </div>
    );
}
