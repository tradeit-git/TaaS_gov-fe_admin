import {z} from "zod";
import {UserFileSchema} from "@/types/user/userFile";
import {AuthStatusTypeEnum, GradeTypeEnum} from "@/types/enums";
import {UserUsageServiceHistorySchema} from "@/types/user/userUsageServiceHistory";

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
    grade : GradeTypeEnum.default("NEW"),
    currentUserUsageService: UserUsageServiceHistorySchema.nullable().default(null),
    statusUpdatedAt : z.string().default(""),
    no : z.string().nullable().default(null),
    loginId: z.string().default(""),
    userType: z.string().default(""),
    password: z.string().default(""),
    name: z.string().default(""),
    companyName: z.string().default(""),
    department: z.string().default(""),
    position: z.string().default(""),
    email: z.string().default(""),
    contact: z.string().default(""),
    createdAt: z.string().default(""),
    viewAt: z.string().default(""),
    updatedAt: z.string().nullable().default(null),
    deletedAt: z.string().nullable().default(null),
    userFiles: z.array(UserFileSchema).default([]),
    userUsageServiceHistories: z.array(UserUsageServiceHistorySchema).default([]),
    creditSummary: CreditSummarySchema.nullable().default(null),
    lastLoginAt: z.string().nullable().default(null),
});

// TypeScript 타입 추출
export type UserType = z.infer<typeof UserSchema>;

export const getUserNo = (user : UserType) => {

    if(user.id === 0 ) return "-";
    const ymd = user.createdAt.substring(0,10).replaceAll("-","").substring(2)
    const no = user.id.toString().padStart(4,'0');
    return ['usr',ymd,no].join("-");
}

export const getStatusKr = (user : UserType) => {
    if(!user?.status  ) return  "unknown"
    switch (user.status){
        case "WITHDRAWN" : return "탈퇴";
        case "INACTIVE" : return "비활성";
        case "SUSPENDED" : return "정지";
    }
    switch (user.grade) {
        case "NEW" : return "신규회원";
        case "GUEST" : return "게스트";
        case "MEMBER" : return "유료회원";
        case "EXPIRED" : return "기간만료";
        default : return "활성";
    }
}