'use client'

import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import callApi from "@/utill/apiRequest";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import RoundAccordion from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/RoundAccordion";
import TimelineList from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/TimelineList";
import ActivityFormPopup from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/ActivityFormPopup";
import RoundFormPopup from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/RoundFormPopup";
import LinkAccountPopup from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/LinkAccountPopup";
import {TimelineFilter} from "@/app/(Auth)/domestic-sales/companies/[targetId]/component/companyDetail";
import TagEditPopup from "@/app/(Auth)/domestic-sales/component/TagEditPopup";
import TmInputDrawer from "@/app/(Auth)/partner-management/[id]/user-list/component/TmInputDrawer";
import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";
import {
    ACCOUNT_STATUS_LABELS,
    ACCOUNT_TYPE_LABELS,
    accountStatusClass,
    ActivityRow,
    API_BASE,
    CompanyDetail,
    EMPTY,
    LinkedAccountRow,
    formatDateShort,
    memberDetailPath,
    regionText,
    RoundRow,
    shortDate,
    TimelineItem,
} from "@/app/(Auth)/domestic-sales/companies/types";

interface Props {
    targetId: number;
    detail: CompanyDetail | null;
    timeline: TimelineItem[];
    timelineFilter: TimelineFilter;
    /** 이미 쓰이고 있는 태그. 편집 팝업에서 새로 만들기 전에 먼저 보여준다 */
    allTags: TagRow[];
}

export default function CompanyDetailPage({targetId, detail, timeline, timelineFilter, allTags}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();

    /**
     * 데이터는 서버에서 온다. 저장 후에는 서버 컴포넌트를 다시 그리게 한다.
     * 활동을 고치면 회차 · 타임라인이 같이 흔들리므로 부분 갱신을 만들지 않는다.
     */
    const reload = () => router.refresh();

    /**
     * 목록으로. Link 가 아니라 뒤로가기인 이유는 목록의 검색·필터·페이지가 URL 에 들어있어서다 —
     * 주소를 새로 밀면 필터 여섯 개를 다시 잡아야 한다.
     * 다만 주소를 직접 열었거나 새 탭이면 되돌아갈 데가 없어 아무 일도 안 일어나므로 그때는 목록으로 민다.
     */
    const goList = () => {
        if (window.history.length > 1) router.back();
        else router.push('/domestic-sales/companies');
    };

    const basePath = `/domestic-sales/companies/${targetId}`;
    const changeTimeline = (filter: TimelineFilter) =>
        router.replace(filter ? `${basePath}?timeline=${filter}` : basePath, {scroll: false});

    const openActivityForm = (round: RoundRow) =>
        addPopup(<ActivityFormPopup round={round} onSuccess={reload}/>);

    const openActivityEdit = (activity: ActivityRow) =>
        addPopup(<ActivityFormPopup initialData={activity} onSuccess={reload}/>);

    const openRoundForm = (round?: RoundRow) =>
        addPopup(<RoundFormPopup targetId={targetId} initialData={round} onSuccess={reload}/>);

    const deleteActivity = (activity: ActivityRow) =>
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 영업활동을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`${API_BASE}/activities/${activity.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) reload();
            else addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
        }}/>);

    /**
     * 숨김 ↔ 관리중. 「지금은 아니지만 나중에」 를 목록 밖으로 치우는 장치라
     * 회차도 활동도 그대로 두고 상태만 바꾼다. 목록 기본 조회에서만 빠진다.
     * <p>
     * 영업을 끝냈다는 뜻의 종료(CLOSED)와는 다른 축이다. 종료된 기업도 목록에는 나온다.
     */
    const toggleDormant = () => {
        const toDormant = detail?.status !== 'DORMANT';
        addPopup(<AlertComponent
            alertType={'confirm'}
            infoContent={toDormant
                ? `이 기업을 숨기시겠습니까?
목록 기본 조회에서 빠집니다. 회차와 활동 이력은 그대로 남습니다.`
                : '다시 보이게 하시겠습니까?'}
            callback={async () => {
                const next = toDormant ? 'DORMANT' : 'ACTIVE';
                const res = await callApi(`${API_BASE}/companies/${targetId}/status?status=${next}`, {
                    method: 'PUT',
                    credentials: 'include',
                });
                if (res.result) reload();
                else addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '상태 변경에 실패했습니다.'}/>);
            }}/>);
    };

    /**
     * 태그 편집. 태그는 관리 대상이 아니라 기준 DB 기업에 붙으므로 customerId 로 저장한다 —
     * 관리기업에서 뺐다 다시 담아도 태그는 그대로 남는다.
     */
    const editTags = () => {
        if (!detail) return;
        addPopup(<TagEditPopup customerId={detail.customerId} companyName={detail.name}
                               current={detail.tags} allTags={allTags} onSaved={reload}/>);
    };

    /**
     * TM 입력 드로어. 제휴 회원 목록에서 쓰던 것을 그대로 띄운다 —
     * TM 은 제휴 키 단위 기능이라 partnerId 가 없는 계정(일반 · 체험 가입)은 열 수 없다.
     * <p>
     * 사용량 집계는 안 넘긴다. 이 화면은 그 값을 안 들고 있고,
     * 그것 때문에 목록 API 를 한 번 더 부르는 건 이 버튼이 감당할 무게가 아니다.
     */
    const [tmTarget, setTmTarget] = useState<LinkedAccountRow | null>(null);

    const unlinkAccount = (account: LinkedAccountRow) =>
        addPopup(<AlertComponent alertType={'confirm'}
                                 infoContent={`「${account.name}」 님의 연결을 해제하시겠습니까?\n이 계정의 TM 접촉이력도 이 화면에서 사라집니다.`}
                                 callback={async () => {
                                     const res = await callApi(`${API_BASE}/companies/${targetId}/accounts/${account.userId}`, {
                                         method: 'DELETE',
                                         credentials: 'include',
                                     });
                                     if (res.result) reload();
                                     else addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '해제에 실패했습니다.'}/>);
                                 }}/>);

    if (!detail) {
        return (
            <div className={'admin_page'}>
                <p style={{padding: '60px 0', textAlign: 'center', color: '#999'}}>관리 기업을 찾을 수 없습니다.</p>
            </div>
        );
    }

    const isDormant = detail.status === 'DORMANT';
    const openRound = detail.rounds.find(r => r.open);
    const latestRound = detail.rounds[detail.rounds.length - 1];

    return (
        <>
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>관리기업 상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>국내고객사영업</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/domestic-sales/companies'}>관리기업</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>{detail.name}</li>
                </ul>
            </div>

            {/* 헤더 */}
            <div className={'ds_detail_head'}>
                <div className={'ds_title_row'}>
                    <button type="button" className={'ds_back_btn'} onClick={goList}>
                        <span className={'ds_back_arrow'}/>목록으로
                    </button>
                    <h3>{detail.name}</h3>
                    <span className={'ds_meta ds_num'}>{detail.bizNo ?? '사업자번호 미확인'}</span>
                    <span className={'ds_meta'}>{regionText(detail.sidoName, detail.sigunguName)}</span>
                    {detail.ceoName && <span className={'ds_meta'}>대표 {detail.ceoName}</span>}

                    {/* 상태 변경은 액션이다. 칩 줄에 두면 태그로 읽힌다 */}
                    <button type="button"
                            className={`ds_status_btn${isDormant ? ' restore' : ''}`}
                            onClick={toggleDormant}>
                        {isDormant ? '다시 보이기' : '숨기기'}
                    </button>
                </div>

                <div className={'ds_chip_row'}>
                    {/* 관리중은 안 찍는다 — 전부 관리중이라 아무 정보가 없다. 숨김·종료일 때만 알린다 */}
                    {isDormant && <span className={'ds_chip ds_chip_dormant'}>숨김</span>}
                    {detail.status === 'CLOSED' && <span className={'ds_chip ds_chip_closed'}>종료</span>}
                    {latestRound && <span className={'ds_chip'}>{latestRound.roundNo}차</span>}
                    <span className={'ds_chip'}>가입계정 {detail.accountTotal}</span>
                    <span className={'ds_chip'}>최근 영업활동 {shortDate(detail.lastActivityDate)}</span>
                    <span className={'ds_chip'}>최근 TM {shortDate(detail.lastContactedOn)}</span>
                    {detail.bizField && <span className={'ds_chip'}>{detail.bizField}</span>}
                </div>

                {/* 태그는 칩 줄과 섞지 않는다 — 칩은 이 기업의 현황이고 태그는 담당자가 붙인 분류다 */}
                <div className={'ds_tag_row'}>
                    <span className={'ds_tag_row_label'}>태그</span>
                    {detail.tags.length === 0
                        ? <span className={'ds_empty'}>없음</span>
                        : detail.tags.map(t => <span key={t.tagId} className={'ds_tag'}>{t.name}</span>)}
                    <button type="button" className={'ds_tag_edit_btn'} onClick={editTags}>편집</button>
                </div>
            </div>

            {/* 영업 회차 */}
            <div className={'ds_section'}>
                <div className={'ds_section_head'}>
                    <h4>영업 회차</h4>
                    <div className={'ds_section_actions'}>
                        {/* 열린 회차가 있으면 서버가 새 회차를 막는다. 눌러보고 알게 하지 않는다 */}
                        <button type="button" className={'ds_ghost_btn'} disabled={!!openRound}
                                title={openRound ? `${openRound.roundNo}차가 진행중입니다. 결과를 먼저 입력해주세요.` : undefined}
                                onClick={() => openRoundForm()}>
                            새 회차 시작
                        </button>
                    </div>
                </div>
                <div className={'ds_section_body'}>
                    <RoundAccordion rounds={detail.rounds}
                                    onAddActivity={openActivityForm}
                                    onEditRound={openRoundForm}
                                    onEditActivity={openActivityEdit}
                                    onDeleteActivity={deleteActivity}/>
                </div>
            </div>

            {/* 가입 계정 */}
            <div className={'ds_section'}>
                <div className={'ds_section_head'}>
                    <h4>
                        가입 계정 ({detail.accountTotal})
                        {detail.accountTotal > 0 && (
                            <span className={'ds_sub'}>
                                {' '}POC {detail.accountPoc} · 제휴 {detail.accountPartner} · 일반 {detail.accountEtc}
                            </span>
                        )}
                    </h4>
                    <div className={'ds_section_actions'}>
                        <button type="button" className={'ds_ghost_btn'}
                                onClick={() => addPopup(<LinkAccountPopup targetId={targetId}
                                                                          companyName={detail.name}
                                                                          hasBizNo={!!detail.bizNo}
                                                                          onSuccess={reload}/>)}>
                            계정 연결
                        </button>
                    </div>
                </div>
                <div className={'ds_section_body'}>
                    <div className={'table_wrap'}>
                        <table className={'contact_table ds_account_table'}>
                            <colgroup>
                                <col style={{width: 66}}/>
                                <col style={{width: 150}}/>
                                <col style={{width: 100}}/>
                                <col style={{width: 130}}/>
                                <col/>
                                <col style={{width: 115}}/>
                                <col style={{width: 74}}/>
                                <col style={{width: 88}}/>
                                <col style={{width: 88}}/>
                                <col style={{width: 74}}/>
                                <col style={{width: 152}}/>
                            </colgroup>
                            <thead>
                            <tr>
                                <th>유형</th>
                                <th>회사명</th>
                                <th>이름</th>
                                <th>부서 · 직함</th>
                                <th>이메일</th>
                                <th>연락처</th>
                                <th>상태</th>
                                <th>가입일</th>
                                <th>최근 접속</th>
                                <th>최근 TM</th>
                                <th>관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {detail.accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className={'ds_table_empty'}>연결된 가입 계정이 없습니다.</td>
                                </tr>
                            ) : detail.accounts.map(account => (
                                <tr key={account.userId}>
                                    <td>
                                        <span className={`ds_type_badge type_${account.accountType.toLowerCase()}`}>
                                            {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType}
                                        </span>
                                    </td>
                                    {/* 회사명이 이름보다 앞이다 — 잘못 붙은 계정을 걸러내는 게 이 표의 첫 일이라
                                        기업명과 맞춰볼 값이 먼저 와야 한다 */}
                                    <td>{account.companyName || <span className={'ds_empty'}>{EMPTY}</span>}</td>
                                    <td>{account.name}</td>
                                    <td>
                                        {[account.department, account.position].filter(Boolean).join(' · ')
                                            || <span className={'ds_empty'}>{EMPTY}</span>}
                                    </td>
                                    {/* 잘못 붙은 것을 알아채는 근거가 사실상 이메일 도메인뿐이다 */}
                                    <td className={'ds_cell_email'} title={account.email}>{account.email}</td>
                                    <td>{account.contact || <span className={'ds_empty'}>{EMPTY}</span>}</td>
                                    <td>
                                        <span className={`ds_status_badge ${accountStatusClass(account.status)}`}>
                                            {ACCOUNT_STATUS_LABELS[account.status ?? ''] ?? account.status ?? EMPTY}
                                        </span>
                                    </td>
                                    <td><span className={'ds_num'}>{formatDateShort(account.createdAt)}</span></td>
                                    <td>
                                        {account.lastLoginAt
                                            ? <span className={'ds_num'}>{formatDateShort(account.lastLoginAt)}</span>
                                            : <span className={'ds_empty'}>없음</span>}
                                    </td>
                                    <td>
                                        {account.lastContactedOn
                                            ? <span className={'ds_num'}>{shortDate(account.lastContactedOn)}</span>
                                            : <span className={'ds_empty'}>{EMPTY}</span>}
                                    </td>
                                    <td>
                                        <div className={'ds_cell_actions'}>
                                            {/* TM 은 제휴 키 단위 기능이라 제휴 가입자만 열 수 있다 */}
                                            {account.partnerId && (
                                                <button type="button" className={'ds_ghost_btn'}
                                                        onClick={() => setTmTarget(account)}>TM 입력</button>
                                            )}
                                            {memberDetailPath(account.userType, account.userId) && (
                                                <Link href={memberDetailPath(account.userType, account.userId)!}
                                                      className={'ds_ghost_btn'}>회원 상세</Link>
                                            )}
                                            <button type="button" className={'ds_ghost_btn'}
                                                    onClick={() => unlinkAccount(account)}>연결 해제</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 통합 타임라인 */}
            <div className={'ds_section'}>
                <div className={'ds_section_head'}>
                    <h4>통합 타임라인</h4>
                    <div className={'ds_timeline_tabs'}>
                        {([['', '전체'], ['SALES', '영업'], ['TM', 'TM 접촉']] as const).map(([value, label]) => (
                            <button key={value} type="button"
                                    className={timelineFilter === value ? 'on' : ''}
                                    onClick={() => changeTimeline(value as TimelineFilter)}>{label}</button>
                        ))}
                    </div>
                </div>
                <div className={'ds_section_body'}>
                    <TimelineList items={timeline}/>
                </div>
            </div>
        </div>

        {tmTarget?.partnerId && (
            <TmInputDrawer
                partnerId={String(tmTarget.partnerId)}
                row={{
                    id: tmTarget.userId,
                    companyName: tmTarget.companyName,
                    name: tmTarget.name,
                    contact: tmTarget.contact,
                }}
                onClose={() => setTmTarget(null)}
                onSaved={reload}
            />
        )}
        </>
    );
}