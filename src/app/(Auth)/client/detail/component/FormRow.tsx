interface FormRowProps {
    rowNumber: number;
    onDelete: () => void;
}

export default function FormRow({ rowNumber, onDelete }: FormRowProps) {
    return (
        <tr className={'form_row'}>
            <td>{String(rowNumber).padStart(2, '0')}회차</td>
            <td>
                <input type="date"/>
            </td>
            <td>
                <input type="text"/>
                크레딧
            </td>
            <td>
                <button className={'delete_btn'} onClick={onDelete}>삭제</button>
            </td>
        </tr>
    )
}