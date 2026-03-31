import {z} from "zod";

export const CompanyClassificationSchema = z.object({
    id : z.number().default(0),
    upId : z.number().nullable().default(null),
    ksicCode : z.string().nullable().default(null),
    level : z.number().default(1),
    isLeaf : z.boolean().default(false),
    nameKr : z.string().default(""),
});

// TypeScript 타입 추출
export type CompanyClassificationType = z.infer<typeof CompanyClassificationSchema>;


