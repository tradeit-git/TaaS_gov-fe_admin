import DetailPageContent from "./DetailPageContent";
import { UserSchema, UserType } from "@/types/user/user";

const NAMES = [
    "잇트레이드", "김민수", "이서연", "박지훈", "최유진", "정도현", "강하늘", "윤채원", "임재민", "한소율",
    "송지우", "배현우", "오예린", "유시우", "문서진", "노하준", "권예은", "홍민재", "서지안", "조하율",
    "신도윤", "안예나", "백현서", "장태훈", "남수아", "심지호", "양지민", "고은찬", "하예서", "류시원",
    "전우진", "황다은", "구민호", "성윤서", "천지안", "민지훈", "봉서아", "연준호", "도예린", "제갈민",
];

const COMPANIES = [
    "잇트레이드", "테크인사이트", "블루오션", "한빛솔루션", "그린글로벌", "퍼스트무역", "오션상사", "코리아트레이딩",
    "넥스트그룹", "리드무역", "스마트로지스", "글로벌링크", "프라임상사", "유니온트레이드", "센트럴무역", "이지무역",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = await params;
    const idx = Math.max(Number(userId) - 1, 0);

    const createdDate = new Date(2026, 0, 21);
    createdDate.setDate(createdDate.getDate() - idx * 2);
    const lastLoginDate = new Date(createdDate);
    lastLoginDate.setDate(lastLoginDate.getDate() + 30 + (idx % 20));

    const granted = 1000 + (idx % 5) * 1000;
    const used = Math.floor(granted * ((idx % 4) * 0.2));
    const expired = Math.floor(granted * ((idx % 3) * 0.1));
    const balance = Math.max(granted - used - expired, 0);

    const mockUser: UserType = UserSchema.parse({
        id: Number(userId) || 1,
        status: "ACTIVE",
        loginId: `tradeit${211200 + (Number(userId) || 1)}@gmail.com`,
        name: NAMES[idx % NAMES.length],
        companyName: COMPANIES[idx % COMPANIES.length],
        email: `tradeit${211200 + (Number(userId) || 1)}@gmail.com`,
        contact: `010-${pad(1000 + (idx * 37) % 9000)}-${pad(2000 + (idx * 53) % 8000)}`,
        createdAt: toIso(createdDate),
        lastLoginAt: toIso(lastLoginDate),
        creditSummary: { granted, used, expired, balance },
    });

    return <DetailPageContent initialUser={mockUser} />;
}