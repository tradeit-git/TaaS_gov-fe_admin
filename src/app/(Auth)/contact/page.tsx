import '@/style/contact.scss'
import ContactPage from "@/app/(Auth)/contact/component/ContactPage";
import {InquiryListResponse, InquiryRow} from "@/app/(Auth)/contact/component/ContactPage";

const MOCK_DATA: InquiryRow[] = [
    {
        id: 1, inquiryType: 'PARTNERSHIP', title: '솔루션 도입 문의', companyName: '한국경영기술진흥원', name: '양경수',
        department: '컨설팅본부', position: '대표', phone: '070-0000-0000', mobile: '010-1234-5678',
        email: 'yks121@naver.com', content: '귀사의 무역 솔루션 도입을 검토하고 있습니다. 상세 안내 부탁드립니다.',
        ip: null, privacyAgreed: true, adminMemo: null, status: 'PENDING',
        isRead: false, readAt: null, readByAdminId: null, userId: null,
        createdAt: '2025-07-15T10:30:00', updatedAt: '2025-07-15T10:30:00',
    },
    {
        id: 2, inquiryType: 'CRM_1ON1', title: null, companyName: '스타리치어드바이저', name: '조용우',
        department: '경영', position: '이사', phone: '010-0000-0000', mobile: null,
        email: 'autoelex@naver.com', content: 'CRM 기능 관련 1:1 상담 요청드립니다.',
        ip: null, privacyAgreed: true, adminMemo: '1차 통화 완료', status: 'IN_PROGRESS',
        isRead: true, readAt: '2025-07-15T14:00:00', readByAdminId: 1, userId: 5,
        createdAt: '2025-07-14T09:15:00', updatedAt: '2025-07-15T14:00:00',
    },
    {
        id: 3, inquiryType: 'PARTNERSHIP', title: '통관 솔루션 연동 문의', companyName: '(주)디에프코리아', name: '김정현',
        department: '영업부', position: '과장', phone: '010-0000-0000', mobile: '010-9876-5432',
        email: 'kymkjh2002@dkorealed.co.kr', content: '수출입 통관 관련 솔루션 문의드립니다.',
        ip: null, privacyAgreed: true, adminMemo: null, status: 'COMPLETED',
        isRead: true, readAt: '2025-07-14T11:00:00', readByAdminId: 1, userId: null,
        createdAt: '2025-07-13T14:20:00', updatedAt: '2025-07-14T11:00:00',
    },
    {
        id: 4, inquiryType: 'PARTNERSHIP', title: '동남아 시장 진출 문의', companyName: '글로벌트레이딩', name: '박서연',
        department: '해외사업부', position: '부장', phone: '02-1234-5678', mobile: '010-2222-3333',
        email: 'sy.park@globaltrading.kr', content: '동남아 시장 진출을 위한 무역 플랫폼 도입 상담을 요청합니다.',
        ip: null, privacyAgreed: true, adminMemo: null, status: 'PENDING',
        isRead: false, readAt: null, readByAdminId: null, userId: null,
        createdAt: '2025-07-12T11:00:00', updatedAt: '2025-07-12T11:00:00',
    },
    {
        id: 5, inquiryType: 'CRM_1ON1', title: null, companyName: '(주)넥스트로지스', name: '이민호',
        department: '물류기획팀', position: '팀장', phone: '031-987-6543', mobile: null,
        email: 'minho.lee@nextlogis.com', content: '물류 추적 시스템과 연계 가능한 무역 관리 솔루션 문의드립니다.',
        ip: null, privacyAgreed: true, adminMemo: '견적서 발송 완료', status: 'IN_PROGRESS',
        isRead: true, readAt: '2025-07-13T09:30:00', readByAdminId: 2, userId: 12,
        createdAt: '2025-07-11T16:45:00', updatedAt: '2025-07-13T09:30:00',
    },
];

export default async function Page() {
    // TODO: 백엔드 연동 후 API 호출로 교체
    const initialData: InquiryListResponse = {
        content: MOCK_DATA,
        totalElements: MOCK_DATA.length,
        totalPages: 1,
        currentPage: 0,
        unreadCount: 2,
    };

    return <ContactPage initialData={initialData} />;
}
