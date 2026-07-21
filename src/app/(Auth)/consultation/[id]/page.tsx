import '@/style/contact.scss'
import ConsultationDetailPage from "@/app/(Auth)/consultation/[id]/component/ConsultationDetailPage";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function Page({params}: Props) {
    const {id} = await params;

    // 상세는 클라이언트에서 /api/admin/consultations/{id} 로 조회한다.
    return <ConsultationDetailPage id={id}/>;
}
