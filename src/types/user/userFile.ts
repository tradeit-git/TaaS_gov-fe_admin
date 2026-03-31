import { z } from "zod";
import {FileSchema} from "@/types/file";

export const UserFileSchema = z.object({
    id: z.number().int().default(0),
    category : z.string().default(""),
    s3File : FileSchema.default(FileSchema.parse({})),
    createdAt: z.string().default(""),
});

// TypeScript 타입 추출
export type UserFileType = z.infer<typeof UserFileSchema>;

