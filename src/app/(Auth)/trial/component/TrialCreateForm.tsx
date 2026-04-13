'use client'

export default function TrialCreateForm() {
    return (
        <div className={'client_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 고객사명</label>
                    <div className={'input_wrap'}>
                        <input type="text" autoComplete="off" placeholder={''}/>
                    </div>
                    <button type="button" className={'btn_check'}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 사업자번호</label>
                    <div className={'input_wrap'}>
                        <input type="text" autoComplete="off" placeholder={'000-00-00000'}/>
                    </div>
                    <button type="button" className={'btn_check'}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 아이디(E-mail)</label>
                    <div className={'input_wrap'}>
                        <input type="text" autoComplete="new-email" placeholder={''}/>
                    </div>
                    <button type="button" className={'btn_check'}>중복체크</button>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 패스워드</label>
                    <input type="password" autoComplete="new-password" placeholder={''}/>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'}>계정생성</button>
                <button type="button" className={'btn_reset'}>초기화</button>
            </div>
        </div>
    );
}
