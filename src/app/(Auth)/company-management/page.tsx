// import callApi from "@/utill/apiRequest";
// import {getServerRequestOptions} from "@/lib/serverRequest";
import CompanyManagementPage, {CompanyListResponse} from "@/app/(Auth)/company-management/component/CompanyManagementPage";

// 목업 데이터
const MOCK_DATA: CompanyListResponse = {
    content: [
        {
            id: 6,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: '개인',
            paymentMethod: '정기 카드 결제 (매월 18일)',
            planStartDate: '2025-01-01',
            planEndDate: '2025-12-31',
            affiliationName: null,
            createdAt: '2025-03-15',
        },
        {
            id: 5,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: '팀',
            paymentMethod: '정기 카드 결제 (매월 1일)',
            planStartDate: '2025-02-01',
            planEndDate: '2026-01-31',
            affiliationName: null,
            createdAt: '2025-02-20',
        },
        {
            id: 4,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: '엔터프라이즈',
            paymentMethod: '정기 카드 결제 (매월 31일)',
            planStartDate: '2025-03-01',
            planEndDate: '2026-02-28',
            affiliationName: null,
            createdAt: '2025-01-10',
        },
        {
            id: 3,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: '해외영업실행',
            paymentMethod: 'GA 계약 (2026.01.01~2026.06.30)',
            planStartDate: '2025-04-01',
            planEndDate: '2026-03-31',
            affiliationName: '대구무역협회 2026',
            createdAt: '2024-12-05',
        },
        {
            id: 2,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: 'Free(30day trial)',
            paymentMethod: null,
            planStartDate: '2025-05-01',
            planEndDate: '2025-05-30',
            affiliationName: null,
            createdAt: '2024-11-20',
        },
        {
            id: 1,
            companyName: '이노베이션워크스',
            loginId: 'yoonkh88@gmail.com',
            name: '윤태준',
            department: '파트너영업팀',
            position: '차장',
            planName: 'Free',
            paymentMethod: null,
            planStartDate: null,
            planEndDate: null,
            affiliationName: null,
            createdAt: '2024-10-01',
        },
    ],
    totalElements: 6,
    totalPages: 1,
    currentPage: 0,
};

export default async function Page() {
    // TODO: API 연동 시 아래 주석 해제
    // const options = await getServerRequestOptions();
    // let initialData: CompanyListResponse = {
    //     content: [],
    //     totalElements: 0,
    //     totalPages: 1,
    //     currentPage: 0,
    // };
    // try {
    //     const res = await callApi(`/api/admin/members/companies?page=0&size=10`, options);
    //     if (res.result && res.data) {
    //         initialData = res.data as CompanyListResponse;
    //     }
    // } catch (e) {
    //     console.error(e);
    // }

    return <CompanyManagementPage initialData={MOCK_DATA}/>;
}