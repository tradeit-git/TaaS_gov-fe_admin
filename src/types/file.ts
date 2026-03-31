import { z } from "zod";

export const FileSchema = z.object({
    id: z.number().int().default(0),
    refer: z.string().default(""),
    file : z.instanceof(File).nullable().default(null),
    fileName : z.string().default(""),
    fileExt : z.string().default(""),
    fileSize : z.number().default(0),
    filePath : z.string().default(""),
    createdAt : z.string().default(""),
});

// TypeScript 타입 추출
export type FileType = z.infer<typeof FileSchema>;