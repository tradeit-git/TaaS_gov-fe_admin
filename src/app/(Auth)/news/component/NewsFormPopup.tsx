'use client';

import {useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface NewsFormData {
    id?: number;
    title: string;
    thumbnailUrl: string;
    thumbnailFileName?: string;
    thumbnailFileSize?: string;
    content: string;
    sourceUrl: string;
    published: boolean;
    createdAt?: string;
    viewCount?: number;
}

interface Props {
    uId?: string;
    initialData?: Partial<NewsFormData>;
    onSave?: (data: NewsFormData) => void | Promise<void | boolean>;
}

export default function NewsFormPopup({uId, initialData, onSave}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const isEdit = !!initialData;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<NewsFormData>({
        id: initialData?.id,
        title: initialData?.title ?? '',
        thumbnailUrl: initialData?.thumbnailUrl ?? '',
        thumbnailFileName: initialData?.thumbnailFileName ?? '',
        thumbnailFileSize: initialData?.thumbnailFileSize ?? '',
        content: initialData?.content ?? '',
        sourceUrl: initialData?.sourceUrl ?? '',
        published: initialData?.published ?? true,
        createdAt: initialData?.createdAt ?? '',
        viewCount: initialData?.viewCount ?? 0,
    });

    const updateField = <K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
        setForm(prev => ({...prev, [key]: value}));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 확장자/MIME 체크 (JPG/PNG만 허용)
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

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        const res = await callApi(`/api/admin/news/upload-thumbnail`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });
        setUploading(false);

        if (fileInputRef.current) fileInputRef.current.value = '';

        if (!res.result || !res.data) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '이미지 업로드에 실패했습니다.'}/>);
            return;
        }

        const {thumbnailUrl} = res.data as {thumbnailUrl: string};
        setForm(prev => ({
            ...prev,
            thumbnailUrl,
            thumbnailFileName: file.name,
            thumbnailFileSize: sizeText,
        }));
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
        if (uploading) return;
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
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
        if (!/^https?:\/\/.+/i.test(form.sourceUrl.trim())) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'원문 URL은 http:// 또는 https:// 로 시작해야 합니다.'}/>);
            return;
        }
        if (uploading) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미지 업로드 중입니다. 잠시만 기다려주세요.'}/>);
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
                                            onClick={handleChangeThumbnail} disabled={uploading}>
                                        {uploading ? '업로드 중...' : '이미지 변경'}
                                    </button>
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
                                        onClick={handleChangeThumbnail} disabled={uploading}>
                                    {uploading ? '업로드 중...' : '파일 선택'}
                                </button>
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
                    <button type={'button'} className={'save_btn'} disabled={saving || uploading} onClick={handleSave}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
