import '@/style/contact.scss'
import NewsPage from "@/app/(Auth)/news/component/NewsPage";
import {NewsListResponse} from "@/app/(Auth)/news/component/NewsPage";

export default async function Page() {
    // 목업 데이터 (퍼블리싱용) - 짝수 index는 썸네일 없음
    const mockContent = Array.from({length: 10}, (_, i) => ({
        id: i + 1,
        title: `보도자료 샘플 제목 ${i + 1} - 트레이드잇 신규 서비스 출시`,
        thumbnailUrl: i % 2 === 0 ? '' : `https://picsum.photos/seed/news${i + 1}/90/60`,
        sourceUrl: `https://news.example.com/article/${i + 1}`,
        views: Math.floor(Math.random() * 1000),
        createdAt: `2026-05-${String(10 + i).padStart(2, '0')}T10:00:00`,
        updatedAt: `2026-05-${String(10 + i).padStart(2, '0')}T10:00:00`,
    }));

    const initialData: NewsListResponse = {
        content: mockContent,
        totalElements: mockContent.length,
        totalPages: 1,
        currentPage: 0,
    };

    return <NewsPage initialData={initialData} />;
}
