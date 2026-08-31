'use client';

import Link from "next/link";
import {useCallback, useEffect, useState} from "react";
import {formatDateDot} from "@/utill/format";
import callApi from "@/utill/apiRequest";
import MemberListV2 from "@/app/(Auth)/partner-management/[id]/user-list/component/MemberListV2";
import CompanyActivityList from "@/app/(Auth)/partner-management/[id]/user-list/component/CompanyActivityList";

interface CoalitionDetailApiRow {
    id: number;
    partnerName: string;
    partnerKey: string;
    bonusCredit: number;
    startDate: string;
    endDate: string;
    createdAt: string;
    requiresApproval?: boolean;
}

interface PartnerInfo {
    partnerName: string;
    partnerKey: string;
    creditAmount: number;
    startDate: string;
    endDate: string;
    requiresApproval: boolean;
}

const mapToPartnerInfo = (row: CoalitionDetailApiRow): PartnerInfo => ({
    partnerName: row.partnerName,
    partnerKey: row.partnerKey,
    creditAmount: row.bonusCredit,
    startDate: row.startDate,
    endDate: row.endDate,
    requiresApproval: row.requiresApproval ?? false,
});

interface Props {
    partnerId: string;
    /** 상단 표기 (협회제휴관리 / PoC 관리) */
    title?: string;
    /** "목록으로" 가 돌아갈 목록 라우트 */
    basePath?: string;
}

export default function UserListPage({partnerId, title = '협회제휴관리', basePath = '/partner-management'}: Props) {
    const [partner, setPartner] = useState<PartnerInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'members' | 'activity'>('members');

    const fetchPartner = useCallback(async () => {
        const res = await callApi(`/api/admin/partner-keys/${partnerId}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res.result && res.data) {
            setPartner(mapToPartnerInfo(res.data as unknown as CoalitionDetailApiRow));
        }
    }, [partnerId]);

    useEffect(() => {
        fetchPartner();
    }, [fetchPartner]);

    return (
        <div className={'admin_page partner_page'}>
            <div className={'page_start_box'}>
                <h2>{title}</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={basePath}>{title}</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>가입명단</li>
                </ul>
            </div>

            {/* 제휴 정보 영역 — 목록으로 버튼을 같은 줄 우측에 둔다.
                제휴 조회에 실패해도 목록으로는 남아야 하므로 바 자체는 항상 렌더한다. */}
            <div className={'partner_info_bar'}>
                <div className={'info_row'}>
                    {partner && <>
                        <div className={'info_field'}>
                            <label>제휴명</label>
                            <span>{partner.partnerName}</span>
                        </div>
                        <div className={'info_field'}>
                            <label>회원가입도메인</label>
                            <span>www.tradeit.co.kr/partner/{partner.partnerKey}</span>
                            <a className={'btn_site_link'}
                               href={`https://www.tradeit.co.kr/partner/${partner.partnerKey}`}
                               target="_blank" rel="noopener noreferrer">
                                사이트 바로가기 ↗
                            </a>
                        </div>
                        <div className={'info_field'}>
                            <label>보너스 크레딧</label>
                            <span>{partner.creditAmount} %</span>
                        </div>
                        <div className={'info_field'}>
                            <label>가입혜택기간</label>
                            <span>{formatDateDot(partner.startDate)}</span>
                            <span className={'date_tilde'}>-</span>
                            <span>{formatDateDot(partner.endDate)}</span>
                        </div>
                    </>}
                    <Link href={basePath} className={'list_button info_row_list_button'}>목록으로</Link>
                </div>
            </div>

            {/* 콘텐츠 카드 (CRM 제휴 성과 대시보드와 동일 구성) */}
            <div className={'v2_card'}>
                {/* 탭 */}
                <div className={'v2_tab_bar'}>
                    <button
                        type="button"
                        className={`v2_tab ${activeTab === 'members' ? 'on' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        가입명단관리
                    </button>
                    <button
                        type="button"
                        className={`v2_tab ${activeTab === 'activity' ? 'on' : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        기업별 활동현황
                    </button>
                </div>

                {/* 탭 콘텐츠 — 제휴 정보 로드 후에만 렌더 */}
                <div className={`v2_tab_content ${activeTab !== 'members' ? 'v2_tab_content_round_left' : ''}`}>
                    {partner && activeTab === 'members' && <MemberListV2
                        partnerId={partnerId}
                        basePath={basePath}
                    />}
                    {partner && activeTab === 'activity' && <CompanyActivityList
                        partnerId={partnerId}
                        basePath={basePath}
                    />}
                </div>
            </div>
        </div>
    );
}
