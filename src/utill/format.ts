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