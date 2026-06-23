'use client';

import {useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

interface TagItem {
    color: string;
    name: string;
}

export interface VideoLibraryFormData {
    id?: number;
    title: string;
    thumbnailUrl: string;
    thumbnailFileName?: string;
    thumbnailFileSize?: string;
    tags: TagItem[];
    content: string;
    videoUrl: string;
    published: boolean;
    pinned: boolean;
    createdAt?: string;
    viewCount?: number;
}

const TAG_COLORS = [
    {value: '#FF7063', label: 'Red'},
    {value: '#FFBB00', label: 'Yellow'},
    {value: '#8ABF28', label: 'Green'},
    {value: '#37B3F2', label: 'Blue'},
    {value: '#AD70EE', label: 'Purple'},
    {value: '#FF5E91', label: 'Pink'},
];

interface Props {
    uId?: string;
    initialData?: Partial<VideoLibraryFormData>;
    onSave?: (data: VideoLibraryFormData) => void | Promise<void | boolean>;
}

export default function VideoLibraryFormPopup({uId, initialData, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<VideoLibraryFormData>({
        id: initialData?.id,
        title: initialData?.title ?? '',
        thumbnailUrl: initialData?.thumbnailUrl ?? '',
        thumbnailFileName: initialData?.thumbnailFileName ?? '',
        thumbnailFileSize: initialData?.thumbnailFileSize ?? '',
        tags: initialData?.tags ?? [],
        content: initialData?.content ?? '',
        videoUrl: initialData?.videoUrl ?? '',
        published: initialData?.published ?? true,
        pinned: initialData?.pinned ?? false,
        createdAt: initialData?.createdAt ?? '',
        viewCount: initialData?.viewCount ?? 0,
    });

    const [tagColor, setTagColor] = useState('');
    const [tagName, setTagName] = useState('');
    const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
    const colorDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
                setColorDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateField = <K extends keyof VideoLibraryFormData>(key: K, value: VideoLibraryFormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const handleAddTag = () => {
        if (!tagColor || !tagName.trim()) return;
        setForm(prev => ({
            ...prev,
            tags: [...prev.tags, {color: tagColor, name: tagName.trim()}],
        }));
        setTagName('');
    };

    const handleRemoveTag = (index: number) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedMimes = ['image/png', 'image/jpeg'];
        const allowedExts = ['.png', '.jpg', '.jpeg'];
        const lowerName = file.name.toLowerCase();
        const extOk = allowedExts.some(ext => lowerName.endsWith(ext));
        if (!allowedMimes.includes(file.type) || !extOk) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'JPG 또는 PNG 이미지만 업로드 가능합니다.'}/>);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const sizeKb = Math.round(file.size / 1024);
        const sizeText = sizeKb >= 1024
            ? `${(sizeKb / 1024).toFixed(1)}MB`
            : `${sizeKb}KB`;

        const url = URL.createObjectURL(file);
        setForm(prev => ({
            ...prev,
            thumbnailUrl: url,
            thumbnailFileName: file.name,
            thumbnailFileSize: sizeText,
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveThumbnail = () => {
        setForm(prev => ({
            ...prev,
            thumbnailUrl: '',
            thumbnailFileName: '',
            thumbnailFileSize: '',
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleChangeThumbnail = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'제목을 입력해주세요.'}/>);
            return;
        }
        if (!form.content.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'상세내용을 입력해주세요.'}/>);
            return;
        }
        if (!form.videoUrl.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'영상링크 URL을 입력해주세요.'}/>);
            return;
        }
        if (!/^https?:\/\/.+/i.test(form.videoUrl.trim())) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'영상링크 URL은 http:// 또는 https:// 로 시작해야 합니다.'}/>);
            return;
        }

        setSaving(true);
        const result = await onSave?.(form);
        setSaving(false);
        if (result !== false) {
            closePopup(uId ?? '');
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? '영상라이브러리 수정' : '영상라이브러리 등록'}</h4>

                <div className={'popup_body'}>
                    {/* 상단 고정 여부 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>상단 고정 여부</label>
                        <label className={'toggle_switch'}>
                            <input type="checkbox" checked={form.pinned}
                                   onChange={e => updateField('pinned', e.target.checked)}/>
                            <span className={'toggle_slider'}/>
                            <span className={`toggle_label ${form.pinned ? 'on' : 'off'}`}>
                                {form.pinned ? '고정' : '고정'}
                            </span>
                        </label>
                    </div>

                    {/* 제목 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>제목 <span className={'required'}>*</span></label>
                        <input type="text" value={form.title}
                               onChange={e => updateField('title', e.target.value)}/>
                    </div>

                    {/* 썸네일 이미지 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>썸네일 이미지</label>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg"
                               style={{display: 'none'}}
                               onChange={handleFileSelect}/>

                        {form.thumbnailUrl ? (
                            <div className={'thumb_preview'}>
                                <img src={form.thumbnailUrl} alt={'thumbnail'} className={'thumb_image'}/>
                                <div className={'thumb_info'}>
                                    <p className={'thumb_name'}>{form.thumbnailFileName || '썸네일 이미지'}</p>
                                    {form.thumbnailFileSize && (
                                        <p className={'thumb_size'}>{form.thumbnailFileSize}</p>
                                    )}
                                    <button type="button" className={'btn_change_image'}
                                            onClick={handleChangeThumbnail}>
                                        이미지 변경
                                    </button>
                                </div>
                                <button type="button" className={'btn_remove_thumb'}
                                        onClick={handleRemoveThumbnail}>×</button>
                            </div>
                        ) : (
                            <div className={'thumb_uploader'}>
                                <span className={'admin_icon'}/>
                                <p className={'upload_title'}>썸네일 이미지를 업로드 해주세요</p>
                                <p className={'upload_desc'}>JPG/PNG 지원 · 1장만 업로드 가능 · 501 × 281px 권장</p>
                                <button type="button" className={'btn_file_select'}
                                        onClick={handleChangeThumbnail}>
                                    파일 선택
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 태그 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>태그</label>
                        <div className={'tag_input_wrap'}>
                            <div className={'color_select_wrap'} ref={colorDropdownRef}>
                                <button type="button" className={'color_select_trigger'}
                                        onClick={() => setColorDropdownOpen(prev => !prev)}>
                                    {tagColor
                                        ? <><span className={'color_dot'} style={{backgroundColor: tagColor}}/>{TAG_COLORS.find(c => c.value === tagColor)?.label}</>
                                        : '컬러 선택'}
                                    <span className={'color_select_arrow'}/>
                                </button>
                                {colorDropdownOpen && (
                                    <ul className={'color_select_dropdown'}>
                                        {TAG_COLORS.map(c => (
                                            <li key={c.value} style={{color: c.value}} onClick={() => { setTagColor(c.value); setColorDropdownOpen(false); }}>
                                                <span className={'color_dot'} style={{backgroundColor: c.value}}/>
                                                {c.label}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <input type="text" value={tagName} placeholder={'태그명 입력'}
                                   onChange={e => setTagName(e.target.value)}
                                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}/>
                            <button type="button" className={'btn_tag_add'} onClick={handleAddTag}>+ 추가</button>
                        </div>
                        {form.tags.length > 0 && (
                            <div className={'tag_list'}>
                                {form.tags.map((tag, i) => (
                                    <span key={i} className={'tag_item'} style={{backgroundColor: tag.color}}>
                                        {tag.name}
                                        <button type="button" onClick={() => handleRemoveTag(i)}>×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 상세내용 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>상세내용 <span className={'required'}>*</span></label>
                        <textarea value={form.content} rows={4} style={{height: 100}}
                                  onChange={e => updateField('content', e.target.value)}/>
                    </div>

                    {/* 영상링크 URL */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>영상링크 URL <span className={'required'}>*</span></label>
                        <input type="text" value={form.videoUrl}
                               onChange={e => updateField('videoUrl', e.target.value)}/>
                    </div>

                    {/* 게시 여부 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>게시 여부</label>
                        <label className={'toggle_switch'}>
                            <input type="checkbox" checked={form.published}
                                   onChange={e => updateField('published', e.target.checked)}/>
                            <span className={'toggle_slider'}/>
                            <span className={`toggle_label ${form.published ? 'on' : 'off'}`}>
                                {form.published ? '게시' : '게시 중단'}
                            </span>
                        </label>
                    </div>

                    {/* 수정 모드 전용 - 등록일시 / 조회수 */}
                    {isEdit && (
                        <>
                            <div className={'popup_field'}>
                                <label className={'label_optional'}>등록일시</label>
                                <input type="text" value={form.createdAt ?? ''} disabled/>
                            </div>
                            <div className={'popup_field'}>
                                <label className={'label_optional'}>조회수</label>
                                <input type="text" value={String(form.viewCount ?? 0)} disabled/>
                            </div>
                        </>
                    )}
                </div>

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={handleSave}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
