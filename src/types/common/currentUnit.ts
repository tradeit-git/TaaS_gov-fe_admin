import { z } from "zod";
import {GeoCodeSchema} from "@/types/common/geoCode";

export const CurrencyUnitSchema = z.object({
    id : z.number().default(0),
    geoCode : GeoCodeSchema.default(GeoCodeSchema.parse({})),
    currencyName : z.string().default(""),
    symbol : z.string().default(""),
    isoCode : z.string().default(""),
});

// TypeScript 타입 추출
export type CurrencyUnitType = z.infer<typeof CurrencyUnitSchema>;