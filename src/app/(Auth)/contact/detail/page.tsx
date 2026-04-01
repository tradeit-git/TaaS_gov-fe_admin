import Link from "next/link";

const formList = [
    { label: '고객사명', required: true, hasButton: true, value: '트레이드잇' },
    { label: '사업자번호', required: true, hasButton: true, value: '000-00-00000' },
    { label: '아이디(e-mail)', required: true, readOnly: true, value: 'asdfasdfasfd@gmail.com' },
    { label: '패스워드', required: true, value: 'tradeit21@' },
    { label: '계정생성일', readOnly: true, value: '2026.04.01' },
];

export default function Page() {
    return (
        <div className={'admin_page'}>
            <div className={'page_start_box'}>
                <h2>상세</h2>
                <ul className={'breadcrumb'}>
                    <li>홈</li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li><Link href={'/client'}>고객관리</Link></li>
                    <li><span className={'admin_icon icon_next'}/></li>
                    <li>상세</li>
                </ul>
            </div>
            <div className={'detail_contents'}>
                <section className={'account_info'}>
                    <div className={'title'}>
                        <div>
                            <span className={'k_admin_icon'}/>
                            계정정보
                        </div>
                    </div>
                    <ul className={'form_list'}>
                        {formList.map((item, index) => (
                            <li key={index} className={'form_item'}>
                                <p className={'form_label'}>
                                    {item.label} {item.required && <span>*</span>}
                                </p>
                                {item.hasButton ? (
                                    <div className={'input_wrap'}>
                                        <input type="text" defaultValue={item.value}/>
                                        <button type={'button'}>중복체크</button>
                                    </div>
                                ) : (
                                    <input type="text" readOnly={item.readOnly} defaultValue={item.value}/>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
                <div className={'btn_wrap'}>
                    <Link href="/contact" className={'cancel_btn'}>취소</Link>
                    <button className={'save_btn'}>저장</button>
                </div>
            </div>
        </div>
    )
}