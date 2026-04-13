'use client'

export default function TrialCreateForm() {
    return (
        <div className={'client_create_form trial_create_form'}>
            <div className={'form_row'}>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 관련프로그램</label>
                    <div className={'input_wrap'}>
                        <input type="text" autoComplete="off" placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 도메인</label>
                    <div className={'input_wrap domain_wrap'}>
                        <span className={'domain_prefix'}>www.tradeit.co.kr / </span>
                        <input type="text" autoComplete="off" placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 크레딧</label>
                    <div className={'input_wrap'}>
                        <input type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off"
                               onInput={e => { e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, ''); }}
                               placeholder={''}/>
                    </div>
                </div>
                <div className={'form_field'}>
                    <label><span className={'required'}>*</span> 운영기간</label>
                    <div className={'input_wrap date_range_wrap'}>
                        <input type="date"/>
                        <span className={'date_tilde'}>-</span>
                        <input type="date"/>
                    </div>
                </div>
            </div>
            <div className={'form_actions'}>
                <button type="button" className={'btn_create'}>등록</button>
                <button type="button" className={'btn_reset'}>초기화</button>
            </div>
        </div>
    );
}
