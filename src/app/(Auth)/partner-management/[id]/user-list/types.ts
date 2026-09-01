// 어드민 제휴 관리 API(/api/admin/partner-keys/**) 응답 타입.
// 원래 CRM 공용 API 응답을 그대로 받아 썼고 응답 형태는 같지만, 경로는 어드민 전용으로 분리했다.

export interface MemberRow {
    id: number;
    companyName: string;
    loginId: string;
    name: string;
    department: string;
    position: string;
    contact: string;
    createdAt: string;
    isPartnerMember: boolean; // 제휴회원사 여부 (체크박스로 가입한 실제 제휴사)
    businessNumber: string; // 사업자번호
    ceoName: string; // 대표자명
    approvalStatus: 'REQUESTED' | 'APPROVED' | 'PENDING'; // 승인상태: 신청/승인/미승인
}

export interface MembersResponse {
    content: MemberRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    requestedCount: number; // 신청 수 (PENDING_APPROVAL)
    approvedCount: number; // 승인 수 (ACTIVE)
    rejectedCount: number; // 미승인 수 (REJECTED)
    pendingCount: number; // (하위호환) 승인 안 된 전체 = 신청 + 미승인
    systemAccessDate: string; // 시스템 접속가능일
}

// 기업별 활동현황 - 회원(기업)별 기능 이용 통계 (PartnerMemberStatsDTO)
export interface MemberStatsRow {
    id: number;
    companyName: string;
    businessNumber: string;
    loginId: string;
    name: string;
    department: string;
    position: string;
    contact: string;
    featuredType: 'SUPERIOR' | 'SUBORDINATE' | null; // 우수기업 등급 (미지정 null)
    featuredPosition: number | null; // 1~5
    visitDays: number; // 총 접속일 수 (크레딧 스케줄 기간 제한)
    weeklyVisitDays: number; // 선택된 주의 접속일 수 (미선택 시 0)
    lastLoginAt: string | null; // 최근 접속일 (users.last_login_at)
    aiCore: number;
    blSearch: number;
    supplyChain: number;
    buyerEnrich: number;
    buyerFit: number;
    salesLog: number; // 영업활동일지
    list: number;
    lead: number;
    target: number;
    client: number;
    buyerTotal: number; // list+lead+target+client
}

export interface MemberStatsResponse {
    content: MemberStatsRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    statsStartDate: string | null; // 총 접속 수 집계 기준 시작일 (크레딧 스케줄 min start_date)
    statsEndDate: string | null; // 총 접속 수 집계 기준 종료일 (크레딧 스케줄 max expiration_date)
}

// TM 영업관리 — 어드민 전용 API(/api/admin/partner-keys/{id}/tm-members) 전용.
// 등급/도입의향 같은 내부 영업 데이터라 CRM 공용 경로로는 절대 내보내지 않는다.
export type CustomerGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type AdoptionTiming = 'IMMEDIATE' | 'M1' | 'M3' | 'M6' | 'HOLD';

export const ADOPTION_TIMING_LABEL: Record<AdoptionTiming, string> = {
    IMMEDIATE: '즉시',
    M1: '1개월',
    M3: '3개월',
    M6: '6개월',
    HOLD: '보류',
};

export interface TmMemberRow extends MemberStatsRow {
    customerGrade: CustomerGrade | null;
    adoptionTiming: AdoptionTiming | null;
    lastContactedOn: string | null; // "YYYY-MM-DD"
    noContactDays: number | null; // 접촉 이력이 없으면 null
    tmEntered: boolean; // TM 프로필이 한 번이라도 저장됐는지
}

export interface TmMemberResponse extends Omit<MemberStatsResponse, 'content'> {
    content: TmMemberRow[];
}

// ── 화면 상태 (URL = 단일 진실) ──
// 두 탭이 같은 페이지를 쓰므로 쿼리도 한 벌만 둔다. 탭을 바꾸면 다른 탭의 필터는 버린다.

export interface PartnerInfo {
    partnerName: string;
    partnerKey: string;
    creditAmount: number;
    startDate: string;
    endDate: string;
    requiresApproval: boolean;
}

export type UserListTab = 'members' | 'activity';

export type SortKey =
    | 'latest'
    | 'noContact'
    | 'aiCore'
    | 'blSearch'
    | 'supplyChain'
    | 'buyerEnrich'
    | 'buyerFit'
    | 'salesActivity'
    | 'buyerTotal'
    | 'totalAccess';

/** 프론트 정렬키 → 백엔드 sort 파라미터 (latest 는 sort 미전송 = 최신 승인순 기본) */
export const SORT_PARAM: Record<SortKey, string | null> = {
    latest: null,
    noContact: 'noContact',
    aiCore: 'aiCore',
    blSearch: 'blSearch',
    supplyChain: 'supplyChain',
    buyerEnrich: 'buyerEnrich',
    buyerFit: 'buyerFit',
    salesActivity: 'salesLog',
    buyerTotal: 'buyerTotal',
    totalAccess: 'visitDays',
};

export const SIZE_OPTIONS = [10, 50, 100];
export const DEFAULT_TAB_SIZE = SIZE_OPTIONS[0];

export interface UserListFilters {
    tab: UserListTab;
    q: string;      // 회사명 검색 (두 탭 공용)
    page: number;   // 1-based
    size: number;
    approval: string;   // 가입명단 탭
    sort: SortKey;      // 활동현황 탭
    grade: string;      // 활동현황 탭 (A~E, 또는 미설정 NONE)
    timing: string;     // 활동현황 탭
    /** 들어올 때의 목록 검색조건(쿼리스트링). "목록으로" 가 이 상태로 돌아간다. */
    from: string;
}

/** 기본값은 URL 에 싣지 않는다. 현재 탭과 무관한 필터도 빠지므로 탭 전환 시 자동으로 정리된다. */
export function buildUserListQuery(f: UserListFilters): string {
    const p = new URLSearchParams();
    if (f.tab !== 'members') p.set('tab', f.tab);
    if (f.q.trim()) p.set('q', f.q.trim());
    if (f.page > 1) p.set('page', String(f.page));
    if (f.size !== DEFAULT_TAB_SIZE) p.set('size', String(f.size));
    if (f.tab === 'members' && f.approval) p.set('approval', f.approval);
    if (f.tab === 'activity') {
        if (f.sort !== 'latest') p.set('sort', f.sort);
        if (f.grade) p.set('grade', f.grade);
        if (f.timing) p.set('timing', f.timing);
    }
    // 탭을 옮기거나 필터를 바꿔도 돌아갈 목록 조건은 잃지 않아야 한다.
    if (f.from) p.set('from', f.from);
    return p.toString();
}

// ── TM 입력 드로어 ──
export type TmLevel = 'HIGH' | 'MID' | 'LOW';

export const TM_LEVEL_LABEL: Record<TmLevel, string> = {HIGH: '상', MID: '중', LOW: '하'};

/** TM 필수 입력 7항목의 현재값. 변경 이력은 남기지 않는다. */
export interface TmProfile {
    exportNeeds: string | null;
    buyerFit: TmLevel | null;
    buyerFitComment: string | null;
    serviceValue: TmLevel | null;
    serviceValueComment: string | null;
    adoptionIntent: TmLevel | null;
    adoptionIntentComment: string | null;
    blocker: string | null;
    adoptionTiming: AdoptionTiming | null;
    adoptionTimingComment: string | null;
    customerGrade: CustomerGrade | null;
    customerGradeComment: string | null;
    lastContactedOn: string | null; // 접촉이력에서 파생 (읽기 전용)
    /** 저장 충돌 감지용. 불러온 값을 그대로 돌려보낸다. 미저장이면 null */
    version: number | null;
}

export interface TmContact {
    id: number;
    contactedOn: string; // "YYYY-MM-DD"
    comment: string;
    adminId: number;
    adminName: string;
    mine: boolean; // 본인 작성분만 수정/삭제 가능
    createdAt: string;
}

/** 조회·저장·접촉이력 변경 모두 같은 형태로 응답한다 (version 이 항상 최신으로 갱신됨) */
export interface TmDetailResponse {
    profile: TmProfile;
    contacts: TmContact[];
}
