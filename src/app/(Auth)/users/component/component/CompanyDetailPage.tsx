'use client';

import Link from "next/link";
import {useRef, useState} from "react";
import {formatDateDot, formatDateTimeDot} from "@/utill/format";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import OverseasPlanPopup from "@/app/(Auth)/users/component/component/OverseasPlanPopup";
import CreditUsagePopup from "@/app/(Auth)/users/component/component/CreditUsagePopup";

/* ───────── 타입 정의 ───────── */
export interface AccountInfo {
    id: number;
    affiliationName: string | null;
    loginId: string;
    password: string;
    name: string;
    phone: string;
    companyName: string;
    department: string | null;
    position: string | null;
    createdAt: string;
    lastLoginAt: string | null;
}

export interface CreditItem {
    id: number;
    status: 'completed' | 'in_progress' | 'scheduled';
    startDate: string;
    endDate: string;
    creditGrant: number | null;
    creditUsed: number | null;
    creditRemain: number | null;
}

export interface OverseasPlan {
    id: number;
    type: 'overseas';
    planName: string;
    status: 'active' | 'expired';
    contractStartDate: string;
    contractEndDate: string;
    contractAmount: string;
    contractMethod: string;
    contractDate: string | null;
    credits: CreditItem[];
}

export interface StandardPlan {
    id: number;
    type: 'standard';
    planName: string;
    status: 'active' | 'expired';
    usageStartDate: string;
    usageEndDate: string;
    paymentAmount: string;
    paymentMethod: string;
    paymentDate: string | null;
    creditSummary: {
        grant: number;
        used: number;
        remain: number;
        expired: number;
    };
}

export type PlanItem = OverseasPlan | StandardPlan;

export interface CompanyDetailData {
    account: AccountInfo;
    plans: PlanItem[];
}

interface Props {
    id: string;
    initialData: CompanyDetailData;
}

/* ───────── 상태 뱃지 ───────── */
const STATUS_LABEL: Record<string, string> = {
    active: '이용중',
    expired: '이용만료',
    completed: '완료',
    in_progress: '진행',
    scheduled: '예정',
};

const STATUS_CLASS: Record<string, string> = {
    active: 'badge_active',
    expired: 'badge_expired',
    completed: 'badge_completed',
    in_progress: 'badge_progress',
    scheduled: 'badge_scheduled',
};

/* ───────── 컴포넌트 ───────── */
export default function CompanyDetailPage({id, initialData}: Props) {
    const {addPopup} = usePopupStore();
    const {account, plans} = initialData;
    const [password, setPassword] = useState(account.password);
    const [visiblePlans, setVisiblePlans] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const planListRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
        // TODO: API 연동
        addPopup(<AlertComponent alertType={'alert'} infoContent={'저장되었습니다.'}/>);
    };

    const handleOpenUsagePopup = () => {
        addPopup(<CreditUsagePopup/>);
    };

    const handleOpenOverseasPlanPopup = () => {
        addPopup(<OverseasPlanPopup onSave={(data) => {
            // TODO: API 연동
            console.log('해외영업실행 플랜 등록:', data);
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
        }}/>);
    };

    const handleEditOverseasPlan = (plan: OverseasPlan) => {
        const formatNumberWithComma = (n: number) => n.toLocaleString();
        addPopup(<OverseasPlanPopup
            initialData={{
                contractStartDate: plan.contractStartDate,
                contractEndDate: plan.contractEndDate,
                contractAmount: plan.contractAmount.replace(/[^0-9]/g, '') ? formatNumberWithComma(parseInt(plan.contractAmount.replace(/[^0-9,]/g, '').replace(/,/g, ''))) : plan.contractAmount,
                contractMethod: plan.contractMethod,
                managerGA: '',
                managerTP: '',
                contractDate: plan.contractDate ?? '',
                creditStartDate: plan.credits.length > 0 ? plan.credits[0].startDate : '',
                monthlyCredit: plan.credits.length > 0 && plan.credits[0].creditGrant ? formatNumberWithComma(plan.credits[0].creditGrant) : '',
                credits: plan.credits.map((c, i) => ({
                    round: i + 1,
                    period: `${formatDateDot(c.startDate)} ~ ${formatDateDot(c.endDate)}`,
                    credit: c.creditGrant !== null ? formatNumberWithComma(c.creditGrant) : '',
                })),
            }}
            onSave={(data) => {
                // TODO: API 연동
                console.log('해외영업실행 플랜 수정:', data);
                addPopup(<AlertComponent alertType={'alert'} infoContent={'수정되었습니다.'}/>);
            }}
        />);
    };

    const formatNum = (n: number | null) => {
        if (n === null || n === undefined) return '-';
        return n.toLocaleString();
    };

    return (
        <div className={'admin_page company_detail_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/company-management'}>가입회원사</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>

            <div className={'company_detail_layout'}>
                {/* ── 왼쪽: 계정정보 ── */}
                <div className={'company_detail_left'}>
                    <div className={'section_title'}>
                        <span className={'admin_icon arrow_icon'}/>
                        계정정보
                    </div>

                    <ul className={'form_list'}>
                        <li className={'form_item'}>
                            <p className={'form_label'}>제휴가입</p>
                            <input type="text" readOnly disabled value={account.affiliationName || '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>아이디(e-mail)</p>
                            <input type="text" readOnly disabled value={account.loginId}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>패스워드</p>
                            <input type="text" value={password} onChange={e => setPassword(e.target.value)}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>이름</p>
                            <input type="text" readOnly disabled value={account.name}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>전화번호</p>
                            <input type="text" readOnly disabled value={account.phone}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>회사명</p>
                            <input type="text" readOnly disabled value={account.companyName}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>부서</p>
                            <input type="text" readOnly disabled value={account.department || '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>직함</p>
                            <input type="text" readOnly disabled value={account.position || '-'}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>회원가입일</p>
                            <input type="text" readOnly disabled value={formatDateDot(account.createdAt)}/>
                        </li>
                        <li className={'form_item'}>
                            <p className={'form_label'}>최근접속일</p>
                            <input type="text" readOnly disabled value={account.lastLoginAt ? formatDateDot(account.lastLoginAt) : '-'}/>
                        </li>
                    </ul>

                    <div className={'btn_wrap'}>
                        <Link href="/company-management" className={'cancel_btn'}>취소</Link>
                        <button className={'save_btn'} onClick={handleSave}>저장</button>
                    </div>
                </div>

                {/* ── 오른쪽: 플랜 상세정보 ── */}
                <div className={'company_detail_right'}>
                    <div className={'plan_header'}>
                        <div className={'section_title'}>
                            <span className={'admin_icon arrow_icon'}/>
                            플랜 상세정보
                        </div>
                        <button type={'button'} className={'btn_add_plan'} onClick={handleOpenOverseasPlanPopup}>
                            + 해외영업실행플랜 등록
                        </button>
                    </div>

                    <div ref={planListRef} className={`plan_list ${expanded ? 'expanded' : ''}`}>
                        {(expanded ? plans : plans.slice(0, visiblePlans)).map(plan => (
                            <div key={plan.id} className={`plan_card ${plan.type === 'overseas' ? 'overseas' : 'standard'} ${plan.status === 'expired' ? 'expired' : ''}`}>
                                {plan.type === 'overseas' ? (
                                    <OverseasPlanCard plan={plan} formatNum={formatNum} onUsage={handleOpenUsagePopup} onEdit={() => handleEditOverseasPlan(plan)}/>
                                ) : (
                                    <StandardPlanCard plan={plan} formatNum={formatNum} onUsage={handleOpenUsagePopup}/>
                                )}
                            </div>
                        ))}
                    </div>

                    {plans.length > visiblePlans && !expanded && (
                        <button type={'button'} className={'btn_more'} onClick={() => setExpanded(true)}>
                            <span className={'admin_icon more_icon'}/> 더보기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ───────── 해외영업 플랜 카드 ───────── */
function OverseasPlanCard({plan, formatNum, onUsage, onEdit}: { plan: OverseasPlan; formatNum: (n: number | null) => string; onUsage: () => void; onEdit: () => void }) {
    return (
        <>
            <div className={'plan_card_header'}>
                <div className={'plan_info_grid overseas_grid'}>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>플랜구분</span>
                        <span className={'value'}>
                            {plan.planName}
                            <span className={`plan_badge ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
                        </span>
                    </div>
                    <div className={'plan_info_item period'}>
                        <span className={'label'}>계약기간</span>
                        <span className={'value'}>{formatDateDot(plan.contractStartDate)} ~ {formatDateDot(plan.contractEndDate)}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약금액</span>
                        <span className={'value'}>{plan.contractAmount}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약방식</span>
                        <span className={'value'}>{plan.contractMethod}</span>
                    </div>
                    <div className={'plan_info_item'}>
                        <span className={'label'}>계약일자</span>
                        <span className={'value'}>{plan.contractDate ? formatDateDot(plan.contractDate) : '-'}</span>
                    </div>
                </div>
                {plan.status !== 'expired' && (
                    <button type={'button'} className={'btn_edit'} onClick={onEdit}>
                        <span className={'admin_icon icon_edit'}/>
                    </button>
                )}
            </div>

            <div className={'credit_table_wrap'}>
                <table style={{tableLayout: 'fixed', width: '100%'}}>
                    <colgroup>
                        <col style={{width: '8%'}}/>
                        <col style={{width: '25%'}}/>
                        <col style={{width: '17%'}}/>
                        <col style={{width: '17%'}}/>
                        <col style={{width: '17%'}}/>
                        <col style={{width: '11%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                    <th>이용상태</th>
                        <th>이용기간</th>
                        <th>크레딧 지급</th>
                        <th>크레딧 사용</th>
                        <th>크레딧 잔여</th>
                        <th>비고</th>
                    </tr>
                    </thead>
                    <tbody>
                    {plan.credits.map(credit => (
                        <tr key={credit.id} className={credit.status === 'completed' ? 'row_completed' : ''}>
                            <td>
                                <span className={`credit_status ${STATUS_CLASS[credit.status]}`}>
                                    {STATUS_LABEL[credit.status]}
                                </span>
                            </td>
                            <td>{formatDateDot(credit.startDate)} ~ {formatDateDot(credit.endDate)}</td>
                            <td>{formatNum(credit.creditGrant)}</td>
                            <td className={credit.creditUsed !== null && credit.creditUsed < 0 ? 'negative' : ''}>
                                {formatNum(credit.creditUsed)}
                            </td>
                            <td>{formatNum(credit.creditRemain)}</td>
                            <td>
                                <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ───────── 일반 플랜 카드 ───────── */
function StandardPlanCard({plan, formatNum, onUsage}: { plan: StandardPlan; formatNum: (n: number | null) => string; onUsage: () => void }) {
    return (
        <>
            <div className={'plan_info_grid standard_grid'}>
                <div className={'plan_info_item'}>
                    <span className={'label'}>플랜구분</span>
                    <span className={'value'}>
                        {plan.planName}
                        <span className={`plan_badge ${STATUS_CLASS[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
                    </span>
                </div>
                <div className={'plan_info_item period'}>
                    <span className={'label'}>이용기간</span>
                    <span className={'value'}>{formatDateDot(plan.usageStartDate)} ~ {formatDateDot(plan.usageEndDate)}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제금액</span>
                    <span className={'value'}>{plan.paymentAmount}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제방식</span>
                    <span className={'value'}>{plan.paymentMethod}</span>
                </div>
                <div className={'plan_info_item'}>
                    <span className={'label'}>결제일시</span>
                    <span className={'value'}>{plan.paymentDate ? formatDateTimeDot(plan.paymentDate) : '-'}</span>
                </div>
            </div>

            <div className={'credit_summary_row'}>
                <span className={'summary_label'}>크레딧</span>
                <div className={'summary_values'}>
                    <span className={'summary_item grant'}>지급 <span className={'line'}/> <span>{formatNum(plan.creditSummary.grant)}</span></span>
                    <span className={'summary_item used'}>사용 <span className={'line'}/> <span>{formatNum(plan.creditSummary.used)}</span></span>
                    <span className={'summary_item remain'}>잔여 <span className={'line'}/> <span>{formatNum(plan.creditSummary.remain)}</span></span>
                    <span className={'summary_item expired'}>소멸 <span className={'line'}/> <span>{formatNum(plan.creditSummary.expired)}</span></span>
                    <button type={'button'} className={'btn_usage'} onClick={onUsage}>사용내역</button>
                </div>
            </div>
        </>
    );
}