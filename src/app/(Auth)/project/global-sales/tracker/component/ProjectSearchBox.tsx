'use client'

import React, {useEffect, useMemo, useRef, useState} from "react";

/**
 * SearchBox 공통화 시키기 위해서 임시로 만듦
 *  item : 초기/선택된 아이템
 *  setItem : 선택 이벤트
 *  items : 아이템 항목
 *  label : 라벨표시
 *  placeholder? :
 *  onFilter? :
 *
 * @param props
 * @constructor
 */

export default function ProjectSearchBox<T>(props: {
    item : T,
    setItem : (item : T | null) => void
    items : T[],
    label : (item : T) => string
}) {
    const { label, item } = props;

    const [items, setItems] = useState<T[]>([]);
    useEffect(() => {
        setItems(props.items);
    }, [props.items]);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchText, setSearchText] = useState(props.label(props.item));
    useEffect(() => {
        setSearchText(label(item))
    }, [label, item]);

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [filteredItemsIndex, setFilterItemsIndex] = useState<number>(0);
    const filteredItemsRefs = useRef<Array<HTMLLIElement | null>>([]);

    const filteredItems = useMemo(() => {
        return searchText === '' ? items : items.filter(_item => {
            const value = label(_item);
            return value.includes(searchText)
        });
    }, [label,searchText, items])

    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false); // 또는 원하는 상태 변경
                setSearchText(label(item));
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [label,item]);

    return (
        <div className={'project_search'} ref={wrapperRef}>
            <input
                ref={searchInputRef}
                type="text" className={'search_box'}
                placeholder="기업명 / 프로젝트명 검색"
                value={searchText}
                onChange={(e) => {
                    const value = e.target.value;
                    setFilterItemsIndex(0);
                    setSearchText(value);
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                        setFilterItemsIndex(prev => {
                            const nextIndex = prev < filteredItems.length - 1 ? prev + 1 : prev;
                            setTimeout(() => {
                                filteredItemsRefs.current[nextIndex]?.scrollIntoView({
                                    block: 'nearest',
                                    behavior: 'smooth'
                                });
                            }, 0);
                            return nextIndex;
                        });
                    }
                    if (e.key === 'ArrowUp') {
                        setFilterItemsIndex(prev => {
                            const nextIndex = prev > 0 ? prev - 1 : prev;
                            setTimeout(() => {
                                filteredItemsRefs.current[nextIndex]?.scrollIntoView({
                                    block: 'nearest',
                                    behavior: 'smooth'
                                });
                            }, 0);
                            return nextIndex;
                        });
                    }
                    if (e.key === 'Enter') {
                        const _item = filteredItems[filteredItemsIndex];
                        const value = props.label(_item);
                        setSearchText(value);
                        props.setItem({..._item})
                        setIsOpen(false);
                    }
                    if (e.key === 'Escape') {
                        if(isOpen) setIsOpen(false);
                        else {
                            setSearchText('');
                            props.setItem(null)
                        }
                    }
                }}
                onFocus={() => setIsOpen(true)}
            />

            {isOpen && filteredItems.length > 0 && (
                <ul className="search_list">
                    {filteredItems.map((_item, index) => {
                        const value = props.label(_item);
                        const handleClick = () => {
                            setSearchText(value);
                            props.setItem(_item)
                            setIsOpen(false);
                        }

                        return (
                            <li style={{ whiteSpace: "pre" }}
                                ref={(el) => void (filteredItemsRefs.current[index] = el)}
                                key={index}
                                className={`${index === filteredItemsIndex ? "selected" : ""}`}
                                onClick={handleClick}>{value.replace("-","  -  ")}</li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}