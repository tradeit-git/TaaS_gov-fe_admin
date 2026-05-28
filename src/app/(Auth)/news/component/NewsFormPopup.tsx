'use client';

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface NewsFormData {
    id?: number;
    title: string;
    thumbnailUrl: string;
    thumbnailFileName?: string;
    thumbnailFileSize?: string;
    content: string;
    sourceUrl: string;
    createdAt?: string;
    views?: number;
}

interface Props {
    uId?: string;
    initialData?: Partial<NewsFormData>;
    onSave?: (data: NewsFormData) => void;
}

export default function NewsFormPopup({uId, initialData, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<NewsFormData>({
        id: initialData?.id,
        title: initialData?.title ?? '',
        thumbnailUrl: initialData?.thumbnailUrl ?? '',
        thumbnailFileName: initialData?.thumbnailFileName ?? '',
        thumbnailFileSize: initialData?.thumbnailFileSize ?? '',
        content: initialData?.content ?? '',
        sourceUrl: initialData?.sourceUrl ?? '',
        createdAt: initialData?.createdAt ?? '',
        views: initialData?.views ?? 0,
    });

    const updateField = <K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeKb = Math.round(file.size / 1024);
        const sizeText = sizeKb >= 1024
            ? `${(sizeKb / 1024).toFixed(1)}MB`
            : `${sizeKb}KB`;

        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({
                ...prev,
                thumbnailUrl: reader.result as string,
                thumbnailFileName: file.name,
                thumbnailFileSize: sizeText,
            }));
        };
        reader.readAsDataURL(file);
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

    const handleSave = () => {
        if (!form.title.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'제목을 입력해주세요.'}/>);
            return;
        }
        if (!form.content.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'주요내용을 입력해주세요.'}/>);
            return;
        }
        if (!form.sourceUrl.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'원문 URL을 입력해주세요.'}/>);
            return;
        }

        onSave?.(form);
        closePopup(uId ?? '');
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>{isEdit ? '보도자료 수정' : '보도자료 등록'}</h4>

                <div className={'popup_body'}>
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
                                            onClick={handleChangeThumbnail}>이미지 변경</button>
                                </div>
                                <button type="button" className={'btn_remove_thumb'}
                                        onClick={handleRemoveThumbnail}>×</button>
                            </div>
                        ) : (
                            <div className={'thumb_uploader'}>
                                <span className={'admin_icon'}/>
                                <p className={'upload_title'}>썸네일 이미지를 업로드 해주세요</p>
                                <p className={'upload_desc'}>JPG/PNG 지원 · 1장만 업로드 가능 · 600 × 400px 권장</p>
                                <button type="button" className={'btn_file_select'}
                                        onClick={handleChangeThumbnail}>파일 선택</button>
                            </div>
                        )}
                    </div>

                    {/* 주요내용 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>주요내용 <span className={'required'}>*</span></label>
                        <textarea value={form.content} rows={4}
                                  onChange={e => updateField('content', e.target.value)}/>
                    </div>

                    {/* 원문 URL */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>원문 URL <span className={'required'}>*</span></label>
                        <input type="text" value={form.sourceUrl}
                               onChange={e => updateField('sourceUrl', e.target.value)}/>
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
                                <input type="text" value={String(form.views ?? 0)} disabled/>
                            </div>
                        </>
                    )}
                </div>

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} onClick={handleSave}>저장</button>
                </div>
            </div>
        </div>
    );
}
