'use client'

import {NewsRow} from "@/app/(Auth)/news/component/NewsPage";

interface Props {
    data: NewsRow[];
    totalElements: number;
    currentPage: number;
    itemsPerPage: number;
    formatDate: (date: string | null | undefined) => string;
    onDelete: (id: number) => void;
    onEdit: (row: NewsRow) => void;
    onTogglePublished: (id: number, next: boolean) => void;
}

export default function NewsTableBody({data, totalElements, currentPage, itemsPerPage, formatDate, onDelete, onEdit, onTogglePublished}: Props) {
    return (
        <tbody>
        {data.map((row, i) => {
            const rowNum = totalElements - (currentPage * itemsPerPage) - i;

            return (
                <tr key={row.id}>
                    <td>{rowNum}</td>
                    <td className={'td_title'}>{row.title}</td>
                    <td>
                        {row.thumbnailUrl
                            ? <img src={row.thumbnailUrl} alt={row.title} className={'news_thumb'}
                                   style={{width: 90, height: 60, aspectRatio: '6 / 4', objectFit: 'cover'}}/>
                            : <span className={'news_thumb_empty'}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 90,
                                        height: 60,
                                        aspectRatio: '6 / 4',
                                        background: '#f5f5f5',
                                        border: '1px solid #e5e5e5',
                                        borderRadius: 4,
                                        color: '#999',
                                        fontSize: 12,
                                    }}>No Image</span>}
                    </td>
                    <td>
                        {row.sourceUrl
                            ? <a href={row.sourceUrl} target="_blank" rel="noreferrer">{row.sourceUrl}</a>
                            : '-'}
                    </td>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.viewCount.toLocaleString()}</td>
                    <td>
                        <label className={'toggle_switch'}>
                            <input type="checkbox"
                                   checked={row.published}
                                   onChange={() => {}}
                                   onClick={e => {
                                       e.preventDefault();
                                       onTogglePublished(row.id, !row.published);
                                   }}/>
                            <span className={'toggle_slider'}/>
                            <span className={`toggle_label ${row.published ? 'on' : 'off'}`}>
                                {row.published ? '게시' : '중단'}
                            </span>
                        </label>
                    </td>
                    <td className={'td_actions'}>
                        <div className={'actions_inner'}>
                            <button type="button" className={'btn_detail'}
                                    onClick={() => onEdit(row)}>수정</button>
                            <button type="button" className={'btn_delete'} onClick={() => onDelete(row.id)}>
                                <span className={'admin_icon icon_trash'}/>
                            </button>
                        </div>
                    </td>
                </tr>
            );
        })}
        </tbody>
    );
}
