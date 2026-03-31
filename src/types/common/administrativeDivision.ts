import {z} from "zod";

export const AdministrativeDivisionSchema = z.object({
    id : z.number().default(0),
    upId : z.number().nullable().default(null),
    level : z.number().default(1),
    isLeaf : z.boolean().default(false),
    nameKr : z.string().default(""),
});

// TypeScript 타입 추출
export type AdministrativeDivisionType = z.infer<typeof AdministrativeDivisionSchema>;

