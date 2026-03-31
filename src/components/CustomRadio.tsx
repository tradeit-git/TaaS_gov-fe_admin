import React, {ReactNode, useState} from "react";

export interface CustomRadioItemProps {
    name: string,
    value: string | number,
    label: string | ReactNode,
    checked: boolean,
    onChange: () => void;
}

export function CustomRadioItem(props: CustomRadioItemProps) {
    return (
        <label className="radio_label">
            <input
                type="radio"
                name={props.name}
                value={props.value}
                checked={props.checked}
                onChange={props.onChange}/>
            <span className={'radio_button'}></span>
            {props.label}
        </label>
    )
}

export type CustomRadioOption = {
    id: string | number
    label: string | ReactNode,
}

interface CustomRadioProps {
    options: CustomRadioOption[];
    selectedId: string | number;
    onChange: (value: string | number) => void;
}

export default function CustomRadio(props: CustomRadioProps) {
    const {options, selectedId, onChange} = props;

    const [uId,] = useState(`radio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
    const handleClickRadio = (optionId: string | number | null) => {
        const option = options.find((o) => o.id === optionId);
        onChange(option ? option.id : "");
    };

    return (
        <>
            {
                options.map((option, index) =>
                    <CustomRadioItem key={index} name={uId}
                                     value={option.id}
                                     label={option.label}
                                     checked={option.id === selectedId}
                                     onChange={() => handleClickRadio(option.id)}/>
                )
            }
        </>

    );
}
