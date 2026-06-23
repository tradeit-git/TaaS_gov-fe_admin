'use client';

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useState} from "react";
import {formatDateDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

export interface PartnerUser {
    id: number;
    companyName: string;
    loginId: string;
    name: string;
    department: string;
    position: string;
    phone: string;
    createdAt: string;
    isPartnerMember: boolean;
}

interface CoalitionUserApiRow {
    id: number;
    companyName: string;
    loginId: string;
    name: string;
    department: string;
    position: string;
    contact: string;
    createdAt: string;
    isPartnerMember: boolean | null;   // 제휴회원사 여부(체크박스로 가입한 실제 제휴사)
}

interface CoalitionDetailApiRow {
    id: number;
    partnerName: string;
    partnerKey: string;
    bonusCredit: number;
    startDate: string;
    endDate: string;
    createdAt: string;
}

interface PartnerInfo {
    partnerName: string;
    partnerKey: string;
    creditAmount: number;
    startDate: string;
    endDate: string;
}

const mapToPartnerUser = (row: CoalitionUserApiRow): PartnerUser => ({
    id: row.id,
    companyName: row.companyName,
    loginId: row.loginId,
    name: row.name,
    department: row.department,
    position: row.position,
    phone: row.contact,
    createdAt: row.createdAt,
    isPartnerMember: row.isPartnerMember ?? false,
});

const mapToPartnerInfo = (row: CoalitionDetailApiRow): PartnerInfo => ({
    partnerName: row.partnerName,
    partnerKey: row.partnerKey,
    creditAmount: row.bonusCredit,
    startDate: row.startDate,
    endDate: row.endDate,
});

interface Props {
    partnerId: string;
}

export default function UserListPage({partnerId}: Props) {
    const router = useRouter();
    const {addPopup} = usePopupStore();
    const [partner, setPartner] = useState<PartnerInfo | null>(null);
    const [data, setData] = useState<PartnerUser[]>([]);

    const fetchPartner = useCallback(async () => {
        const res = await callApi(`/api/admin/partner-keys/${partnerId}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res.result && res.data) {
            setPartner(mapToPartnerInfo(res.data as CoalitionDetailApiRow));
        }
    }, [partnerId]);

    const fetchUsers = useCallback(async () => {
        const res = await callApi(`/api/admin/partner-keys/${partnerId}/users`, {
            method: 'GET',
            credentials: 'include',
        });

        if (res.result && res.data) {
            const rows = res.data as CoalitionUserApiRow[];
            setData(rows.map(mapToPartnerUser));
        } else {
            addPopup(<AlertComponent alertType={'error'} infoContent={res.message || '데이터를 불러오지 못했습니다.'}/>);
        }
    }, [partnerId]);

    useEffect(() => {
        fetchPartner();
        fetchUsers();
    }, [fetchPartner, fetchUsers]);

    const handleExcelDownload = async () => {
        try {
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
            const res = await fetch(`${basePath}/api/admin/partner-keys/excelDownload/${partnerId}`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!res.ok) {
                addPopup(<AlertComponent alertType={'error'} infoContent={'다운로드에 실패했습니다.'}/>);
                return;
            }

            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition');
            let fileName = '협회제휴관리_가입명단.xlsx';
            if (disposition) {
                const match = disposition.match(/filename\*=UTF-8''(.+)/);
                if (match) fileName = decodeURIComponent(match[1]);
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            addPopup(<AlertComponent alertType={'error'} infoContent={'다운로드에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'admin_page partner_page'}>
            <div className={'page_start_box'}>
                <h2>협회제휴관리</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/partner-management'}>협회제휴관리</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>가입명단</li>
                </ul>
            </div>

            {/* 제휴 정보 영역 */}
            {partner && <div className={'partner_info_bar'}>
                <div className={'info_row'}>
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
                </div>
            </div>}

            {/* 검색 / 카운트 영역 */}
            <div className={'list_header'}>
                <p className={'result_count'}>Showing {data.length} of {data.length} results</p>
                <div className={'search_area'}>
                    <button type="button" className={'btn_excel_download'} onClick={handleExcelDownload}>
                        명단 다운로드
                    </button>
                </div>
            </div>

            {/* 테이블 */}
            <div className={'table_wrap'}>
                <table className={'client_table partner_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '18%'}}/>
                        <col style={{width: '15%'}}/>
                        <col style={{width: '13%'}}/>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '12%'}}/>
                        <col style={{width: '11%'}}/>
                        <col style={{width: '11%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th style={{textAlign: 'center'}}>순번</th>
                        <th style={{textAlign: 'center'}}>제휴회원사</th>
                        <th>ID(e-mail)</th>
                        <th>회사명</th>
                        <th>부서&직함</th>
                        <th>이름</th>
                        <th>전화번호</th>
                        <th>회원가입일</th>
                        <th>상세보기</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((row, i) => (
                        <tr key={row.id}>
                            <td style={{textAlign: 'center'}}>{data.length - i}</td>
                            <td style={{textAlign: 'center'}}>{row.isPartnerMember ? 'O' : 'X'}</td>
                            <td>{row.loginId}</td>
                            <td>{row.companyName}</td>
                            <td>{row.department} {row.position}</td>
                            <td>{row.name}</td>
                            <td>{row.phone}</td>
                            <td>{formatDateDot(row.createdAt)}</td>
                            <td className={'td_actions'}>
                                <button type="button" className={'btn_detail'}
                                        onClick={() => router.push(`/partner-management/${partnerId}/user-list/${row.id}`)}>
                                    상세보기
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className={'table_bottom_button_wrap'}>
                <Link href={'/partner-management'} className={'list_button'}>목록으로</Link>
            </div>
        </div>
    );
}
