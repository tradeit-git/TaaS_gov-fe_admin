'use client'

import {useCallback, useEffect, useState} from "react";
import {useParams} from "next/navigation";
import PipelineInfoCol from "./PipelineInfoCol";
import PipelineActivityCol from "./PipelineActivityCol";
import callApi from "@/utill/apiRequest";

export interface PipelineDetail {
    id: number;
    customerId: number;
    customerName: string;
    bizNo: string;
    ceoName: string;
    location: string | null;
    bizField: string | null;
    salesGrade: string;
    salesType: string;
    salesManager: string;
    activityCount: number;
    createdAt: string;
}

export default function SalesPipelineDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [detail, setDetail] = useState<PipelineDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDetail = useCallback(async () => {
        setLoading(true);
        const res = await callApi(`/api/admin/sales/pipelines/${id}`, {
            method: 'GET',
            credentials: 'include',
        });
        setLoading(false);
        if (res.result && res.data) {
            setDetail(res.data as PipelineDetail);
        }
    }, [id]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    if (loading) {
        return (
            <div className={'pipeline_detail'}>
                <div className={'pipeline_info_col'}>
                    <div style={{padding: '40px 22px', color: '#999'}}>로딩 중...</div>
                </div>
                <div className={'pipeline_activity_col'}/>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className={'pipeline_detail'}>
                <div className={'pipeline_info_col'}>
                    <div style={{padding: '40px 22px', color: '#999'}}>데이터를 불러올 수 없습니다.</div>
                </div>
                <div className={'pipeline_activity_col'}/>
            </div>
        );
    }

    return (
        <div className={'pipeline_detail'}>
            <PipelineInfoCol detail={detail} onUpdate={loadDetail}/>
            <PipelineActivityCol pipelineId={detail.id} activityCount={detail.activityCount}/>
        </div>
    );
}
