// 제휴 대시보드 공용 API(/api/crm/partner-keys/common/**) 응답 타입.
// CRM(Taas_gov-fe_crm) dashboard/types.ts 에서 두 탭이 쓰는 것만 옮김.

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
