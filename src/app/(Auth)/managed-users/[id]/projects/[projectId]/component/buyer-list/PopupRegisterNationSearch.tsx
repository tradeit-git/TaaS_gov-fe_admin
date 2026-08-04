import {GeoCodeDataTypeEnum} from "@/types/common/geoCode";
import React, {Dispatch, useEffect, useMemo, useRef, useState} from "react";
import {useAppConfigStore} from "@/stores/common/appConfigStore";
import {BuyerType} from "@/types/buyer/buyer";
import {sortByKey} from "@/utill/compare";


export default function PopupRegisterNationSearch(
    props: {
        buyer: BuyerType
        setBuyer: Dispatch<BuyerType>
    }
) {
    const {appConfig} = useAppConfigStore();
    const countries = appConfig.geoCodes.filter(geoCode =>
        geoCode.type === GeoCodeDataTypeEnum.enum.COUNTRY
    ).sort((a,b) => sortByKey(a,b,"name","asc","string"));

    const continentAndRegion = useMemo(() => {
        const country = appConfig.geoCodes
            .filter(geoCode => geoCode.type === GeoCodeDataTypeEnum.enum.COUNTRY)
            .find(geoCode => {
            return geoCode.code === props.buyer.geoCode?.code && geoCode.type === props.buyer.geoCode?.type;
        })
        if(!country) return ["",""];
        else {
            const continent = appConfig.geoCodes.find(geoCode => geoCode.code === country.code.slice(0, 1))?.name;
            const region =appConfig.geoCodes.find(geoCode => geoCode.code === country.code.slice(0, 3))?.name;
            return [continent ?? "", region ?? ""];
        }
    },[props.buyer, appConfig.geoCodes])

    const nationInputRef = useRef<HTMLInputElement>(null);
    const [nationInput, setNationInput] = useState(props.buyer.geoCode?.name ?? "");

    const [filteredNationIndex, setFilterNationIndex] = useState<number>(0);
    const filteredNationsRefs = useRef<Array<HTMLLIElement | null>>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const filteredNations = useMemo(() => {
        return nationInput === '' ? countries : countries.filter(country =>
            country.name.toLowerCase().includes(nationInput));
    }, [nationInput, countries])

    const wrapperRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false); // 또는 원하는 상태 변경
                setNationInput(props.buyer.geoCode?.name ?? "");
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [props.buyer]);
    return (
        <div ref={wrapperRef} className={'nation_content'}>
            <div className={"nation_search_box"}>
                <input
                    ref={nationInputRef}
                    className={'search_box'}
                    type="text"
                    placeholder="국가검색"
                    value={nationInput}
                    onChange={(e) => {
                        const value = e.target.value;
                        setFilterNationIndex(0);
                        setNationInput(value);
                        setIsOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            setFilterNationIndex(prev => {
                                const nextIndex = prev < filteredNations.length - 1 ? prev + 1 : prev;
                                setTimeout(() => {
                                    filteredNationsRefs.current[nextIndex]?.scrollIntoView({
                                        block: 'nearest',
                                        behavior: 'smooth'
                                    });
                                }, 0);
                                return nextIndex;
                            });
                        }
                        if (e.key === 'ArrowUp') {
                            setFilterNationIndex(prev => {
                                const nextIndex = prev > 0 ? prev - 1 : prev;
                                setTimeout(() => {
                                    filteredNationsRefs.current[nextIndex]?.scrollIntoView({
                                        block: 'nearest',
                                        behavior: 'smooth'
                                    });
                                }, 0);
                                return nextIndex;
                            });
                        }
                        if (e.key === 'Enter') {
                            setNationInput(filteredNations[filteredNationIndex].name);
                            props.setBuyer({...props.buyer, geoCode: filteredNations[filteredNationIndex]})
                            setIsOpen(false);
                        }
                        if (e.key === 'Escape') {
                            setIsOpen(false);
                        }

                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {isOpen && filteredNations.length > 0 && (
                    <ul className="search_dropdown">
                        {filteredNations.map((country, index) => {
                            const matchIndex = country.name.toLowerCase().indexOf(nationInput.toLowerCase());

                            const handleClick = () => {
                                setNationInput(country.name);
                                props.setBuyer({...props.buyer, geoCode: country})
                                setIsOpen(false);
                            }

                            // 검색어 포함 여부 확인
                            if (matchIndex === -1) {
                                return (
                                    <li
                                        ref={(el) => void (filteredNationsRefs.current[index] = el)}
                                        key={country.code}
                                        className={index === filteredNationIndex ? "selected" : ""}
                                        onClick={handleClick}>
                                        {country.name}
                                    </li>
                                );
                            }
                            const beforeMatch = country.name.slice(0, matchIndex);
                            const matchText = country.name.slice(matchIndex, matchIndex + nationInput.length);
                            const afterMatch = country.name.slice(matchIndex + nationInput.length);

                            return (
                                <li
                                    ref={(el) => void (filteredNationsRefs.current[index] = el)}
                                    key={country.code}
                                    className={index === filteredNationIndex ? "selected" : ""}
                                    onClick={handleClick}>
                                    {beforeMatch}
                                    <span style={{color: '#007aff', display: "inline"}}>{matchText}</span>
                                    {afterMatch}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
            <div>
                <span>대륙 : <b>{continentAndRegion[0]}</b></span>
                <span>세부지역 : <b>{continentAndRegion[1]}</b></span>
            </div>

        </div>

    )
}