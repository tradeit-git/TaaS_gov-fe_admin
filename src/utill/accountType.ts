// 계정 타입(userType) 라벨 매핑
// 0 = 내부계정, 100 = 체험계정, 그 외(1:고객, 2:직접가입) = 가입회원사 계정
export const accountTypeLabel = (t: string | number | null | undefined): string => {
    if (t === null || t === undefined || String(t).trim() === '') return '-';
    const s = String(t).trim();
    if (s === '0') return '내부계정';
    if (s === '100') return '체험계정';
    return '가입회원사 계정';
};
