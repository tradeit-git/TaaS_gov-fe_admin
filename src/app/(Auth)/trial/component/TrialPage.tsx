'use client'

import Link from "next/link";
import {useCallback, useState} from "react";
import TrialCreateForm from "@/app/(Auth)/trial/component/TrialCreateForm";
import TrialTableBody from "@/app/(Auth)/trial/component/TrialTableBody";
import callApi from "@/utill/apiRequest";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";

export interface TrialKeyRow {
    id: number;
    trialKey: string;
    trialName: string;
    startDate: string;
    endDate: string;
    creditAmount: number;
    maxUses: number | null;
    usedCount: number;
    createdAt: string;
}

interface Props {
    initialData: TrialKeyRow[];
}

export default function TrialPage({initialData}: Props) {
    const {addPopup} = usePopupStore();
    const [data, setData] = useState<TrialKeyRow[]>(initialData);

    const fetchList = useCallback(async () => {
        const res = await callApi(`/api/admin/trial-keys`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            setData(res.data as TrialKeyRow[]);
        }
    }, []);

    const handleCreated = () => {
        fetchList();
    };

    const handleDelete = (id: number) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 체험 키를 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/trial-keys/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                fetchList();
            } else {
                addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>체험계정</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/trial'}>체험계정</Link></li>
                </ul>
            </div>

            <TrialCreateForm onCreated={handleCreated}/>


            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table'}>
                    <colgroup>
                        <col width={'50px'}/>

                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>관련프로그램</th>
                        <th>도메인</th>
                        <th>크레딧</th>
                        <th>운영기간</th>
                        <th>체험가입자수</th>
                        <th>등록일자</th>
                        <th>관리</th>
                    </tr>
                    </thead>
                    <TrialTableBody data={data} formatDate={formatDateDot} onDelete={handleDelete}/>
                </table>
            </div>
        </div>
    );
}
