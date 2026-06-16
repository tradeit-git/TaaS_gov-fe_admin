'use client'

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {useProjectTrackerStore} from "@/stores/projectTrackerStore";
import callApi from "@/utill/apiRequest";

// ── 목업 데이터 (API 연동 X, 임의값) ──
interface MockProject { id: number; label: string; }
interface QuickProject {
    id: number;
    companyName: string;
    name: string;
    email: string;
    projectName: string;
    buyerList: string;
    logCount: number;
}
const MOCK_QUICK_PROJECTS: QuickProject[] = [
    {id: 1, companyName: '두원', name: '김두원', email: 'duwon@example.com', projectName: '2026 호치민 / 프리미엄 소비재', buyerList: '35 / 10 / 6 / 0', logCount: 211},
    {id: 2, companyName: 'ABC무역', name: '이에이비', email: 'abc@example.com', projectName: '2026 방콕 / 식품 수출', buyerList: '12 / 4 / 2 / 1', logCount: 88},
    {id: 3, companyName: '한빛코퍼레이션', name: '박한빛', email: 'hanbit@example.com', projectName: '2026 자카르타 / 화장품', buyerList: '20 / 8 / 3 / 0', logCount: 140},
    {id: 4, companyName: '대성물산', name: '최대성', email: 'daesung@example.com', projectName: '2025 하노이 / 생활용품', buyerList: '5 / 1 / 0 / 0', logCount: 30},
    {id: 5, companyName: '글로벌상사', name: '정글로', email: 'global@example.com', projectName: '2026 마닐라 / 가전', buyerList: '8 / 3 / 1 / 0', logCount: 55},
];
const MOCK_FAVORITE_PROJECTS: MockProject[] = [
    {id: 2, label: 'ABC무역 - 2026 방콕 / 식품 수출'},
    {id: 3, label: '한빛코퍼레이션 - 2026 자카르타 / 화장품'},
];

export default function ProjectBox() {
    const router = useRouter();
    const {userId, projectId, selectedProject} = useProjectTrackerStore();

    const [quickOpen, setQuickOpen] = useState(false);
    const [projectKeyword, setProjectKeyword] = useState('');   // 프로젝트명 필터
    const [userKeyword, setUserKeyword] = useState('');         // 사용자 필터 (기업명·이름·아이디)
    const [isFavorite, setIsFavorite] = useState(false);   // 프로젝트 즐겨찾기 (실제 API)
    const [favSaving, setFavSaving] = useState(false);
    const [favOpen, setFavOpen] = useState(false);         // 즐겨찾기 헤더 ▼ 드롭다운 (즐겨찾기 프로젝트 이동)

    // selectedProject 로드 시 즐겨찾기 상태 동기화
    useEffect(() => {
        setIsFavorite(!!selectedProject.isBookmark);
    }, [selectedProject.isBookmark]);

    const goProject = (pid: number) => {
        router.push(`/managed-users/${userId}/projects/${pid}`);
    };

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

    const quickFiltered = useMemo(() => {
        const pk = projectKeyword.trim().toLowerCase();
        const uk = userKeyword.trim().toLowerCase();
        return MOCK_QUICK_PROJECTS.filter(p => {
            const matchProject = !pk || p.projectName.toLowerCase().includes(pk);
            const matchUser = !uk
                || p.companyName.toLowerCase().includes(uk)
                || p.name.toLowerCase().includes(uk)
                || p.email.toLowerCase().includes(uk);
            return matchProject && matchUser;
        });
    }, [projectKeyword, userKeyword]);

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
                                                <ul className={'fav_dd_list'}>
                                                    {MOCK_FAVORITE_PROJECTS.length === 0 ? (
                                                        <li className={'fav_dd_empty'}>즐겨찾기한 프로젝트가 없습니다.</li>
                                                    ) : MOCK_FAVORITE_PROJECTS.map(p => (
                                                        <li key={p.id} className={'fav_dd_item'}
                                                            onClick={() => { goProject(p.id); setFavOpen(false); }}>{p.label}</li>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </th>
                                <th>기업명</th>
                                <th>이름(이메일)</th>
                                <th>프로젝트명</th>
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
                                {quickFiltered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={'qm_empty'}>검색 결과가 없습니다.</td>
                                    </tr>
                                ) : quickFiltered.map(p => (
                                    <tr key={p.id} className={'qm_row'}
                                        onClick={() => { goProject(p.id); setQuickOpen(false); }}>
                                        <td>{p.companyName}</td>
                                        <td>{p.name}({p.email})</td>
                                        <td>{p.projectName}</td>
                                        <td>{p.buyerList}</td>
                                        <td>{p.logCount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
