import '@/style/contact.scss'
import ConsultationPage, {ConsultationListResponse} from "@/app/(Auth)/consultation/component/ConsultationPage";

export default async function Page() {
    // 실제 목록은 클라이언트에서 /api/admin/consultations (META_LEAD 전용) 로 조회한다.
    const initialData: ConsultationListResponse = {
        content: [],
        totalElements: 0,
        totalPages: 1,
        currentPage: 0,
    };

    return <ConsultationPage initialData={initialData} />;
}
