'use client'

import {useEffect, useRef, useState} from "react";

interface Option {
    value: string;
    label: string;
}

interface Props {
    /** 버튼에 찍히는 이름. '영업등급' */
    label: string;
    options: Option[];
    /** null = 전체. 빈 배열 = 하나도 안 고름 */
    value: string[] | null;
    onChange: (next: string[] | null) => void;
}

/**
 * 다중 선택 필터 — 전부 켜진 상태에서 하나씩 빼는 방식.
 * <p>
 * 「전체」를 파라미터 없음(null)으로 두는 이유는 주소를 짧게 유지하려는 것도 있지만,
 * 선택지가 나중에 늘어나도 예전에 저장해둔 주소가 계속 「전체」로 동작하기 때문이다.
 * 값을 다 나열해두면 새 등급이 생겼을 때 그 주소만 조용히 새 등급을 빼고 본다.
 */
export default function MultiSelectFilter({label, options, value, onChange}: Props) {
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);

    // 바깥을 누르거나 ESC 면 닫는다. 필터가 여럿이라 열어둔 채 옆 걸 누르면 겹친다
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

    // null 은 「전부 켜짐」이므로 화면에서는 전체 목록과 똑같이 그린다
    const selected = value ?? options.map(o => o.value);
    const allOn = selected.length === options.length;

    /** 빼고 나서 다시 전부가 되면 null 로 되돌린다 — 주소에 흔적을 남기지 않는다 */
    const toggle = (code: string) => {
        const next = selected.includes(code)
            ? selected.filter(v => v !== code)
            : [...selected, code];
        onChange(next.length === options.length ? null : next);
    };

    const summary = allOn ? '전체' : selected.length === 0 ? '없음' : `${selected.length}개`;

    return (
        <div className={'ds_multi'} ref={boxRef}>
            <button type="button" className={`ds_multi_btn${allOn ? '' : ' on'}`}
                    onClick={() => setOpen(v => !v)}>
                {label} {summary}
                <span className={'ds_multi_caret'}/>
            </button>

            {open && (
                <div className={'ds_multi_panel'}>
                    <label className={'ds_multi_all'}>
                        <input type="checkbox" checked={allOn}
                               onChange={() => onChange(allOn ? [] : null)}/>
                        전체
                    </label>
                    {options.map(o => (
                        <label key={o.value} className={'ds_multi_item'}>
                            <input type="checkbox" checked={selected.includes(o.value)}
                                   onChange={() => toggle(o.value)}/>
                            {o.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
