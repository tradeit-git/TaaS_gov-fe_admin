'use client';

import {useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {formatDateTimeDot} from "@/utill/format";

// 유튜브 도메인(youtube.com / youtu.be)만 허용
const isYoutubeUrl = (url: string) => {
    try {
        const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
        return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    } catch {
        return false;
    }
};

// 유튜브 URL → videoId 추출
const extractYoutubeId = (url: string): string | null => {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
        if (host === 'youtube.com' || host === 'm.youtube.com') {
            if (u.pathname === '/watch') return u.searchParams.get('v');
            const seg = u.pathname.split('/');
            if (seg[1] === 'embed' || seg[1] === 'shorts' || seg[1] === 'v') return seg[2] || null;
        }
        return null;
    } catch {
        return null;
    }
};

// 유튜브 썸네일 URL 여부 (자동 채운 썸네일 식별용)
const isYoutubeThumb = (url: string) => /(?:i\.ytimg\.com|img\.youtube\.com)\/vi\//.test(url);

// videoId로 썸네일 URL 조회 — maxres 우선, 없으면 hqdefault로 폴백
const resolveYoutubeThumbnail = (videoId: string): Promise<string> => {
    const maxres = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    const hq = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (typeof window === 'undefined') return Promise.resolve(hq);
    return new Promise((resolve) => {
        const img = new Image();
        // maxres가 없으면 유튜브가 120x90 placeholder를 반환 → 폭으로 존재 여부 판별
        img.onload = () => resolve(img.naturalWidth > 120 ? maxres : hq);
        img.onerror = () => resolve(hq);
        img.src = maxres;
    });
};

// 초 → "m:ss" 또는 "h:mm:ss"
const formatDuration = (totalSec: number): string => {
    const s = Math.floor(totalSec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

// YouTube IFrame Player API 로더 (1회 로드 후 캐싱)
let ytApiPromise: Promise<any> | null = null;
const loadYoutubeIframeApi = (): Promise<any> => {
    if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
    const w = window as any;
    if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
    if (ytApiPromise) return ytApiPromise;

    ytApiPromise = new Promise((resolve, reject) => {
        const prev = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve(w.YT);
        };
        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
        }
        const timer = setInterval(() => {
            if (w.YT && w.YT.Player) {
                clearInterval(timer);
                resolve(w.YT);
            }
        }, 100);
        setTimeout(() => {
            clearInterval(timer);
            if (!(w.YT && w.YT.Player)) reject(new Error('YouTube API 로드 시간 초과'));
        }, 10000);
    });
    return ytApiPromise;
};

// 숨김 플레이어로 영상 길이(초)를 조회
// 숨김 플레이어로 영상 길이(초) + 제목을 함께 조회
const fetchYoutubeVideoInfo = async (videoId: string): Promise<{durationSec: number; title: string}> => {
    const YT = await loadYoutubeIframeApi();
    return new Promise<{durationSec: number; title: string}>((resolve, reject) => {
        const holder = document.createElement('div');
        holder.style.position = 'fixed';
        holder.style.left = '-9999px';
        holder.style.top = '0';
        holder.style.width = '1px';
        holder.style.height = '1px';
        document.body.appendChild(holder);

        let settled = false;
        const cleanup = () => {
            try { player?.destroy(); } catch { /* noop */ }
            holder.remove();
        };

        const player = new YT.Player(holder, {
            videoId,
            playerVars: {autoplay: 0, controls: 0},
            events: {
                onReady: () => {
                    // 일부 영상은 onReady 직후 getDuration이 0 → 짧게 폴링
                    let tries = 0;
                    const poll = setInterval(() => {
                        if (settled) { clearInterval(poll); return; }
                        const sec = player.getDuration?.() ?? 0;
                        if (sec && sec > 0) {
                            clearInterval(poll);
                            settled = true;
                            const title = player.getVideoData?.()?.title ?? '';
                            cleanup();
                            resolve({durationSec: sec, title});
                        } else if (++tries >= 20) { // 약 5초
                            clearInterval(poll);
                        }
                    }, 250);
                },
                onError: (e: any) => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(new Error(`재생 불가 영상 (코드 ${e?.data})`));
                },
            },
        });

        setTimeout(() => {
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error('영상 길이 조회 시간 초과'));
        }, 10000);
    });
};

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
    duration?: number | null; // 영상 길이(초). 체크 전이면 null
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
    const [uploading, setUploading] = useState(false);
    const [fetchingDuration, setFetchingDuration] = useState(false);

    const [form, setForm] = useState<VideoLibraryFormData>({
        id: initialData?.id,
        title: initialData?.title ?? '',
        thumbnailUrl: initialData?.thumbnailUrl ?? '',
        thumbnailFileName: initialData?.thumbnailFileName ?? '',
        thumbnailFileSize: initialData?.thumbnailFileSize ?? '',
        tags: initialData?.tags ?? [],
        content: initialData?.content ?? '',
        videoUrl: initialData?.videoUrl ?? '',
        duration: initialData?.duration ?? null,
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

    // URL이 바뀌면 이전에 확인한 영상 길이는 무효화 → 다시 체크하도록 강제
    // (자동으로 채운 유튜브 썸네일도 함께 비움. 직접 업로드한 썸네일은 유지)
    const handleVideoUrlChange = (value: string) => {
        setForm(prev => {
            const autoThumb = !!prev.thumbnailUrl && isYoutubeThumb(prev.thumbnailUrl);
            return {
                ...prev,
                videoUrl: value,
                duration: null,
                ...(autoThumb ? {thumbnailUrl: '', thumbnailFileName: '', thumbnailFileSize: ''} : {}),
            };
        });
    };

    // "체크" 버튼: 영상링크 URL 유효성 검사 + 유튜브 영상 길이(초) 조회
    const handleCheckUrl = async () => {
        const url = form.videoUrl.trim();
        if (!url) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'영상링크 URL을 입력해주세요.'}/>);
            return;
        }
        if (!/^https?:\/\/.+/i.test(url)) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'영상링크 URL은 http:// 또는 https:// 로 시작해야 합니다.'}/>);
            return;
        }
        if (!isYoutubeUrl(url)) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'유튜브 영상 URL(youtube.com / youtu.be)만 등록할 수 있습니다.'}/>);
            return;
        }
        const videoId = extractYoutubeId(url);
        if (!videoId) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'유튜브 영상 ID를 인식할 수 없는 URL입니다.'}/>);
            return;
        }

        setFetchingDuration(true);
        try {
            const {durationSec, title} = await fetchYoutubeVideoInfo(videoId);
            // 영상 길이 + 썸네일(직접 업로드한 썸네일은 보존) + 제목(비어있을 때만 자동 채움)
            const thumb = await resolveYoutubeThumbnail(videoId);
            setForm(prev => {
                const keepCustomThumb = !!prev.thumbnailUrl && !isYoutubeThumb(prev.thumbnailUrl);
                return {
                    ...prev,
                    duration: Math.round(durationSec),
                    ...(title ? {title} : {}),
                    ...(keepCustomThumb ? {} : {
                        thumbnailUrl: thumb,
                        thumbnailFileName: '유튜브 썸네일',
                        thumbnailFileSize: '',
                    }),
                };
            });
        } catch (e) {
            updateField('duration', null);
            addPopup(<AlertComponent alertType={'alert'} infoContent={(e as Error).message || '영상 길이를 가져오지 못했습니다. URL을 확인해주세요.'}/>);
        } finally {
            setFetchingDuration(false);
        }
    };

    const handleAddTag = () => {
        if (!tagColor || !tagName.trim()) return;
        const name = tagName.trim();
        const dup = form.tags.some(t => t.name.trim().toLowerCase() === name.toLowerCase());
        if (dup) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미 추가된 태그입니다.'}/>);
            return;
        }
        setForm(prev => ({
            ...prev,
            tags: [...prev.tags, {color: tagColor, name}],
        }));
        setTagName('');
    };

    const handleRemoveTag = (index: number) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.filter((_, i) => i !== index),
        }));
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);
        const res = await callApi(`/api/admin/video-library/upload-thumbnail`, {
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
        if (!isYoutubeUrl(form.videoUrl.trim())) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'유튜브 영상 URL(youtube.com / youtu.be)만 등록할 수 있습니다.'}/>);
            return;
        }
        if (form.duration == null) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'영상링크 URL 옆 [체크] 버튼으로 URL 확인 및 영상 길이를 가져와주세요.'}/>);
            return;
        }
        if (uploading) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'이미지 업로드 중입니다. 잠시만 기다려주세요.'}/>);
            return;
        }
        if (fetchingDuration) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'영상 길이를 가져오는 중입니다. 잠시만 기다려주세요.'}/>);
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
            <div className={'news_form_popup video_form_popup'}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20}}>
                    <h4 style={{margin: 0}}>{isEdit ? '영상라이브러리 수정' : '영상라이브러리 등록'}</h4>
                    {isEdit && (
                        <div style={{display: 'flex', gap: 16, fontSize: 13, color: '#666'}}>
                            <span>등록일시 <b style={{color: '#333', fontWeight: 500}}>{form.createdAt ? formatDateTimeDot(form.createdAt) : '-'}</b></span>
                            <span>조회수 <b style={{color: '#333', fontWeight: 500}}>{(form.viewCount ?? 0).toLocaleString()}</b></span>
                        </div>
                    )}
                </div>

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

                    {/* 영상링크 URL + 체크(유효성 검사 & 영상 길이/썸네일/제목 조회) */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>영상링크 URL <span className={'required'}>*</span></label>
                        <div className={'tag_input_wrap'}>
                            <input type="text" value={form.videoUrl}
                                   placeholder={'유튜브 영상 URL (youtube.com / youtu.be)'}
                                   onChange={e => handleVideoUrlChange(e.target.value)}/>
                            <button type="button" className={'btn_tag_add'}
                                    onClick={handleCheckUrl} disabled={fetchingDuration}>
                                {fetchingDuration ? '확인 중...' : '체크'}
                            </button>
                        </div>
                        <p style={{marginTop: 6, fontSize: 13, color: form.duration != null ? '#1a9d52' : '#999'}}>
                            {fetchingDuration
                                ? '영상 길이를 가져오는 중...'
                                : (form.duration != null
                                    ? `URL 확인 완료 · 영상 길이 ${formatDuration(form.duration)}`
                                    : '[체크] 버튼으로 URL 확인 및 영상 길이를 가져와주세요. (필수)')}
                        </p>
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
                                <p className={'upload_desc'}>JPG/PNG 지원 · 1장만 업로드 가능 · 501 × 281px 권장</p>
                                <button type="button" className={'btn_file_select'}
                                        onClick={handleChangeThumbnail} disabled={uploading}>
                                    {uploading ? '업로드 중...' : '파일 선택'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 제목 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>제목 <span className={'required'}>*</span></label>
                        <input type="text" value={form.title}
                               onChange={e => updateField('title', e.target.value)}/>
                    </div>

                    {/* 상세내용 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>상세내용 <span className={'required'}>*</span></label>
                        <textarea value={form.content} rows={4} style={{height: 100}}
                                  onChange={e => updateField('content', e.target.value)}/>
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
                </div>

                {/* 버튼 */}
                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving || uploading || fetchingDuration} onClick={handleSave}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
