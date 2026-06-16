import {z} from "zod";
import {UserSchema} from "@/types/user/user";
import {BuyerStepEnum, BuyerStepType} from "@/types/enums";
import {AdminSchema} from "@/types/auth/admin";

export const ProjectSchema = z.object({
    id: z.number().int().default(0),
    name: z.string().default(""),
    startDate: z.string().default(""),
    endDate: z.string().default(""),
    createUser: UserSchema.default(UserSchema.parse({})),
    createdAdmin: AdminSchema.nullable().default(null),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),
    list: z.string().default(""),
    listTooltip: z.string().default(""),
    lead: z.string().default(""),
    leadTooltip: z.string().default(""),
    target: z.string().default(""),
    targetTooltip: z.string().default(""),
    client: z.string().default(""),
    clientTooltip: z.string().default(""),
    buyerCountPerStep: z.record(BuyerStepEnum, z.number()).default({}),
    totalSalesLogCount : z.number().default(0),
    isBookmark: z.boolean().default(false),   // managed-users 프로젝트 즐겨찾기 여부 (요청 관리자 기준)
});

// TypeScript 타입 추출
export type ProjectType = z.infer<typeof ProjectSchema>;

export const getProjectNo = (project : ProjectType) => {
    if(project.id === 0 ) return "-";
    const ymd = project.createdAt.substring(0,10).replaceAll("-","").substring(2)
    const no = project.id.toString().padStart(4,'0');
    return ['pjt',ymd,no].join("-");
}

export function getStepNameByProject(project: ProjectType, step: BuyerStepType) {
    if (Object.hasOwn(project, step.toLowerCase())
        && typeof project[step.toLowerCase() as keyof ProjectType] === "string"
        && project[step.toLowerCase() as keyof ProjectType]) {
        return project[step.toLowerCase() as keyof ProjectType] as string;
    } else {
        return step;
    }
}

export function getStepTooltipByProject(project: ProjectType, step: BuyerStepType) {
    const tooltip = `${step.toLowerCase()}Tooltip`;
    if (typeof project[tooltip as keyof ProjectType] === "string"
        && Object.hasOwn(project, tooltip)
        && project[step.toLowerCase() as keyof ProjectType]) {
        return project[tooltip as keyof ProjectType] as string;
    } else {
        switch (step) {
            case "List" :
                return "바이어 DB를 필터링하여 분류된 잠재 고객 기업";
            case "Lead" :
                return "마케팅 활동(이메일, 콜드콜)으로 추출된 관심 기업 및 영업 대상";
            case "Target" :
                return "영업활동(관심, 호응, inquiry, RFQ 등)을 통해 분류된 기업";
            case "Client" :
                return "최종계약(PO)를 체결한 기업";
            default :
                return "";
        }
    }
}
