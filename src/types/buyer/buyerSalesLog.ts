import { z } from "zod";
import {BuyerSchema} from "@/types/buyer/buyer";
import {UserSchema} from "@/types/user/user";
import {AdminSchema} from "@/types/auth/admin";
import {BuyerSalesLogFileSchema} from "@/types/buyer/buyerSalesLogFile";

// YYYY-MM-DD 형식으로 변환하는 함수
const getTodayYMD = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // "YYYY-MM-DD" 포맷
};

export const BuyerSalesLogSchema = z.object({
    id: z.number().int().default(0),
    buyer : BuyerSchema.default(BuyerSchema.parse({})),
    date: z.string().default(getTodayYMD),
    topic : z.string().default('Pre-sales'),
    title: z.string().default(''),
    content: z.string().default(''),
    modifiedByUser: UserSchema.nullable().default(null),
    modifiedByAdmin: AdminSchema.nullable().default(null),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),
    files: z.array(BuyerSalesLogFileSchema).default([]),
});

// TypeScript 타입 추출
export type BuyerSalesLogType = z.infer<typeof BuyerSalesLogSchema>;

