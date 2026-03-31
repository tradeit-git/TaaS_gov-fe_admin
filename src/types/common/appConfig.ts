import { z } from "zod";
import {GeoCodeSchema} from "@/types/common/geoCode";
import {CurrencyUnitSchema} from "@/types/common/currentUnit";
import {AdministrativeDivisionSchema} from "@/types/common/administrativeDivision";
import {CompanyClassificationSchema} from "@/types/common/companyClassification";

export const AppConfigSchema = z.object({
    geoCodes : z.array(GeoCodeSchema).default([]),
    currencyUnits : z.array(CurrencyUnitSchema).default([]),
    administrativeDivisions : z.array(AdministrativeDivisionSchema).default([]),
    companyClassifications : z.array(CompanyClassificationSchema).default([]),
});

// TypeScript 타입 추출
export type AppConfigType = z.infer<typeof AppConfigSchema>;