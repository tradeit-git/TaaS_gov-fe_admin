import {z} from "zod";

// 등급 정보
export const GradeSchema = z.object({
    gradeCode: z.string().default(""),
    gradeName: z.string().default(""),
    monthlyCredit: z.number().default(0),
    maxCredit: z.number().default(0),
    displayOrder: z.number().default(0),
});

// 이용권 현황 (등급별 사용자 수)
export const GradeDistributionSchema = z.object({
    gradeCode: z.string().default(""),
    gradeName: z.string().default(""),
    userCount: z.number().default(0),
    percentage: z.number().default(0),
});

// 서비스 이용권 변경 (업/다운그레이드)
export const GradeChangeSchema = z.object({
    fromGradeCode: z.string().default(""),
    fromGradeName: z.string().default(""),
    toGradeCode: z.string().default(""),
    toGradeName: z.string().default(""),
    count: z.number().default(0),
    changeType: z.string().default(""), // UPGRADE, DOWNGRADE
});

// 무료 크레딧 - 기간별 분포
export const PeriodDistributionSchema = z.object({
    period: z.string().default(""),   // 0-1일, 2-5일, 6-10일, 11-15일, 16-20일, 21-30일, 소멸
    count: z.number().default(0),
});

// 무료 크레딧 통계
export const FreeCreditStatsSchema = z.object({
    avgConsumptionDays: z.number().default(0),   // 평균 소진기간 (일)
    expireCount: z.number().default(0),           // 소멸 빈도
    expireRate: z.number().default(0),            // 소멸률 (%)
    avgExpireAmount: z.number().default(0),       // 평균 소멸량
    periodDistribution: z.array(PeriodDistributionSchema).default([]),
});

// 기간별 평균 크레딧 사용량
export const AverageUsageSchema = z.object({
    dailyAverage: z.number().default(0),    // 일 평균
    weeklyAverage: z.number().default(0),   // 주 평균
    monthlyAverage: z.number().default(0),  // 월 평균
});

// 이용권별 크레딧 사용현황
export const CreditUsageByGradeSchema = z.object({
    gradeCode: z.string().default(""),
    gradeName: z.string().default(""),
    totalGranted: z.number().default(0),      // 총지급
    totalUsed: z.number().default(0),         // 사용량
    usedRate: z.number().default(0),          // 사용률 (%)
    totalRemaining: z.number().default(0),    // 잔여량
    remainingRate: z.number().default(0),     // 잔여율 (%)
});

// 크레딧 인사이트 통합 응답
export const CreditInsightResponseSchema = z.object({
    gradeDistribution: z.array(GradeDistributionSchema).default([]),
    gradeChanges: z.array(GradeChangeSchema).default([]),
    freeCreditStats: FreeCreditStatsSchema.default(FreeCreditStatsSchema.parse({})),
    averageUsage: AverageUsageSchema.default(AverageUsageSchema.parse({})),
    usageByGrade: z.array(CreditUsageByGradeSchema).default([]),
});

// 월별/연도별 서비스별 크레딧 사용량 (스택 바 차트용)
export const MonthlyUsageByServiceSchema = z.object({
    gradeCode: z.string().default(""),
    year: z.number().default(0),
    month: z.number().default(0),
    day: z.number().nullable().default(null),
    label: z.string().default(""),
    usageByService: z.record(z.string(), z.number()).default({}),
    totalUsed: z.number().default(0),
});

// TypeScript 타입 추출
export type GradeType = z.infer<typeof GradeSchema>;
export type GradeDistributionType = z.infer<typeof GradeDistributionSchema>;
export type GradeChangeType = z.infer<typeof GradeChangeSchema>;
export type PeriodDistributionType = z.infer<typeof PeriodDistributionSchema>;
export type FreeCreditStatsType = z.infer<typeof FreeCreditStatsSchema>;
export type AverageUsageType = z.infer<typeof AverageUsageSchema>;
export type CreditUsageByGradeType = z.infer<typeof CreditUsageByGradeSchema>;
export type CreditInsightResponseType = z.infer<typeof CreditInsightResponseSchema>;
export type MonthlyUsageByServiceType = z.infer<typeof MonthlyUsageByServiceSchema>;
