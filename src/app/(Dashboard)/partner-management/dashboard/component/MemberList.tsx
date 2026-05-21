// 제휴 가입사 명단 목업 데이터
const memberList = [
    {no: 3, company: '이노베이션웍스', email: 'limsj14@daum.net', name: '서예린', position: '채널영업팀 과장', phone: '010-0000-0000', joinedAt: 'yyyy.mm.dd'},
    {no: 2, company: '비전데이터텍', email: 'ohdj55@naver.com', name: '오현우', position: '채널영업팀 과장', phone: '010-0000-0000', joinedAt: 'yyyy.mm.dd'},
    {no: 1, company: '코어링크그룹', email: 'songar20@gmail.com', name: '강민서', position: '채널영업팀 과장', phone: '010-0000-0000', joinedAt: 'yyyy.mm.dd'},
];

export default function MemberList() {
    return (
        <section className={'table_card'}>
            <div className={'section_head'}>
                <h2>제휴 가입사 명단</h2>
                <div className={'search_input_wrap'}>
                    <span className={'partner_dashboard_icon'}/>
                    <input type="text" placeholder={'회사명 검색'}/>
                </div>
            </div>
            <div className={'table_wrap'}>
                <table className={'dashboard_table'}>
                    <colgroup>
                        <col style={{width: '4%'}}/>
                        <col style={{width: '18%'}}/>
                        <col style={{width: '26%'}}/>
                        <col style={{width: '14%'}}/>
                        <col style={{width: '14%'}}/>
                        <col style={{width: '12%'}}/>
                        <col style={{width: '12%'}}/>
                    </colgroup>
                    <thead>
                    <tr>
                        <th>순번</th>
                        <th>회사명</th>
                        <th>ID(E-mail)</th>
                        <th>이름</th>
                        <th>부서&직함</th>
                        <th>전화번호</th>
                        <th>회원가입일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {memberList.map(m => (
                        <tr key={m.no}>
                            <td>{m.no}</td>
                            <td>{m.company}</td>
                            <td>{m.email}</td>
                            <td>{m.name}</td>
                            <td>{m.position}</td>
                            <td>{m.phone}</td>
                            <td>{m.joinedAt}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
