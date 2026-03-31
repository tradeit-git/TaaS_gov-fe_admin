// FilterOption.tsx
'use client'
import React, {useEffect, useRef, useState} from "react";

export type CommonSelectBoxOption = {
    id: string | number | null
    label: string,
}

interface CommonSelectBoxProps {
    options: CommonSelectBoxOption[];
    selectedId: string | number | null;
    placeholder?: string;
    onChange: (value: string | number | null) => void;
    enableNoSelected?: boolean
}

export default function CustomSelectBox(props: CommonSelectBoxProps) {
    const {options, selectedId, placeholder, onChange, enableNoSelected} = props;
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // 외부 클릭 감지 → 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionId: string | number | null) => {
        const selectedOption = options.find((o) => o.id === optionId);
        onChange(selectedOption ? selectedOption.id : null);
        setIsOpen(false);
    };

    const selectedOption = options.find((o) => o.id === selectedId);
    return (
        <div className="input_list" ref={ref}>
            <div className="filter_wrap">
                <button
                    type={'button'}
                    className={`select_btn ${isOpen ? 'on' : ''}`}
                    onClick={() => setIsOpen((prev) => !prev)}>
                    {selectedOption ? selectedOption.label : placeholder ? placeholder : "선택"}
                    <span className={`bm_icon select_down ${isOpen ? 'off' : 'on'}`}></span>
                    <span className={`bm_icon select_up ${isOpen ? 'on' : 'off'}`}></span>
                </button>
                {isOpen && (
                    <ul className={'option_list'}>
                        {
                            !enableNoSelected && <li className={'option'}
                                                    onClick={() => handleSelect(null)}>{placeholder ? placeholder : "선택"}</li>
                        }

                        {options.map(option => (
                            <li
                                key={option.id}
                                className={'option'}
                                onClick={() => handleSelect(option.id)}>
                                {option.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
