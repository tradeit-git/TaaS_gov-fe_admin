import {z} from "zod";

export const AuthStatusTypeEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "WITHDRAWN"]);
export const GradeTypeEnum = z.enum(["NEW", "GUEST", "MEMBER", "EXPIRED"]);











