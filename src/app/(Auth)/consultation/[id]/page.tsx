import '@/style/contact.scss'
import {redirect} from "next/navigation";
import ConsultationDetailPage from "@/app/(Auth)/consultation/[id]/component/ConsultationDetailPage";
import {ConsultationRow} from "@/app/(Auth)/consultation/component/ConsultationPage";

interface Props {
    params: Promise<{ id: string }>;
}

const MOCK_DATA: Record<string, ConsultationRow> = {
    '1': {
        id: 1, companyName: '한국경영기술진흥원', name: '양경수', department: '컨설팅본부', position: '대표',
        phone: '070-0000-0000', email: 'yks121@naver.com', adConsent: false,
        content: '저는 올해 27년차 수출 및 경영컨설팅을 하고 있는 경영지도사 양경수입니다. 귀사의 솔루션을 몇 군데 소개해서 계약이 체결된 곳도 있고 검토단계에 있는 회사들도 있습니다. 제가 전공이 무역이어서 귀사의 솔루션을 궁금해서 좀더 살펴보고자 하는 관련 정보가 제한적이어서 제대로 이해하기 어렵습니다. 그래서 좀더 솔루션에 대해서 학습하고 이해해서 제가 컨설팅하고 상담하는 중소기업들에게 소개를 해 보고자 합니다. 관련한 학습자료같은 참고자료가 있을까요?',
        adminMemo: null, status: 'PENDING', createdAt: '2025-07-15T10:30:00', updatedAt: '2025-07-15T10:30:00',
    },
    '2': {
        id: 2, companyName: '스타리치어드바이저', name: '조용우', department: '경영', position: '이사',
        phone: '010-0000-0000', email: 'autoelex@naver.com', adConsent: false,
        content: '귀사의 무역 솔루션 도입을 검토 중입니다. 상세한 기능 안내와 데모 시연을 요청드립니다.',
        adminMemo: '1차 통화 완료, 데모 일정 조율 중', status: 'IN_PROGRESS', createdAt: '2025-07-14T09:15:00', updatedAt: '2025-07-15T14:00:00',
    },
    '3': {
        id: 3, companyName: '(주)디에프코리아', name: '김정현', department: '영업부', position: '과장',
        phone: '010-0000-0000', email: 'kymkjh2002@dkorealed.co.kr', adConsent: true,
        content: '수출입 통관 관련 솔루션 문의드립니다. 현재 사용 중인 시스템과의 연동 가능 여부도 확인 부탁드립니다.',
        adminMemo: null, status: 'COMPLETED', createdAt: '2025-07-13T14:20:00', updatedAt: '2025-07-14T11:00:00',
    },
    '4': {
        id: 4, companyName: '글로벌트레이딩', name: '박서연', department: '해외사업부', position: '부장',
        phone: '02-1234-5678', email: 'sy.park@globaltrading.kr', adConsent: true,
        content: '동남아 시장 진출을 위한 무역 플랫폼 도입 상담을 요청합니다.',
        adminMemo: null, status: 'PENDING', createdAt: '2025-07-12T11:00:00', updatedAt: '2025-07-12T11:00:00',
    },
    '5': {
        id: 5, companyName: '(주)넥스트로지스', name: '이민호', department: '물류기획팀', position: '팀장',
        phone: '031-987-6543', email: 'minho.lee@nextlogis.com', adConsent: false,
        content: '물류 추적 시스템과 연계 가능한 무역 관리 솔루션 문의드립니다.',
        adminMemo: '견적서 발송 완료', status: 'IN_PROGRESS', createdAt: '2025-07-11T16:45:00', updatedAt: '2025-07-13T09:30:00',
    },
    '6': {
        id: 6, companyName: '세종무역', name: '최유진', department: '경영지원', position: '사원',
        phone: '010-5555-6666', email: 'yujin@sejongtrade.co.kr', adConsent: true,
        content: '중소기업 대상 무역 교육 프로그램이 있는지 문의드립니다.',
        adminMemo: null, status: 'COMPLETED', createdAt: '2025-07-10T08:30:00', updatedAt: '2025-07-11T15:00:00',
    },
    '7': {
        id: 7, companyName: '대한상사', name: '정우성', department: '수출입팀', position: '차장',
        phone: '02-3333-4444', email: 'ws.jung@daehan.co.kr', adConsent: false,
        content: 'FTA 원산지 관리 기능에 대한 상세 설명을 요청합니다.',
        adminMemo: null, status: 'PENDING', createdAt: '2025-07-09T13:10:00', updatedAt: '2025-07-09T13:10:00',
    },
    '8': {
        id: 8, companyName: '에이스인터내셔널', name: '한소희', department: '마케팅', position: '대리',
        phone: '010-7777-8888', email: 'sohee@aceintl.com', adConsent: true,
        content: '해외 바이어 매칭 서비스에 관심이 있습니다. 자세한 안내 부탁드립니다.',
        adminMemo: '바이어 매칭 서비스 안내 메일 발송', status: 'COMPLETED', createdAt: '2025-07-08T10:20:00', updatedAt: '2025-07-10T16:00:00',
    },
    '9': {
        id: 9, companyName: '유니온테크', name: '강동원', department: 'IT기획', position: '과장',
        phone: '032-1111-2222', email: 'dw.kang@uniontech.kr', adConsent: false,
        content: 'API 연동 방식과 기술 스펙에 대한 문의입니다.',
        adminMemo: null, status: 'IN_PROGRESS', createdAt: '2025-07-07T15:30:00', updatedAt: '2025-07-09T10:00:00',
    },
    '10': {
        id: 10, companyName: '한빛통상', name: '윤세아', department: '총무부', position: '주임',
        phone: '010-9999-0000', email: 'sea.yoon@hanbit.co.kr', adConsent: true,
        content: '기존 ERP와 연동 가능 여부 및 도입 비용 문의입니다.',
        adminMemo: null, status: 'PENDING', createdAt: '2025-07-06T09:00:00', updatedAt: '2025-07-06T09:00:00',
    },
};

export default async function Page({params}: Props) {
    const {id} = await params;

    // TODO: 백엔드 연동 후 API 호출로 교체
    const initialDetail = MOCK_DATA[id];

    if (!initialDetail) {
        redirect('/consultation');
    }

    return <ConsultationDetailPage id={id} initialDetail={initialDetail}/>;
}
