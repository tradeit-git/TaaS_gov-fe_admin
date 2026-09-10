import {TagRow} from "@/app/(Auth)/domestic-sales/component/tags";

// 국내 영업 관리 API 타입 — /api/admin/domestic-sales/**
// 백엔드 DTO 와 1:1 로 맞춘다. 기획서 6장 참조.

export const API_BASE = '/api/admin/domestic-sales';

// ---- 코드값 라벨 ----

export const GRADE_LABELS: Record<string, string> = {
    POTENTIAL: '잠재',
    LEAD: '리드',
    TARGET: '타겟',
    CLIENT: '클라이언트',
};

/** 회차 결과. null 은 진행중이므로 여기 없다 */
export const RESULT_LABELS: Record<string, string> = {
    WON: '성공',
    LOST: '실패',
    HOLD: '보류',
};

export const TARGET_STATUS_LABELS: Record<string, string> = {
    ACTIVE: '관리중',
    DORMANT: '숨김',
    CLOSED: '종료',
};

/**
 * 계정 상태. utill/format 의 STATUS_LABELS 를 안 쓰는 이유는 거기에 4개만 있어서다 —
 * 여기 붙는 계정에는 제휴 승인대기 · 반려 · 체험만료가 그대로 섞여 들어온다.
 * 없는 값이면 코드가 화면에 그대로 찍혀서 담당자가 뭘 봐야 할지 알 수 없다.
 */
export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: '활성',
    INACTIVE: '비활성',
    SUSPENDED: '정지',
    WITHDRAWN: '탈퇴',
    TRIAL_EXPIRED: '체험만료',
    PENDING_APPROVAL: '승인대기',
    REJECTED: '반려',
};

/** 상태 배지 색. 활성만 정상이고 나머지는 「지금 쓸 수 없는 계정」 이라는 표시다 */
export const accountStatusClass = (status: string | null) => {
    if (status === 'ACTIVE') return 'status_on';
    if (status === 'PENDING_APPROVAL') return 'status_wait';
    return 'status_off';
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    POC: 'POC',
    PARTNER: '제휴',
    ETC: '일반',
};

/**
 * 영업등급 다중 선택지.
 *
 * NONE(등급없음)이 따로 있어야 한다. 관리 대상을 담으면 1차 회차가 등급 없이 열리므로
 * 갓 담은 기업은 전부 등급이 비어 있다. 이걸 못 고르면 등급 하나만 빼도 같이 사라진다.
 */
export const GRADE_FILTER_OPTIONS = [
    ...Object.entries(GRADE_LABELS).map(([value, label]) => ({value, label})),
    {value: 'NONE', label: '등급없음'},
];

/** 진행상태 다중 선택지. OPEN 이 result IS NULL 을 덮어서 이 넷이 전부다 */
export const RESULT_FILTER_OPTIONS = [
    {value: 'OPEN', label: '진행중'},
    ...Object.entries(RESULT_LABELS).map(([value, label]) => ({value, label})),
];

export const SORT_OPTIONS = [
    {value: '', label: '최근접촉순'},
    {value: 'ACTIVITY', label: '영업활동순'},
    {value: 'TM', label: 'TM접촉순'},
] as const;

export const DEFAULT_PAGE_SIZE = 20;

/** 한 화면에 몇 건. 목록을 훑어보는 화면이라 100 까지 연다 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ---- 목록 ----

/** URL 쿼리에서 읽어낸 목록 필터. URL 이 단일 진실이고 화면 상태는 여기서 파생된다 */
export interface CompanyFilters {
    keyword: string;
    /** 다중 선택. null = 전체(필터 없음), [] = 하나도 안 고름(0건) */
    salesGrade: string[] | null;
    roundResult: string[] | null;
    /** 기본(false)은 숨김 제외, true 면 숨긴 것만. 전체를 보는 값은 없다 — 둘을 합치면 전체다 */
    dormantOnly: boolean;
    /** 'true' | 'false' | '' — 가입계정 유무. 3상태라 boolean 이 아니다 */
    linked: string;
    mineOnly: boolean;
    sort: string;
    /** 고른 태그 pk. AND 다 — 전부 가진 기업만 나온다. 빈 배열이면 태그 조건 없음 */
    tagIds: number[];
    /** 0-based. URL 은 1-based 로 쓴다 */
    page: number;
    size: number;
}

export interface CompanyListData {
    rows: CompanyRow[];
    totalElements: number;
    totalPages: number;
}

/**
 * 하나도 안 고른 상태를 URL 에 남기는 값.
 * 파라미터를 빼면 「전체」가 되어버려서 구분이 안 된다.
 * 실제 코드값이 아니므로 FIND_IN_SET 이 한 건도 못 찾아 결과가 0건이 된다 — 의도한 대로다.
 */
export const NOTHING_SELECTED = '-';

/** null(전체) → 파라미터 없음, [](없음) → '-', 그 외 → 쉼표 목록 */
export const encodeMulti = (value: string[] | null) =>
    value === null ? '' : value.length === 0 ? NOTHING_SELECTED : value.join(',');

/** encodeMulti 의 역. 없는 파라미터는 전체로 읽는다 */
export const decodeMulti = (raw: string | undefined): string[] | null => {
    if (!raw) return null;
    if (raw === NOTHING_SELECTED) return [];
    return raw.split(',').map(v => v.trim()).filter(Boolean);
};

/** 필터 → URL 쿼리. 기본값은 빼서 주소를 짧게 유지한다 */
export function buildCompanyQuery(f: CompanyFilters): string {
    const params = new URLSearchParams();
    if (f.keyword.trim()) params.set('keyword', f.keyword.trim());
    const grade = encodeMulti(f.salesGrade);
    if (grade) params.set('salesGrade', grade);
    const result = encodeMulti(f.roundResult);
    if (result) params.set('roundResult', result);
    if (f.dormantOnly) params.set('dormantOnly', 'true');
    if (f.linked) params.set('linked', f.linked);
    if (f.mineOnly) params.set('mineOnly', 'true');
    if (f.sort) params.set('sort', f.sort);
    if (f.tagIds.length) params.set('tagIds', f.tagIds.join(','));
    if (f.page > 0) params.set('page', String(f.page + 1));
    if (f.size !== DEFAULT_PAGE_SIZE) params.set('size', String(f.size));
    return params.toString();
}


export interface CompanyRow {
    targetId: number;
    customerId: number;
    name: string;
    bizNo: string | null;
    sidoName: string | null;
    sigunguName: string | null;
    bizField: string | null;
    status: string;

    roundNo: number | null;
    salesGrade: string | null;
    salesType: string | null;
    roundResult: string | null;

    lastActivityDate: string | null;
    lastActivityAdminName: string | null;
    activityAdminCount: number | null;

    lastContactedOn: string | null;
    lastContactedAdminName: string | null;
    lastTouchedOn: string | null;

    accountTotal: number;
    accountPoc: number;
    accountPartner: number;
    accountEtc: number;

    /** 기준 DB 기업에 붙은 태그. 관리 대상이 아니라 기업 자체의 것이다 */
    tags: TagRow[];
}

export interface CompanyListResponse {
    content: CompanyRow[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

// ---- 상세 ----

export interface ActivityRow {
    id: number;
    roundId: number;
    roundNo: number | null;
    activityDate: string;
    /** 줄바꿈이 그대로 들어있다. 화면에서 접는다 */
    content: string;
    bookMark: boolean;
    adminId: number;
    adminName: string | null;
    /** 본인 작성분만 수정·삭제 */
    editable: boolean;
    createdAt: string;
}

export interface RoundRow {
    id: number;
    roundNo: number;
    salesGrade: string | null;
    salesType: string | null;
    startedOn: string;
    endedOn: string | null;
    result: string | null;
    open: boolean;
    activityCount: number;
    activities: ActivityRow[];
}

export interface LinkedAccountRow {
    userId: number;
    name: string;
    loginId: string;
    email: string;
    companyName: string;
    department: string | null;
    position: string | null;
    contact: string | null;
    accountType: string;
    /** 회원 종류 1·2=일반 가입 / 0=체험 / 100=트라이얼 */
    userType: number | null;
    partnerId: number | null;
    partnerName: string | null;
    linkType: string | null;
    linkedAt: string | null;
    lastContactedOn: string | null;
    /** ACTIVE / INACTIVE / SUSPENDED / WITHDRAWN / TRIAL_EXPIRED / PENDING_APPROVAL / REJECTED */
    status: string | null;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface CompanyDetail {
    targetId: number;
    customerId: number;
    name: string;
    bizNo: string | null;
    sidoName: string | null;
    sigunguName: string | null;
    bizField: string | null;
    ceoName: string | null;
    status: string;
    lastActivityDate: string | null;
    lastContactedOn: string | null;
    rounds: RoundRow[];
    accounts: LinkedAccountRow[];
    accountTotal: number;
    accountPoc: number;
    accountPartner: number;
    accountEtc: number;

    /** 기준 DB 기업에 붙은 태그. 관리 대상이 아니라 기업 자체의 것이다 */
    tags: TagRow[];
}

export interface TimelineItem {
    type: 'SALES' | 'TM';
    id: number;
    date: string;
    content: string;
    adminId: number | null;
    adminName: string | null;
    roundNo: number | null;
    userId: number | null;
    userName: string | null;
    partnerId: number | null;
}

export interface CandidateRow {
    userId: number;
    name: string;
    loginId: string;
    email: string;
    companyName: string;
    businessNumber: string | null;
    department: string | null;
    position: string | null;
    contact: string | null;
    accountType: string;
    partnerName: string | null;
    createdAt: string;
}

// ---- 표시 헬퍼 ----

/** 값 없음은 전부 이 문자로 통일한다. 백엔드가 null 을 많이 내려준다 */
export const EMPTY = '—';

/** 2026-08-30 → 08-30. 목록은 연도를 빼야 한 줄에 들어간다 */
export const shortDate = (date: string | null | undefined) => {
    if (!date) return EMPTY;
    const parts = date.split('-');
    return parts.length === 3 ? `${parts[1]}-${parts[2]}` : date;
};

/** 2026-08-30T10:22:11 → 2026.08.30 */
export const formatDateShort = (value: string | null | undefined) => {
    if (!value) return EMPTY;
    const parts = value.slice(0, 10).split('-');
    return parts.length === 3 ? parts.join('.') : value;
};

export const regionText = (sido: string | null, sigungu: string | null) =>
    [sido, sigungu].filter(Boolean).join(' ') || EMPTY;

export const gradeClass = (grade: string | null) =>
    grade ? `grade_${grade.toLowerCase()}` : '';

/** 진행중(result=null)과 결과값을 한 자리에서 처리한다 */
export const resultLabel = (result: string | null) => result ? RESULT_LABELS[result] ?? result : '진행중';

export const resultClass = (result: string | null) => {
    switch (result) {
        case 'WON': return 'result_won';
        case 'LOST': return 'result_lost';
        case 'HOLD': return 'result_hold';
        default: return 'result_open';
    }
};

/**
 * 회원 상세 경로. 회원 종류마다 상세 화면이 다르다 (백엔드 MemberController 의 TYPE_MAP).
 * <p>
 * 트라이얼(100)은 개인 상세 화면 자체가 없다 — 트라이얼 키 상세의 회원 목록 안에서만 본다.
 * 그래서 null 을 주고 화면은 버튼을 감춘다. 아무 데나 보내면 목록으로 튕겨서
 * 「눌렀는데 엉뚱한 데로 갔다」 가 된다.
 */
export function memberDetailPath(userType: number | null, userId: number): string | null {
    if (userType === 1 || userType === 2) return `/users/${userId}`;
    if (userType === 0) return `/account/${userId}`;
    return null;
}
