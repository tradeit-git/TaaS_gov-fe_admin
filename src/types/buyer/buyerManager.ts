import { z } from "zod";

export const BuyerManagerRoleEnum = z.enum(["Admin", "Manager", "Member"]);
export type BuyerManagerRoleType = z.infer<typeof BuyerManagerRoleEnum>;

export const BuyerManagerSchema = z.object({
    buyerId : z.number().default(0),
    role : BuyerManagerRoleEnum.default("Admin"),
    name: z.string().default(""),
    position: z.string().default(""),
    contact: z.string().default(""),
    phone: z.string().default(""),
    email: z.string().default(""),
    twitter: z.string().default(""),
    facebook: z.string().default(""),
    linkedin: z.string().default(""),
    instagram: z.string().default(""),
});

// TypeScript 타입 추출
export type BuyerManagerType = z.infer<typeof BuyerManagerSchema>;
