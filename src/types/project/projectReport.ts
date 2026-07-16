export interface ProjectReportProject {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

export interface CompanyAnalysisEntry {
    seq: number;
    content: string;
}

export interface CompanyAnalysisReport {
    id: number;
    companyAnalysisEntries: CompanyAnalysisEntry[];
}

export interface GeoCode {
    isoCode: string;
    name: string;
}

export interface ReportBuyer {
    companyName: string;
    step: string;
    googleMapAddress: string;
    homepage: string;
    keyItems: string;
    geoCode: GeoCode | null;
}

export interface BuyerSalesLog {
    id: number;
    title: string;
    topic: string;
    date: string;
    content: string;
}

export interface BuyerReport {
    buyer: ReportBuyer;
    buyerSalesLogs: BuyerSalesLog[];
}

export interface ProjectReportType {
    project: ProjectReportProject;
    companyAnalysis: CompanyAnalysisReport | null;
    buyers: BuyerReport[];
}
