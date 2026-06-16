import { z } from "zod";
import {FileSchema} from "@/types/file";

export const BuyerSalesLogFileSchema = z.object({
    id: z.number().int().default(0),
    s3File : FileSchema.default(FileSchema.parse({}))
});

// TypeScript 타입 추출
export type BuyerSalesLogFileType = z.infer<typeof BuyerSalesLogFileSchema>;

