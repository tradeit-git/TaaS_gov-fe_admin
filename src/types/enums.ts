import {z} from "zod";

export const AuthStatusTypeEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "WITHDRAWN", "TRIAL_EXPIRED", "PENDING_APPROVAL", "REJECTED"]);

export const GradeTypeEnum = z.enum(["NEW", "GUEST", "MEMBER", "EXPIRED"]);

// 해외영업 상세관리(tracker) - 바이어 등급 단계
export const BuyerStepEnum = z.enum(["DB", "List", "Lead", "Target", "Client"]);
export type BuyerStepType = z.infer<typeof BuyerStepEnum>;











