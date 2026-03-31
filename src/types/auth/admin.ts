import { z } from "zod";

export const AdminSchema = z.object({
    id: z.number().int().default(0),
    loginId: z.string().default(""),
    password: z.string().default(""),
    name: z.string().default(""),
    department: z.string().default(""),
    position: z.string().default(""),
    email: z.string().default(""),
    contact: z.string().default(""),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),
});

// TypeScript 타입 추출
export type AdminType = z.infer<typeof AdminSchema>;