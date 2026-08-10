import {z} from "zod";
import {UserFileSchema} from "@/types/user/userFile";
import {AuthStatusTypeEnum} from "@/types/enums";

export const CreditSummarySchema = z.object({
    balance: z.number().default(0),
    expired: z.number().default(0),
    granted: z.number().default(0),
    used: z.number().default(0),
});

export type CreditSummaryType = z.infer<typeof CreditSummarySchema>;

export const UserSchema = z.object({
    id: z.number().int().default(0),
    status : AuthStatusTypeEnum.default("ACTIVE"),
    statusUpdatedAt : z.string().default(""),
    loginId: z.string().default(""),
    userType: z.string().default(""),
    password: z.string().default(""),
    name: z.string().default(""),
    companyName: z.string().default(""),
    businessNumber: z.preprocess((v) => v ?? "", z.string()).default(""),
    department: z.string().default(""),
    position: z.string().default(""),
    email: z.string().default(""),
    contact: z.string().default(""),
    memo: z.string().nullable().default(null),
    partnerName : z.string().nullable().default(null),
    createdAt: z.string().default(""),
    updatedAt: z.string().nullable().default(null),
    deletedAt: z.string().nullable().default(null),
    userFiles: z.array(UserFileSchema).default([]),
    creditSummary: CreditSummarySchema.nullable().default(null),
    lastLoginAt: z.string().nullable().default(null),
});

// TypeScript 타입 추출
export type UserType = z.infer<typeof UserSchema>;
