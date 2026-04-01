import Link from "next/link";
import '@/style/contact.scss'


type FormItem =
    | { label: string; type: 'phone'; values: string[] }
    | { label: string; type: 'email'; values: string[] }
    | { label: string; type: 'textarea'; value: string }
    | { label: string; type: 'select'; value: string; options: string[] }
    | { label: string; value: string; readOnly?: boolean };

const formList: FormItem[] = [
    { label: '소속(기업/기관)', value: '트레이드잇' },
    { label: '이름',  value: '문성용' },
    { label: '부서',  value: '해외영업' },
    { label: '직함',  value: '대표' },
    { label: '전화번호', type: 'phone', values: ['02', '1234', '5678'] },
    { label: '휴대전화', type: 'phone', values: ['010', '1234', '5678'] },
    { label: '이메일', type: 'email', values: ['tradeit21', 'gmail.com'] },
    { label: '접수일', readOnly: true, value: '2026.04.01' },
    { label: '문의내용', type: 'textarea', value: '고객이 작성한 메모' },
    { label: '상태', type: 'select', value: '접수', options: ['접수', '처리중', '완료'] },
];

export default function Page() {
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/client'}>도입문의</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>
            <div className={'detail_contents contact'}>
                <section className={'account_info'}>
                    <ul className={'form_list'}>
                        {formList.map((item, index) => (
                            <li key={index} className={'form_item'}>
                                <p className={'form_label'}>
                                    {item.label}
                                </p>
                                {'type' in item && item.type === 'phone' ? (
                                    <div className={'multi_input_wrap'}>
                                        <input type="text" defaultValue={(item as {values: string[]}).values[0]}/>
                                        <input type="text" defaultValue={(item as {values: string[]}).values[1]}/>
                                        <input type="text" defaultValue={(item as {values: string[]}).values[2]}/>
                                    </div>
                                ) : 'type' in item && item.type === 'email' ? (
                                    <div className={'multi_input_wrap'}>
                                        <input type="text" defaultValue={(item as {values: string[]}).values[0]}/>
                                        <span className={'separator'}>@</span>
                                        <input type="text" defaultValue={(item as {values: string[]}).values[1]}/>
                                    </div>
                                ) : 'type' in item && item.type === 'textarea' ? (
                                        <textarea></textarea>
                                ) : 'type' in item && item.type === 'select' ? (
                                    <select defaultValue={(item as {value: string}).value}>
                                        {(item as {options: string[]}).options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type="text" readOnly={('readOnly' in item && item.readOnly) || false} defaultValue={'value' in item ? item.value : ''}/>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className={'form_item memo'}>
                        <p className={'form_label'}>
                            담당자 메모
                        </p>
                        <textarea/>
                    </div>
                </section>
                <div className={'btn_wrap'}>
                    <Link href="/contact" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'}>저장</button>
                </div>
            </div>
        </div>
    )
}