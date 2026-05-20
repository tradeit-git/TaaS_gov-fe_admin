'use client';

import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import ServiceCreditPopup from "@/app/(Auth)/users/[id]/component/ServiceCreditPopup";
import CreditUsagePopup, {TransactionsResponse} from "@/app/(Auth)/users/[id]/component/CreditUsagePopup";
import callApi from "@/utill/apiRequest";
import {
    PLAN_STATUS_CLASS,
    PLAN_STATUS_LABEL,
    PlanStatus,
    formatNegated,
    formatNum,
    todayISODate,
} from "@/app/(Auth)/users/[id]/component/planShared";

export interface ServiceCreditItem {
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    grantedAmount: number;
    usedAmount: number;
    balance: number;
    expiredAmount: number;
}

export const getServiceStatus = (item: ServiceCreditItem): PlanStatus => {
    const today = todayISODate();
    if (today > item.endDate) return 'EXPIRED';
    return 'ACTIVE';
};

export const canEditService = (item: ServiceCreditItem) => getServiceStatus(item) !== 'EXPIRED';

export const canDeleteService = (item: ServiceCreditItem) => {
    const today = todayISODate();
    return getServiceStatus(item) === 'ACTIVE' && today < item.startDate;
};

export const isServiceStarted = (item: ServiceCreditItem) => {
    const today = todayISODate();
    return today >= item.startDate;
};

/* ───────── 서비스 크레딧 목업 데이터 ───────── */
const MOCK_SERVICE_CREDITS: ServiceCreditItem[] = [
    {
        id: 9001,
        planName: '서비스',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        grantedAmount: 5000,
        usedAmount: 0,
        balance: 5000,
        expiredAmount: 0,
    },
    {
        id: 9002,
        planName: '서비스',
        startDate: '2026-05-19',
        endDate: '2026-06-30',
        grantedAmount: 5000,
        usedAmount: 0,
        balance: 5000,
        expiredAmount: 0,
    },
    {
        id: 9003,
        planName: '서비스',
        startDate: '2026-01-01',
        endDate: '2026-04-30',
        grantedAmount: 5000,
        usedAmount: 1000,
        balance: 4000,
        expiredAmount: 4000,
    },
];

/* ───────── 서비스 크레딧 등록 버튼 (헤더용) ───────── */
export function ServiceCreditButton({userId, onSuccess}: { userId: number | string; onSuccess?: () => void }) {
    const {addPopup} = usePopupStore();

    const handleOpenServiceCreditPopup = () => {
        addPopup(<ServiceCreditPopup userId={userId} onSuccess={onSuccess}/>);
    };

    return (
        <button type={'button'} className={'btn_service_credit'} onClick={handleOpenServiceCreditPopup}>
            크레딧 추가 지급
        </button>
    );
}

/* ───────── 서비스 크레딧 섹션 (리스트 + 수정/삭제/사용내역 핸들러) ───────── */
export function ServiceCreditSection({userId}: { userId: number | string }) {
    const {addPopup} = usePopupStore();

    const handleServiceUsagePopup = async (sc: ServiceCreditItem) => {
        const endpoint = `/api/admin/members/users/${userId}/service-credits/${sc.id}/transactions`;
        const res = await callApi(`${endpoint}?page=0&size=10`, {method: 'GET', credentials: 'include'});
        const initialData: TransactionsResponse = (res.result && res.data)
            ? res.data as TransactionsResponse
            : {content: [], totalElements: 0, totalPages: 1, currentPage: 0};
        addPopup(<CreditUsagePopup endpoint={endpoint} initialData={initialData}/>);
    };

    const handleDeleteServiceCredit = (sc: ServiceCreditItem) => {
        addPopup(<AlertComponent alertType={'confirm'} infoContent={'해당 플랜을 삭제하시겠습니까?'} callback={async () => {
            const res = await callApi(`/api/admin/members/users/${userId}/service-credits/${sc.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.result) {
                addPopup(<AlertComponent alertType={'alert'} infoContent={'삭제되었습니다.'}/>);
            } else {
                addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '삭제에 실패했습니다.'}/>);
            }
        }}/>);
    };

    const handleEditServiceCredit = () => {
        addPopup(<ServiceCreditPopup userId={userId}/>);
    };

    return (
        <>
            {MOCK_SERVICE_CREDITS.map(sc => (
                <div key={`sc-${sc.id}`} className={`plan_card service ${getServiceStatus(sc) === 'EXPIRED' ? 'expired' : ''}`}>
                    <ServicePlanCard
                        item={sc}
                        onEdit={canEditService(sc) ? () => handleEditServiceCredit() : undefined}
                        onDelete={canDeleteService(sc) ? () => handleDeleteServiceCredit(sc) : undefined}
                        onUsage={() => handleServiceUsagePopup(sc)}
                    />
                </div>
            ))}
        </>
    );
}

/* ───────── 서비스 크레딧 카드 ───────── */
export default function ServicePlanCard({item, onEdit, onDelete, onUsage}: {
    item: ServiceCreditItem;
    onEdit?: () => void;
    onDelete?: () => void;
    onUsage: () => void;
}) {
    const status = getServiceStatus(item);
    return (
        <div className={'service_card_row'}>
            <div className={'service_info_section'}>
                <span className={'label'}>플랜구분</span>
                <span className={'value'}>
                    {item.planName}
                    <span className={`plan_badge ${PLAN_STATUS_CLASS[status]}`}>{PLAN_STATUS_LABEL[status]}</span>
                </span>
            </div>
            <div className={'service_info_section period'}>
                <span className={'label'}>이용기간</span>
                <span className={'value'}>{formatDateDot(item.startDate)} ~ {formatDateDot(item.endDate)}</span>
            </div>
            <div className={'service_credit_section'}>
                <span className={'label'}>크레딧</span>
                <div className={'credit_values'}>
                    <span className={'credit_item'}>지급 <span className={'line'}/> <span>{formatNum(item.grantedAmount)}</span></span>
                    <span className={'credit_item'}>사용 <span className={'line'}/> <span>{formatNegated(item.usedAmount)}</span></span>
                    <span className={'credit_item'}>잔여 <span className={'line'}/> <span>{formatNum(item.balance)}</span></span>
                    {item.expiredAmount > 0 && (
                        <span className={'credit_item'}>소멸 <span className={'line'}/> <span>{formatNegated(item.expiredAmount)}</span></span>
                    )}
                    <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                </div>
            </div>
            {(onEdit || onDelete) && (
                <div className={'service_actions'}>
                    {onEdit && (
                        <button type={'button'} className={'btn_edit'} onClick={onEdit}>
                            <span className={'admin_icon icon_edit'}/>
                        </button>
                    )}
                    {onDelete && (
                        <button type={'button'} className={'btn_delete'} onClick={onDelete}>
                            <span className={'admin_icon icon_trash'}/>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
