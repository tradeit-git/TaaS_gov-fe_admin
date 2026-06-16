import { z } from "zod";

import {UserSchema} from "@/types/user/user";
import {ProjectSchema} from "@/types/project/project";
import {GeoCodeSchema} from "@/types/common/geoCode";
import {CurrencyUnitSchema} from "@/types/common/currentUnit";
import {AdminSchema} from "@/types/auth/admin";
import {BuyerStepEnum} from "@/types/enums";

export const BuyerSchema = z.object({
    id: z.number().int().default(0),
    project : ProjectSchema.default(ProjectSchema.parse({})),
    isBookmark : z.boolean().default(false),
    step : BuyerStepEnum.default("DB"),
    stepUpdatedAt: z.string().nullable().default(null),
    companyName: z.string().default(""),
    geoCode: GeoCodeSchema.default(GeoCodeSchema.parse({})),

    googleMapAddress: z.string().default(""),
    geoLatLng: z.string().default(""),
    timeDiffWithKorea: z.number().default(0),

    homepage: z.string().default(""),
    isDisplayHomepage: z.boolean().default(true),
    currencyUnit : CurrencyUnitSchema.nullable().default(null),
    revenue: z.string().default(""),

    keyItems: z.string().default(""),
    companyContacts: z.string().default(""),
    companyEmails: z.string().default(""),
    facebook: z.string().default(""),
    linkedin: z.string().default(""),
    youtube: z.string().default(""),
    isPublic: z.boolean().default(false),
    modifiedByUser: UserSchema.nullable().default(null),
    modifiedByAdmin: AdminSchema.nullable().default(null),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),

    salesLogCount : z.number().default(0),
    salesLogLastUpdatedAt : z.string().default(""),
});

// TypeScript 타입 추출
export type BuyerType = z.infer<typeof BuyerSchema>;
