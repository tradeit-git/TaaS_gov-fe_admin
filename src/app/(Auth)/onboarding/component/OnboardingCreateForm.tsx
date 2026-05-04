'use client'

import {useState} from "react";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {HostAdmin, ONBOARDING_CLASSES} from "@/app/(Auth)/onboarding/component/OnboardingPage";

type CheckStatus = null | 'duplicate' | 'available';

const ONBOARDING_TIMES = ['10:00', '14:00'] as const;

const buildSessionAt = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
};

interface Props {
    hosts: HostAdmin[];
    onCreated?: () => void;
}

export default function OnboardingCreateForm({hosts, onCreated}: Props) {
    const {addPopup} = usePopupStore();
    const [sessionDate, setSessionDate] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [className, setClassName] = useState('');
    const [url, setUrl] = useState('');
    const [hostAdminId, setHostAdminId] = useState<number | ''>('');

    const [sessionAtCheck, setSessionAtCheck] = useState<CheckStatus>(null);
    const [urlCheck, setUrlCheck] = useState<CheckStatus>(null);

    const handleReset = () => {
        setSessionDate('');
        setSessionTime('');
        setClassName('');
        setUrl('');
        setHostAdminId('');
        setSessionAtCheck(null);
    };

    const checkDuplicate = async (field: 'sessionAt' | 'url') => {
        if (field === 'sessionAt') {
            const sessionAt = buildSessionAt(sessionDate, sessionTime);
            if (!sessionAt) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'일시를 먼저 선택해주세요.'}/>);
                return;
            }
            const res = await callApi(`/api/admin/onboarding-sessions/check-duplicate?sessionAt=${encodeURIComponent(sessionAt)}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.result && res.data) {
                const {sessionAtDuplicated} = res.data as { sessionAtDuplicated: boolean };
                setSessionAtCheck(sessionAtDuplicated ? 'duplicate' : 'available');
            }
            return;
        }
    };

    const handleCreate = async () => {
        const sessionAt = buildSessionAt(sessionDate, sessionTime);

        if (!sessionAt || !className || !url.trim() || !hostAdminId) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'모든 필수 항목을 입력해주세요.'}/>);
            return;
        }
        if (sessionAtCheck !== 'available') {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'중복체크를 완료해주세요.'}/>);
            return;
        }

        const res = await callApi(`/api/admin/onboarding-sessions`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                sessionAt,
                className,
                url: url.trim(),
                hostAdminId,
            }),
        });

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'온보딩이 등록되었습니다.'}/>);
            handleReset();
            onCreated?.();
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '등록에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'client_create_form onboarding_create_form'}>
            <div className={'form_grid'}>
                <div className={'form_grid_col left'}>
                    <div className={'form_field'}>
                        <label><span className={'required'}>*</span> 일시</label>
                        <div className={'input_wrap'}>
                            <input type="date" value={sessionDate}
                                   onChange={e => {
                                       setSessionDate(e.target.value);
                                       setSessionAtCheck(null);
                                   }}/>
                            {sessionAtCheck === 'duplicate' && <p className={'error_msg'}>이미 등록된 일시입니다</p>}
                            <select value={sessionTime}
                                    onChange={e => {
                                        setSessionTime(e.target.value);
                                        setSessionAtCheck(null);
                                    }}>
                                <option value="">선택</option>
                                {ONBOARDING_TIMES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <button type="button"
                                className={`btn_check ${sessionAtCheck === 'available' ? 'disabled' : ''}`}
                                disabled={sessionAtCheck === 'available'}
                                onClick={() => checkDuplicate('sessionAt')}>중복체크
                        </button>
                    </div>
                </div>
                <div className={'form_grid_col right'}>
                    <div className={'form_field'}>
                        <label><span className={'required'}>*</span> 접속 URL</label>
                        <div className={'input_wrap'}>
                            <input type="text" value={url}
                                   onChange={e => {
                                       setUrl(e.target.value);
                                   }}
                                   placeholder={''}/>
                        </div>
                    </div>
                    <div className={'form_field'}>
                        <label><span className={'required'}>*</span> 온보딩 클래스</label>
                        <select value={className} onChange={e => setClassName(e.target.value)}>
                            <option value="">선택</option>
                            {ONBOARDING_CLASSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className={'form_field'}>
                        <label><span className={'required'}>*</span> 진행자</label>
                        <select value={hostAdminId}
                                onChange={e => setHostAdminId(e.target.value ? Number(e.target.value) : '')}>
                            <option value="">선택</option>
                            {hosts.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'} onClick={handleCreate}>등록</button>
                <button type="button" className={'btn_reset'} onClick={handleReset}>초기화</button>
            </div>
        </div>
    );
}
