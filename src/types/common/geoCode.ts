import {z} from "zod";

export const GeoCodeDataTypeEnum = z.enum(["CONTINENT", "REGION", "COUNTRY"]);
export type GeoCodeDataType = z.infer<typeof GeoCodeDataTypeEnum>;

export const GeoCodeSchema = z.object({
    type: GeoCodeDataTypeEnum.default("CONTINENT"),
    code: z.string().default(""),
    upCode: z.string().nullable().default(null),
    name: z.string().default(""),
    isoCode: z.string().nullable().default(null),
    countryCode: z.string().nullable().default(null),
});

// TypeScript 타입 추출
export type GeoCodeType = z.infer<typeof GeoCodeSchema>;
