'use client'

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

// 빠른이동 검색 결과 (#2-1 GET /api/admin/managed-users/projects/search)
interface QuickProjectResult {
    userId: number;
    projectId: number;
    companyName: string;
    ownerName: string;
    ownerLoginId: string;
    projectName: string;
    buyerCountPerStep: Record<string, number>;
    salesLogCount: number;
}

// 즐겨찾기 헤더 ▼ 드롭다운 = #2-2 GET /managed-users/projects/bookmarks (응답 항목은 #2-1과 동일, 배열)

export default function ProjectBox() {
    const router = useRouter();
    const {userId, projectId, selectedProject} = useProjectTrackerStore();
    const {addPopup} = usePopupStore();

    const [createOpen, setCreateOpen] = useState(false);   // 프로젝트명 헤더 + 생성 팝업
    const [createName, setCreateName] = useState('');
    const [createSaving, setCreateSaving] = useState(false);
    const [quickOpen, setQuickOpen] = useState(false);
    const [projectKeyword, setProjectKeyword] = useState('');   // 프로젝트명 필터
    const [userKeyword, setUserKeyword] = useState('');         // 사용자 필터 (기업명·이름·아이디)
    const [quickItems, setQuickItems] = useState<QuickProjectResult[]>([]);
    const [quickLoading, setQuickLoading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);   // 프로젝트 즐겨찾기 (실제 API)
    const [favSaving, setFavSaving] = useState(false);
    const [favOpen, setFavOpen] = useState(false);         // 즐겨찾기 헤더 ▼ 드롭다운 (즐겨찾기 프로젝트 이동)
    const [favItems, setFavItems] = useState<QuickProjectResult[]>([]);
    const [favLoading, setFavLoading] = useState(false);

    // selectedProject 로드 시 즐겨찾기 상태 동기화
    useEffect(() => {
        setIsFavorite(!!selectedProject.isBookmark);
    }, [selectedProject.isBookmark]);

    // ★ 토글: PUT .../projects/{projectId}/setBookmark (boolean)
    const toggleFavorite = async () => {
        if (favSaving || selectedProject.id === 0) return;
        const next = !isFavorite;
        setFavSaving(true);
        const res = await callApi(`/api/admin/managed-users/${userId}/projects/${projectId}/setBookmark`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(next),
        });
        setFavSaving(false);
        if (res.result) setIsFavorite(next);
    };

    // 프로젝트 생성: POST .../{userId}/projects {projectName} → 생성된 프로젝트로 이동
    const handleCreateProject = async () => {
        const name = createName.trim();
        if (!name) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'프로젝트명을 입력해주세요.'}/>);
            return;
        }
        setCreateSaving(true);
        const res = await callApi(`/api/admin/managed-users/${userId}/projects`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({projectName: name}),
        });
        setCreateSaving(false);
        if (res.result && res.data) {
            const created = res.data as { id: number };
            setCreateOpen(false);
            router.push(`/managed-users/${userId}/projects/${created.id}`);
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '프로젝트 생성에 실패했습니다.'}/>);
        }
    };

    // 빠른이동 전역 검색 (#2-1, 디바운스). 팝업 열렸을 때만 호출.
    useEffect(() => {
        if (!quickOpen) return;
        setQuickLoading(true);
        const timer = setTimeout(async () => {
            const params = new URLSearchParams();
            if (projectKeyword.trim()) params.set('projectName', projectKeyword.trim());
            if (userKeyword.trim()) params.set('keyword', userKeyword.trim());
            params.set('page', '0');
            params.set('size', '50');
            const res = await callApi(`/api/admin/managed-users/projects/search?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
            });
            setQuickLoading(false);
            const content = res.result && res.data ? (res.data as { content?: QuickProjectResult[] }).content : null;
            setQuickItems(Array.isArray(content) ? content : []);
        }, 500);
        return () => clearTimeout(timer);
    }, [quickOpen, projectKeyword, userKeyword]);

    // 즐겨찾기 드롭다운: #2-2 (열렸을 때 조회, 배열 응답)
    useEffect(() => {
        if (!favOpen) return;
        setFavLoading(true);
        (async () => {
            const res = await callApi(`/api/admin/managed-users/projects/bookmarks`, {
                method: 'GET',
                credentials: 'include',
            });
            setFavLoading(false);
            setFavItems(res.result && Array.isArray(res.data) ? (res.data as QuickProjectResult[]) : []);
        })();
    }, [favOpen]);

    const isEmpty = selectedProject.id === 0;
    const ownerName = isEmpty ? 'N/A'
        : `${selectedProject.createUser.name}(${selectedProject.createUser.email || selectedProject.createUser.loginId})`;

    return (
        <div className={'tracker-project-box managed-detail'}>
            <div className="contents_wrap">
                <div className={'tracker_top'}>
                    {/* 좌측 버튼: 목록 / 빠른이동 */}
                    <div className={'tracker_top_btns'}>
                        <button type="button" className={'project_list_btn'} onClick={() => router.push('/managed-users')}>
                            <span className={'icon_admin icon_prev'}/>목록
                        </button>
                        <button type="button" className={'project_quick_btn'} onClick={() => setQuickOpen(true)}>
                            빠른이동
                        </button>
                    </div>

                    {/* 정보 테이블 (읽기전용) */}
                    <div className={'project_table'}>
                        <table className="contents_box">
                            <colgroup>
                                <col style={{width: '7%'}}/>
                                <col style={{width: '15%'}}/>
                                <col style={{width: '20%'}}/>
                                <col style={{width: '22%'}}/>
                                <col style={{width: '12%'}}/>
                                <col style={{width: '12%'}}/>
                                <col style={{width: '12%'}}/>
                            </colgroup>
                            <thead>
                            <tr>
                                <th className={'fav_th'}>
                                    <div className={'fav_th_inner'}>
                                        즐겨찾기
                                        <button type="button" className={'fav_dd_btn'}
                                                onClick={() => setFavOpen(v => !v)}
                                                aria-label="즐겨찾기 프로젝트 이동">▼</button>
                                        {favOpen && (
                                            <>
                                                <div className={'fav_dd_backdrop'} onClick={() => setFavOpen(false)}/>
                                                <div className={'fav_dd_list'}>
                                                    {favLoading ? (
                                                        <div className={'fav_dd_empty'}>불러오는 중...</div>
                                                    ) : favItems.length === 0 ? (
                                                        <div className={'fav_dd_empty'}>즐겨찾기한 프로젝트가 없습니다.</div>
                                                    ) : (
                                                        <table className={'fav_dd_table'}>
                                                            <colgroup>
                                                                <col style={{width: '18%'}}/>
                                                                <col style={{width: '26%'}}/>
                                                                <col style={{width: '26%'}}/>
                                                                <col style={{width: '18%'}}/>
                                                                <col style={{width: '12%'}}/>
                                                            </colgroup>
                                                            <thead>
                                                            <tr>
                                                                <th>기업명</th>
                                                                <th>이름(이메일)</th>
                                                                <th>프로젝트명</th>
                                                                <th>바이어 리스트</th>
                                                                <th>활동일지수</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {favItems.map(p => {
                                                                const b = p.buyerCountPerStep || {};
                                                                return (
                                                                    <tr key={`${p.userId}-${p.projectId}`} className={'fav_dd_row'}
                                                                        onClick={() => {
                                                                            router.push(`/managed-users/${p.userId}/projects/${p.projectId}`);
                                                                            setFavOpen(false);
                                                                        }}>
                                                                        <td>{p.companyName}</td>
                                                                        <td>{p.ownerName}({p.ownerLoginId})</td>
                                                                        <td>{p.projectName}</td>
                                                                        <td>{`${b.List ?? 0} / ${b.Lead ?? 0} / ${b.Target ?? 0} / ${b.Client ?? 0}`}</td>
                                                                        <td>{(p.salesLogCount ?? 0).toLocaleString()}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </th>
                                <th>기업명</th>
                                <th>이름(이메일)</th>
                                <th className={'create_th'}>
                                    <div className={'create_th_inner'}>
                                        프로젝트명
                                        <button type="button" className={'create_dd_btn'}
                                                onClick={() => setCreateOpen(v => !v)}
                                                aria-label="프로젝트 생성">+</button>
                                        {createOpen && (
                                            <>
                                                <div className={'create_backdrop'} onClick={() => setCreateOpen(false)}/>
                                                <div className={'create_popup'} onClick={e => e.stopPropagation()}>
                                                    <p className={'create_label'}>새 프로젝트 생성</p>
                                                    <input type="text" value={createName} autoFocus
                                                           placeholder={'프로젝트명 입력'} disabled={createSaving}
                                                           onChange={e => setCreateName(e.target.value)}
                                                           onKeyDown={e => { if (e.key === 'Enter') void handleCreateProject(); }}/>
                                                    <div className={'create_btns'}>
                                                        <button type="button" className={'create_cancel'} disabled={createSaving}
                                                                onClick={() => { setCreateOpen(false); setCreateName(''); }}>취소</button>
                                                        <button type="button" className={'create_save'} disabled={createSaving}
                                                                onClick={handleCreateProject}>{createSaving ? '생성 중...' : '생성'}</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </th>
                                <th>바이어 리스트</th>
                                <th>활동일지수</th>
                                <th>프로젝트 개설일</th>
                            </tr>
                            </thead>
                            <tbody className="list_box">
                            <tr>
                                <td>
                                    <button type="button"
                                            className={`fav_star_btn${isFavorite ? ' on' : ''}`}
                                            onClick={toggleFavorite}
                                            disabled={favSaving || isEmpty}
                                            aria-label="즐겨찾기">
                                        {isFavorite ? '★' : '☆'}
                                    </button>
                                </td>
                                <td className={'project_name_cell'}>{isEmpty ? 'N/A' : (selectedProject.createUser.companyName || '-')}</td>
                                <td className={'project_name_cell'}>{ownerName}</td>
                                <td className={'project_name_cell'}>{isEmpty ? 'N/A' : (selectedProject.name || '-')}</td>
                                <td>{isEmpty ? 'N/A' : `${selectedProject.buyerCountPerStep.List ?? 0} / ${selectedProject.buyerCountPerStep.Lead ?? 0} / ${selectedProject.buyerCountPerStep.Target ?? 0} / ${selectedProject.buyerCountPerStep.Client ?? 0}`}</td>
                                <td>{isEmpty ? 'N/A' : selectedProject.totalSalesLogCount.toLocaleString()}</td>
                                <td>{isEmpty ? 'N/A' : selectedProject.createdAt.substring(0, 10).replaceAll("-", ".")}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 빠른이동 팝업 (목업 검색) */}
            {quickOpen && (
                <div className={'quick_move_popup_dim'} onClick={() => setQuickOpen(false)}>
                    <div className={'quick_move_popup'} onClick={e => e.stopPropagation()}>
                        <div className={'qm_head'}>
                            <h4>프로젝트 빠른이동</h4>
                            <button type="button" className={'qm_close'} onClick={() => setQuickOpen(false)}>×</button>
                        </div>
                        <div className={'qm_search_row'}>
                            <input type="text" className={'qm_search'} value={userKeyword} autoFocus
                                   placeholder={'사용자 검색 (기업명·이름·아이디)'}
                                   onChange={e => setUserKeyword(e.target.value)}/>
                            <input type="text" className={'qm_search'} value={projectKeyword}
                                   placeholder={'프로젝트명 검색'}
                                   onChange={e => setProjectKeyword(e.target.value)}/>
                        </div>
                        <div className={'qm_table_wrap'}>
                            <table className={'qm_table'}>
                                <colgroup>
                                    <col style={{width: '16%'}}/>
                                    <col style={{width: '26%'}}/>
                                    <col style={{width: '26%'}}/>
                                    <col style={{width: '18%'}}/>
                                    <col style={{width: '14%'}}/>
                                </colgroup>
                                <thead>
                                <tr>
                                    <th>기업명</th>
                                    <th>이름(이메일)</th>
                                    <th>프로젝트명</th>
                                    <th>바이어 리스트</th>
                                    <th>활동일지수</th>
                                </tr>
                                </thead>
                                <tbody>
                                {quickLoading ? (
                                    <tr>
                                        <td colSpan={5} className={'qm_empty'}>불러오는 중...</td>
                                    </tr>
                                ) : quickItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={'qm_empty'}>검색 결과가 없습니다.</td>
                                    </tr>
                                ) : quickItems.map(p => {
                                    const b = p.buyerCountPerStep || {};
                                    return (
                                        <tr key={`${p.userId}-${p.projectId}`} className={'qm_row'}
                                            onClick={() => {
                                                router.push(`/managed-users/${p.userId}/projects/${p.projectId}`);
                                                setQuickOpen(false);
                                            }}>
                                            <td>{p.companyName}</td>
                                            <td>{p.ownerName}({p.ownerLoginId})</td>
                                            <td>{p.projectName}</td>
                                            <td>{`${b.List ?? 0} / ${b.Lead ?? 0} / ${b.Target ?? 0} / ${b.Client ?? 0}`}</td>
                                            <td>{(p.salesLogCount ?? 0).toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
