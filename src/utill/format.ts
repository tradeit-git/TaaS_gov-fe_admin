// 1. 상태값 및 가입방식 치환 맵
export const STATUS_LABELS: Record<string, string> = {
    "WITHDRAWN": "탈퇴",
    "INACTIVE": "비활성",
    "SUSPENDED": "정지",
    "ACTIVE": "활성화",
};

export const USER_TYPE_LABELS: Record<string | number, string> = {
    0: "기존회원",
    1: "신규회원",
};

// 2. 날짜 포맷 함수 (YYYY-MM-DD)
export const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

// 날짜 포맷 함수 (YYYY.MM.DD)
export const formatDateDot = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
};

// 3. (옵션) 상태값에 따른 텍스트 색상 반환 함수
export const getStatusColor = (status: string) => {
    switch (status) {
        case "WITHDRAWN": return "#ff4d4f"; // 빨강
        case "SUSPENDED": return "#faad14"; // 주황
        default: return "inherit";
    }
};

// 년.월.일 시:분 포맷 함수
export const formatDateTimeDot = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day} ${hours}:${minutes}`;
};

// 사업자번호 포맷 (숫자만 → 000-00-00000)
export const formatBusinessNumber = (value: string) => {
    const nums = value.replace(/[^0-9]/g, '').slice(0, 10);
    if (nums.length > 5) return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`;
    if (nums.length > 3) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return nums;
};

// 사업자번호 유효성 (000-00-00000)
export const isValidBusinessNumber = (value: string) => /^\d{3}-\d{2}-\d{5}$/.test(value);

// 이메일 유효성
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// 숫자 콤마 포맷
export const formatNumber = (value: string) => value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 년-월-일 시:분:초 포맷 함수
export const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};