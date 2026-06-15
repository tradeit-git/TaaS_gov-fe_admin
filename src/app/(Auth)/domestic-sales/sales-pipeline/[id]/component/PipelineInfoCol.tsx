'use client'

import {useState} from "react";
import {useRouter} from "next/navigation";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";
import {PipelineDetail} from "./SalesPipelineDetailPage";

const GRADE_LABELS: Record<string, string> = {
    POTENTIAL: '잠재',
    LEAD: '리드',
    TARGET: '타겟',
    CLIENT: '클라이언트',
};

const GRADE_KEYS = ['POTENTIAL', 'LEAD', 'TARGET', 'CLIENT'] as const;

interface Props {
    detail: PipelineDetail;
    onUpdate: () => void;
}

export default function PipelineInfoCol({detail, onUpdate}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const region = detail.location || '-';

    const [salesGrade, setSalesGrade] = useState(detail.salesGrade);
    const [salesType, setSalesType] = useState(detail.salesType || '');
    const [salesManager, setSalesManager] = useState(detail.salesManager || '');

    const handleSave = async () => {
        const res = await callApi(`/api/admin/sales/pipelines/${detail.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({customerId: detail.customerId, salesGrade, salesType, salesManager}),
        });
        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            onUpdate();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '수정에 실패했습니다.'}/>);
        }
    };

    const handleDelete = () => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 영업파이프라인을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/sales/pipelines/${detail.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
                router.push('/domestic-sales/sales-pipeline');
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    return (
        <div className={'pipeline_info_col'}>
            {/* 브레드크럼 */}
            <div className={'pipeline_crumb'}>
                <span>국내고객사영업</span>
                <span className={'sep'}>&rsaquo;</span>
                <span>영업파이프라인</span>
                <span className={'sep'}>&rsaquo;</span>
                <span className={'pipeline_title'}>{detail.customerName}</span>
                <span className={'pipeline_grade_badge'}>{GRADE_LABELS[detail.salesGrade] ?? detail.salesGrade}</span>
                <button type="button" className={'btn_back'} onClick={() => router.push('/domestic-sales/sales-pipeline')}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                    목록으로
                </button>
            </div>

            {/* 영업 정보 */}
            <div className={'pipeline_info_section'}>
                <h3>영업 정보</h3>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>영업등급</div>
                    <select className={'field_select'} value={salesGrade} onChange={e => setSalesGrade(e.target.value)}>
                        {GRADE_KEYS.map(key => (
                            <option key={key} value={key}>{GRADE_LABELS[key]}</option>
                        ))}
                    </select>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>영업유형</div>
                    <input type="text" className={'field_input'} value={salesType} onChange={e => setSalesType(e.target.value)} placeholder={'영업유형 입력'}/>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>영업담당자</div>
                    <input type="text" className={'field_input'} value={salesManager} onChange={e => setSalesManager(e.target.value)} placeholder={'영업담당자 입력'}/>
                </div>
                <div className={'field_btn_wrap'}>
                    <button type="button" className={'btn_field_save'} onClick={handleSave}>수정</button>
                    <button type="button" className={'btn_field_del'} onClick={handleDelete}>삭제</button>
                </div>
            </div>

            {/* 고객사 정보 */}
            <div className={'pipeline_info_section'}>
                <h3>고객사 정보</h3>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>고객사</div>
                    <div className={'field_value'}>{detail.customerName}</div>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>사업자번호</div>
                    <div className={'field_value'}>{detail.bizNo || '-'}</div>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>대표자</div>
                    <div className={'field_value'}>{detail.ceoName || '-'}</div>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>소재지역</div>
                    <div className={'field_value'}>{region}</div>
                </div>
                <div className={'pipeline_field'}>
                    <div className={'field_label'}>사업분야</div>
                    <div className={'field_value'}>{detail.bizField || '-'}</div>
                </div>
            </div>
        </div>
    );
}
