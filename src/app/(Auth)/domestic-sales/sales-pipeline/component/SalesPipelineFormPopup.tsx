'use client';

import {useCallback, useEffect, useRef, useState} from "react";
import {usePopupStore} from "@/stores/common/popupStore";
import AlertComponent from "@/app/(Auth)/components/AlertComponent";
import callApi from "@/utill/apiRequest";

interface CustomerOption {
    id: number;
    name: string;
    bizNo: string;
    ceoName: string;
    sidoName: string | null;
    sigunguName: string | null;
    bizField: string | null;
}

interface Props {
    uId?: string;
    onSuccess?: () => void;
}

export default function SalesPipelineFormPopup({uId, onSuccess}: Props) {
    const {closePopup, addPopup} = usePopupStore();
    const [saving, setSaving] = useState(false);

    // 고객사 검색
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 자동표기 필드
    const [bizNo, setBizNo] = useState('');
    const [ceoName, setCeoName] = useState('');
    const [region, setRegion] = useState('');
    const [bizField, setBizField] = useState('');

    // 필수입력
    const [salesType, setSalesType] = useState('');
    const [manager, setManager] = useState('');

    // 고객사 검색 API
    const searchCustomers = useCallback(async (keyword: string) => {
        if (!keyword.trim()) {
            setCustomerResults([]);
            setShowDropdown(false);
            return;
        }
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('size', '20');
        params.set('keyword', keyword.trim());

        const res = await callApi(`/api/admin/sales/customers?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.result && res.data) {
            const list = (res.data as { content: CustomerOption[] }).content;
            setCustomerResults(list);
            setShowDropdown(list.length > 0);
        }
    }, []);

    // debounce 검색
    useEffect(() => {
        if (selectedCustomer) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchCustomers(customerQuery);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [customerQuery, searchCustomers, selectedCustomer]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelectCustomer = (c: CustomerOption) => {
        setSelectedCustomer(c);
        setCustomerQuery(c.name);
        setBizNo(c.bizNo);
        setCeoName(c.ceoName);
        setRegion([c.sidoName, c.sigunguName].filter(Boolean).join(' ') || '-');
        setBizField(c.bizField || '-');
        setShowDropdown(false);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer(null);
        setCustomerQuery('');
        setBizNo('');
        setCeoName('');
        setRegion('');
        setBizField('');
    };

    const handleSave = async () => {
        if (!selectedCustomer) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'고객사를 검색하여 선택해주세요.'}/>);
            return;
        }
        if (!salesType.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'영업유형을 입력해주세요.'}/>);
            return;
        }
        if (!manager.trim()) {
            addPopup(<AlertComponent alertType={'error'} infoContent={'영업담당자를 입력해주세요.'}/>);
            return;
        }

        setSaving(true);
        const payload = {
            customerId: selectedCustomer.id,
            salesGrade: 'CLIENT',
            salesType: salesType.trim(),
            salesManager: manager.trim(),
            activityContent: null,
        };
        const res = await callApi('/api/admin/sales/pipelines', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        setSaving(false);

        if (res.result) {
            addPopup(<AlertComponent alertType={'alert'} infoContent={'등록되었습니다.'}/>);
            closePopup(uId ?? '');
            onSuccess?.();
        } else {
            addPopup(<AlertComponent alertType={'alert'} infoContent={res.message || '등록에 실패했습니다.'}/>);
        }
    };

    return (
        <div className={'alertSection'}>
            <div className={'news_form_popup'}>
                <h4>신규영업 등록</h4>

                <div className={'popup_body'}>
                    {/* 고객사 검색 & 선택 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>고객사 <span className={'required'}>*</span></label>
                        <div className={'customer_search_wrap'} ref={dropdownRef}>
                            <input type="text" value={customerQuery}
                                   placeholder={'고객사명을 검색해주세요'}
                                   disabled={!!selectedCustomer}
                                   onChange={e => setCustomerQuery(e.target.value)}
                                   onFocus={() => { if (customerResults.length > 0 && !selectedCustomer) setShowDropdown(true); }}/>
                            {selectedCustomer && (
                                <button type="button" className={'btn_clear_customer'} onClick={handleClearCustomer}>&times;</button>
                            )}
                            {showDropdown && (
                                <ul className={'customer_dropdown'}>
                                    {customerResults.map(c => (
                                        <li key={c.id} onClick={() => handleSelectCustomer(c)}>
                                            <strong>{c.name}</strong>
                                            <span>{c.bizNo} / {c.ceoName}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* 자동표기 필드 */}
                    <div className={'popup_field'}>
                        <label className={'label_optional'}>사업자번호</label>
                        <input type="text" value={bizNo} disabled/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>대표자</label>
                        <input type="text" value={ceoName} disabled/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>소재지역</label>
                        <input type="text" value={region} disabled/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_optional'}>사업분야</label>
                        <input type="text" value={bizField} disabled/>
                    </div>

                    {/* 필수입력 */}
                    <div className={'popup_field'}>
                        <label className={'label_required'}>영업유형 <span className={'required'}>*</span></label>
                        <input type="text" value={salesType}
                               placeholder={'영업유형을 입력해주세요'}
                               onChange={e => setSalesType(e.target.value)}/>
                    </div>

                    <div className={'popup_field'}>
                        <label className={'label_required'}>영업담당자 <span className={'required'}>*</span></label>
                        <input type="text" value={manager}
                               placeholder={'영업담당자를 입력해주세요'}
                               onChange={e => setManager(e.target.value)}/>
                    </div>
                </div>

                <div className={'popup_btn_wrap'}>
                    <button type={'button'} className={'cancel_btn'} disabled={saving}
                            onClick={() => closePopup(uId ?? '')}>취소</button>
                    <button type={'button'} className={'save_btn'} disabled={saving} onClick={handleSave}>
                        {saving ? '저장 중...' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
}
