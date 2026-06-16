import { z } from "zod";
import {BuyerSchema} from "@/types/buyer/buyer";
import {BuyerStepEnum} from "@/types/enums";
import {UserSchema} from "@/types/user/user";
import {AdminSchema} from "@/types/auth/admin";

export const BuyerStepHistoryActionEnum = z.enum(["UP", "DOWN"]);
export type BuyerStepHistoryActionType = z.infer<typeof BuyerStepHistoryActionEnum>;

export const BuyerStepHistorySchema = z.object({
    id: z.number().int().default(0),
    buyer : BuyerSchema.default(BuyerSchema.parse({})),
    action : BuyerStepHistoryActionEnum.default("UP"),
    beforeStep : BuyerStepEnum.default("DB"),
    afterStep : BuyerStepEnum.default("List"),
    comment: z.string().default(""),
    modifiedByUser: UserSchema.nullable().default(null),
    modifiedByAdmin: AdminSchema.nullable().default(null),
    createdAt: z.string().nullable().default(null),
});

// TypeScript 타입 추출
export type BuyerStepHistoryType = z.infer<typeof BuyerStepHistorySchema>;

