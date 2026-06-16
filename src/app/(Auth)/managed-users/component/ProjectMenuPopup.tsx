'use client'

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import {usePopupStore} from "@/stores/common/popupStore";

// 관리 클릭 시 뜨는 미니 팝업에서 쓰는 최소 프로젝트 정보
interface MenuProject {
    id: number;
    name: string;
    isBookmark: boolean;
}

interface Props {
    userId: number;
    top: number;
    right: number;
    onClose: () => void;
}

export default function ProjectMenuPopup({userId, top, right, onClose}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();

    const [projects, setProjects] = useState<MenuProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);   // 생성 모드
    const [projectName, setProjectName] = useState('');
    const [saving, setSaving] = useState(false);

    // 해당 유저의 프로젝트 목록 조회
    useEffect(() => {
        (async () => {
            const res = await callApi(`/api/admin/managed-users/${userId}/projects`, {
                method: 'GET',
                credentials: 'include',
            });
            setLoading(false);
            if (res.result && Array.isArray(res.data)) {
                const list = res.data as MenuProject[];
                setProjects(list);
                if (list.length === 0) setCreating(true); // 프로젝트 없으면 바로 생성 모드
            } else {
                setCreating(true);
            }
        })();
    }, [userId]);

    const goProject = (projectId: number) => {
        onClose();
        router.push(`/managed-users/${userId}/projects/${projectId}`);
    };

    const handleCreate = async () => {
        const name = projectName.trim();
        if (!name) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'프로젝트명을 입력해주세요.'}/>);
            return;
        }
        setSaving(true);
        const res = await callApi(`/api/admin/managed-users/${userId}/projects`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({projectName: name}),
        });
        setSaving(false);
        if (res.result && res.data) {
            const created = res.data as MenuProject;
            goProject(created.id);
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '프로젝트 생성에 실패했습니다.'}/>);
        }
    };

    return (
        <>
            <div className={'project_menu_backdrop'} onClick={onClose}/>
            <div className={'project_menu_popup'} style={{top, right}} onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className={'pm_empty'}>불러오는 중...</div>
                ) : creating ? (
                    <div className={'pm_create'}>
                        <p className={'pm_create_label'}>
                            {projects.length === 0 ? '프로젝트가 없습니다. 새로 생성하세요.' : '새 프로젝트 생성'}
                        </p>
                        <input type="text" value={projectName} autoFocus
                               placeholder={'프로젝트명 입력'}
                               disabled={saving}
                               onChange={e => setProjectName(e.target.value)}
                               onKeyDown={e => { if (e.key === 'Enter') void handleCreate(); }}/>
                        <div className={'pm_create_btns'}>
                            {projects.length > 0 && (
                                <button type="button" className={'pm_cancel'} disabled={saving}
                                        onClick={() => { setCreating(false); setProjectName(''); }}>취소</button>
                            )}
                            <button type="button" className={'pm_save'} disabled={saving} onClick={handleCreate}>
                                {saving ? '생성 중...' : '생성'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <ul className={'pm_list'}>
                        {projects.map(p => (
                            <li key={p.id} className={'pm_item'} onClick={() => goProject(p.id)}>
                                <span className={`pm_star${p.isBookmark ? ' on' : ''}`}>{p.isBookmark ? '★' : '☆'}</span>
                                <span className={'pm_name'}>{p.name || '(이름 없음)'}</span>
                            </li>
                        ))}
                        <li className={'pm_item pm_add'} onClick={() => setCreating(true)}>+ 새 프로젝트 생성</li>
                    </ul>
                )}
            </div>
        </>
    );
}
