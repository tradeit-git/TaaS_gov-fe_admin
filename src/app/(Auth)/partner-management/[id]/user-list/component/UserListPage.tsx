'use client';

import Link from "next/link";
import {useRouter} from "next/navigation";
import {formatDateDot} from "@/utill/format";
import MemberListV2 from "@/app/(Auth)/partner-management/[id]/user-list/component/MemberListV2";
import CompanyActivityList from "@/app/(Auth)/partner-management/[id]/user-list/component/CompanyActivityList";
import {
    buildUserListQuery,
    DEFAULT_TAB_SIZE,
    MembersResponse,
    PartnerInfo,
    TmMemberResponse,
    UserListFilters,
    UserListTab,
} from "@/app/(Auth)/partner-management/[id]/user-list/types";

interface Props {
    partnerId: string;
    partner: PartnerInfo | null;
    filters: UserListFilters;
    /** 현재 탭의 데이터만 서버에서 받는다. 나머지 한쪽은 null */
    members: MembersResponse | null;
    activity: TmMemberResponse | null;
    /** 상단 표기 (협회제휴관리 / PoC 관리) */
    title?: string;
    /** "목록으로" 가 돌아갈 목록 라우트 */
    basePath?: string;
}

export default function UserListPage({
                                         partnerId, partner, filters, members, activity,
                                         title = '협회제휴관리', basePath = '/partner-management',
                                     }: Props) {
    const router = useRouter();
    const pageUrl = `${basePath}/${partnerId}/user-list`;

    // 현재 필터 + 변경분으로 URL을 만들어 네비게이션 (router가 basePath/히스토리 정상 처리)
    const navigate = (next: Partial<UserListFilters>) => {
        const qs = buildUserListQuery({...filters, ...next});
        router.replace(qs ? `${pageUrl}?${qs}` : pageUrl);
    };

    // 탭 전환은 검색어·페이지까지 초기화한다. 탭마다 목록이 달라 이어받을 이유가 없다.
    // 돌아갈 목록 조건(from)만 유지한다.
    const goTab = (tab: UserListTab) => {
        if (tab === filters.tab) return;
        const qs = buildUserListQuery({
            ...filters, tab,
            q: '', page: 1, size: DEFAULT_TAB_SIZE,
            approval: '', sort: 'latest', grade: '', timing: '',
        });
        router.replace(qs ? `${pageUrl}?${qs}` : pageUrl);
    };

    // 진입 시점의 목록 검색조건으로 되돌아간다. 직접 URL 로 들어왔으면 조건 없는 목록.
    const listUrl = filters.from ? `${basePath}?${filters.from}` : basePath;

    return (
        <div className={'admin_page partner_page'}>
            <div className={'page_start_box'}>
                <h2>{title}</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={basePath}>{title}</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>가입명단</li>
                </ul>
            </div>

            {/* 제휴 정보 영역 — 목록으로 버튼을 같은 줄 우측에 둔다.
                제휴 조회에 실패해도 목록으로는 남아야 하므로 바 자체는 항상 렌더한다. */}
            <div className={'partner_info_bar'}>
                <div className={'info_row'}>
                    {partner && <>
                        <div className={'info_field'}>
                            <label>제휴명</label>
                            <span>{partner.partnerName}</span>
                        </div>
                        <div className={'info_field'}>
                            <label>회원가입도메인</label>
                            <span>www.tradeit.co.kr/partner/{partner.partnerKey}</span>
                            <a className={'btn_site_link'}
                               href={`https://www.tradeit.co.kr/partner/${partner.partnerKey}`}
                               target="_blank" rel="noopener noreferrer">
                                사이트 바로가기 ↗
                            </a>
                        </div>
                        <div className={'info_field'}>
                            <label>보너스 크레딧</label>
                            <span>{partner.creditAmount} %</span>
                        </div>
                        <div className={'info_field'}>
                            <label>가입혜택기간</label>
                            <span>{formatDateDot(partner.startDate)}</span>
                            <span className={'date_tilde'}>-</span>
                            <span>{formatDateDot(partner.endDate)}</span>
                        </div>
                    </>}
                    <Link href={listUrl} className={'list_button info_row_list_button'}>목록으로</Link>
                </div>
            </div>

            {/* 콘텐츠 카드 (CRM 제휴 성과 대시보드와 동일 구성) */}
            <div className={'v2_card'}>
                {/* 탭 */}
                <div className={'v2_tab_bar'}>
                    <button
                        type="button"
                        className={`v2_tab ${filters.tab === 'members' ? 'on' : ''}`}
                        onClick={() => goTab('members')}
                    >
                        가입명단관리
                    </button>
                    <button
                        type="button"
                        className={`v2_tab ${filters.tab === 'activity' ? 'on' : ''}`}
                        onClick={() => goTab('activity')}
                    >
                        기업별 활동현황
                    </button>
                </div>

                {/* 탭 콘텐츠 — 제휴 정보 로드 후에만 렌더 */}
                <div className={`v2_tab_content ${filters.tab !== 'members' ? 'v2_tab_content_round_left' : ''}`}>
                    {partner && filters.tab === 'members' && members && <MemberListV2
                        partnerId={partnerId}
                        basePath={basePath}
                        data={members}
                        filters={filters}
                        navigate={navigate}
                    />}
                    {partner && filters.tab === 'activity' && activity && <CompanyActivityList
                        partnerId={partnerId}
                        basePath={basePath}
                        data={activity}
                        filters={filters}
                        navigate={navigate}
                    />}
                </div>
            </div>
        </div>
    );
}
