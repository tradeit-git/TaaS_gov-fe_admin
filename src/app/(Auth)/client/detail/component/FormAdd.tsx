interface FormAddProps {
    onAdd: () => void;
}

export default function FormAdd({ onAdd }: FormAddProps) {
    return (
        <tr className={'form_add'} onClick={onAdd}>
            <td colSpan={4}>
                <div className={'add_table_btn'}>
                    <span className={'admin_icon'}/>
                    추가
                </div>
            </td>
        </tr>
    )
}