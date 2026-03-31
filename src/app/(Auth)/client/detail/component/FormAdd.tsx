interface FormAddProps {
    onAdd: () => void;
}

export default function FormAdd({ onAdd }: FormAddProps) {
    return (
        <tr className={'form_add'}>
            <td colSpan={4}>
                <div className={'add_table_btn'} onClick={onAdd}>
                    <span className={'icon'}/>
                    추가
                </div>
            </td>
        </tr>
    )
}