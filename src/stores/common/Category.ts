export type CategoryType = {
    value: string;
    upCode: string;
    code: string
}

export const Category = (value: string, upCode: string, code: string): CategoryType => {
    return {value, upCode, code} as CategoryType
}

export const 금속가공 = [
    Category("금속가공-금속가공", "금속가공", "금속가공",),
    Category("금속가공-금형", "금속가공", "금형",),
    Category("금속가공-단조", "금속가공", "단조",),
    Category("금속가공-도금", "금속가공", "도금",),
    Category("금속가공-분말야금", "금속가공", "분말야금",),
    Category("금속가공-열처리", "금속가공", "열처리",),
    Category("금속가공-주조_및_다이캐스팅", "금속가공", "주조 및<br>다이캐스팅",),
    Category("금속가공-기타금속가공", "금속가공", "기타금속가공",)
]

export const 기계및설비 = [
    Category("기계_및_설비-건설장비", "기계 및 설비", "건설장비",),
    Category("기계_및_설비-공작기계", "기계 및 설비", "공작기계",),
    Category("기계_및_설비-공조설비", "기계 및 설비", "공조설비",),
    Category("기계_및_설비-금속가공기계", "기계 및 설비", "금속가공기계",),
    Category("기계_및_설비-농기계", "기계 및 설비", "농기계",),
    Category("기계_및_설비-변압기", "기계 및 설비", "변압기",),
    Category("기계_및_설비-보일러", "기계 및 설비", "보일러",),
    Category("기계_및_설비-여과기", "기계 및 설비", "여과기",),
    Category("기계_및_설비-전기로_및_버너", "기계 및 설비", "전기로 및 버너",),
    Category("기계_및_설비-제조기계_및_설비", "기계 및 설비", "제조기계 및<br/>설비",),
    Category("기계_및_설비-기타_기계_및_설비", "기계 및 설비", "기타 기계 및<br/>설비",),
] as CategoryType[];


export const 부품 = [
    Category("부품-베어링", "부품", "베어링"),
    Category("부품-엔진_및_터빈", "부품", "엔진 및 터빈"),
    Category("부품-유압기기", "부품", "유압기기"),
    Category("부품-자동차_부품", "부품", "자동차 부품"),
    Category("부품-기타_부품", "부품", "기타 부품"),
] as CategoryType[];


export const 섬유 = [
    Category("섬유-섬유가공", "섬유", "섬유가공"),
    Category("섬유-섬유기계", "섬유", "섬유기계"),
    Category("섬유-섬유플랜트", "섬유", "섬유플랜트"),
    Category("섬유-원단", "섬유", "원단"),
    Category("섬유-기타_섬유제품", "섬유", "기타 섬유제품"),
] as CategoryType[];

export const 소재 = [
    Category("소재-광업", "소재", "광업"),
    Category("소재-비금속광물", "소재", "비금속광물"),
    Category("소재-세라믹", "소재", "세라믹"),
    Category("소재-시멘트", "소재", "시멘트"),
    Category("소재-유리", "소재", "유리"),
    Category("소재-탄소섬유", "소재", "탄소섬유"),
    Category("소재-합성고무", "소재", "합성고무"),
    Category("소재-기타_소재", "소재", "기타 소재"),
] as CategoryType[];

export const 운송기계 = [
    Category("운송기계-조선", "운송기계", "조선"),
    Category("운송기계-조선기자재", "운송기계", "조선기자재"),
    Category("운송기계-철도_장비_및_부품", "운송기계", "철도 장비 및<br/>부품"),
    Category("운송기계-항공우주_부품", "운송기계", "항공우주 부품"),
    Category("운송기계-기타_운송기계", "운송기계", "기타 운송기계"),
] as CategoryType[];

export const 전기전자 = [
    Category("전기전자-반도체", "전기전자", "반도체"),
    Category("전기전자-밧데리", "전기전자", "밧데리"),
    Category("전기전자-에너지_저장장치_ESS", "전기전자", "에너지<br/>저장장치 ESS"),
    Category("전기전자-전기제어", "전기전자", "전기제어"),
    Category("전기전자-전자기기_및_부품", "전기전자", "전자기기 및<br/>부품"),
    Category("전기전자-정밀제어장치", "전기전자", "정밀제어장치"),
    Category("전기전자-케이블", "전기전자", "케이블"),
    Category("전기전자-기타_전기전자", "전기전자", "기타 전기전자"),
] as CategoryType[];

export const 철강금속 = [
    Category("철강금속-동", "철강금속", "동"),
    Category("철강금속-배관자재", "철강금속", "배관자재"),
    Category("철강금속-비철금속", "철강금속", "비철금속"),
    Category("철강금속-선재", "철강금속", "선재"),
    Category("철강금속-아연", "철강금속", "아연"),
    Category("철강금속-알루미늄", "철강금속", "알루미늄"),
    Category("철강금속-압연_및_압출", "철강금속", "압연 및 압출"),
    Category("철강금속-제철_및_제강", "철강금속", "제철 및 제강"),
    Category("철강금속-기타_철강금속", "철강금속", "기타 철강금속"),
] as CategoryType[];

export const 화장품 = [
    Category("화장품-메이크업", "화장품", "메이크업"),
    Category("화장품-미용기기", "화장품", "미용기기"),
    Category("화장품-스킨케어", "화장품", "스킨케어"),
    Category("화장품-의료용_화장품", "화장품", "의료용 화장품"),
    Category("화장품-기타_화장품", "화장품", "기타 화장품"),
] as CategoryType[];

export const 화학 = [
    Category("화학-고무", "화학", "고무"),
    Category("화학-석유화학", "화학", "석유화학"),
    Category("화학-타이어", "화학", "타이어"),
    Category("화학-페인트", "화학", "페인트"),
    Category("화학-플라스틱", "화학", "플라스틱"),
    Category("화학-플라스틱_사출", "화학", "플라스틱 사출"),
    Category("화학-화학비료", "화학", "화학비료"),
    Category("화학-화학섬유", "화학", "화학섬유"),
    Category("화학-기타_화학제품", "화학", "기타 화학제품"),
] as CategoryType[];

export const 기타 = [
    Category("기타-방산제품", "기타", "방산제품",),
    Category("기타-산업용_로봇", "기타", "산업용 로봇"),
    Category("기타-의료용_기기", "기타", "의료용 기기"),
    Category("기타-그외_기타", "기타", "그외기타"),
] as CategoryType[];

export const categories = [...기계및설비, ...철강금속, ...화학, ...금속가공, ...전기전자, ...소재, ...부품, ...섬유, ...운송기계, ...화장품, ...기타]

export const categoryGroups = [
    {title: "기계&설비", upCode: "", icon: "01", data: 기계및설비},
    {title: "철강금속", upCode: "철강금속", icon: "02", data: 철강금속},
    {title: "화학", upCode: "화학", icon: "03", data: 화학},
    {title: "금속가공", upCode: "", icon: "04", data: 금속가공},
    {title: "전기전자", upCode: "", icon: "05", data: 전기전자},
    {title: "소재", upCode: "", icon: "06", data: 소재},
    {title: "부품", upCode: "", icon: "07", data: 부품},
    {title: "섬유", upCode: "", icon: "08", data: 섬유},
    {title: "운송기계", upCode: "", icon: "09", data: 운송기계},
    {title: "화장품", upCode: "화장품", icon: "10", data: 화장품},
    {title: "기타", upCode: "기타", icon: "11", data: 기타},
];
