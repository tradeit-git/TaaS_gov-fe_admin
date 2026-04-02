# Admin Inquiry API 명세

**Base URL:** `http://localhost:2001/api/admin/inquiries`  
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/inquiries` | 문의 목록 조회 (페이징 + 필터) |
| `GET` | `/api/admin/inquiries/{id}` | 문의 상세 조회 (자동 열람 처리) |
| `POST` | `/api/admin/inquiries/{id}/status` | 처리 상태 변경 |
| `POST` | `/api/admin/inquiries/{id}/memo` | 관리자 메모 수정 |
| `DELETE` | `/api/admin/inquiries/{id}` | 문의 삭제 (soft delete) |

---

## 1. 문의 목록 조회

**`GET /api/admin/inquiries`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Query | `page` | Integer | X | `0` | 페이지 번호 (0부터 시작) |
| Query | `size` | Integer | X | `20` | 페이지당 항목 수 |
| Query | `status` | String | X | - | 처리 상태 필터. `PENDING` \| `IN_PROGRESS` \| `COMPLETED` |
| Query | `isRead` | Boolean | X | - | 열람 여부 필터. `true` \| `false` |
| Query | `keyword` | String | X | - | 키워드 검색 (회사명 대상, 부분 일치) |

> **필터 조합:** `status`, `isRead`, `keyword` 모두 동시 사용 가능합니다. 모든 조건은 AND로 결합됩니다.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "content": [
      {
        "id": 1,
        "companyName": "트레이드잇",
        "name": "홍길동",
        "department": "기획팀",
        "position": "팀장",
        "phone": "02-1234-5678",
        "mobile": "010-1234-5678",
        "email": "hong@tradeit.co.kr",
        "content": "도입 관련 문의드립니다.",
        "ip": "192.168.0.1",
        "privacyAgreed": true,
        "adminMemo": null,
        "status": "PENDING",
        "isRead": false,
        "readAt": null,
        "readByAdminId": null,
        "createdAt": "2026-03-31T17:00:00",
        "updatedAt": "2026-03-31T17:00:00"
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0,
    "unreadCount": 12
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `content` | Array\<InquiryDTO\> | 문의 목록 (하단 InquiryDTO 참조) |
| `totalElements` | Long | 전체 문의 수 |
| `totalPages` | Integer | 전체 페이지 수 |
| `currentPage` | Integer | 현재 페이지 번호 (0-based) |
| `unreadCount` | Long | 미열람 문의 총 건수 (필터 무관, 전체 기준) |

---

## 2. 문의 상세 조회

**`GET /api/admin/inquiries/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 문의 PK |

### 비즈니스 로직

- 최초 열람 시 자동으로 열람 처리됨 (`isRead` → `true`, `readAt` 기록, `readByAdmin` 설정)
- 이미 열람된 문의는 기존 열람 정보 유지

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 1,
    "companyName": "트레이드잇",
    "name": "홍길동",
    "department": "기획팀",
    "position": "팀장",
    "phone": "02-1234-5678",
    "mobile": "010-1234-5678",
    "email": "hong@tradeit.co.kr",
    "content": "도입 관련 문의드립니다.",
    "ip": "192.168.0.1",
    "privacyAgreed": true,
    "adminMemo": "콜백 필요",
    "status": "PENDING",
    "isRead": true,
    "readAt": "2026-04-01T09:30:00",
    "readByAdminId": 5,
    "createdAt": "2026-03-31T17:00:00",
    "updatedAt": "2026-04-01T09:30:00"
  }
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "문의를 찾을 수 없습니다."
}
```

---

## 3. 문의 상태 변경

**`POST /api/admin/inquiries/{id}/status`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 문의 PK |
| Body | `status` | String | O | 변경할 상태 |

**`status` 가능한 값:**

| 값 | 설명 |
|----|------|
| `PENDING` | 대기 |
| `IN_PROGRESS` | 처리중 |
| `COMPLETED` | 처리완료 |

### Request Body

```json
{
  "status": "IN_PROGRESS"
}
```

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 1,
    "companyName": "트레이드잇",
    "name": "홍길동",
    "department": "기획팀",
    "position": "팀장",
    "phone": "02-1234-5678",
    "mobile": "010-1234-5678",
    "email": "hong@tradeit.co.kr",
    "content": "도입 관련 문의드립니다.",
    "ip": "192.168.0.1",
    "privacyAgreed": true,
    "adminMemo": null,
    "status": "IN_PROGRESS",
    "isRead": true,
    "readAt": "2026-04-01T09:30:00",
    "readByAdminId": 5,
    "createdAt": "2026-03-31T17:00:00",
    "updatedAt": "2026-04-01T10:00:00"
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `404` | 존재하지 않는 문의 ID | `{"status":404,"code":"common.NOT_FOUND","message":"문의를 찾을 수 없습니다."}` |
| `400` | 잘못된 status 값 (예: `"INVALID"`) | `IllegalArgumentException` — 유효하지 않은 enum 값 |

---

## 4. 관리자 메모 수정

**`POST /api/admin/inquiries/{id}/memo`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 문의 PK |
| Body | `adminMemo` | String | O | 관리자 메모 내용 (빈 문자열로 삭제 가능) |

### Request Body

```json
{
  "adminMemo": "4/2 오전 콜백 예정. 담당자: 김철수"
}
```

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 1,
    "companyName": "트레이드잇",
    "name": "홍길동",
    "department": "기획팀",
    "position": "팀장",
    "phone": "02-1234-5678",
    "mobile": "010-1234-5678",
    "email": "hong@tradeit.co.kr",
    "content": "도입 관련 문의드립니다.",
    "ip": "192.168.0.1",
    "privacyAgreed": true,
    "adminMemo": "4/2 오전 콜백 예정. 담당자: 김철수",
    "status": "IN_PROGRESS",
    "isRead": true,
    "readAt": "2026-04-01T09:30:00",
    "readByAdminId": 5,
    "createdAt": "2026-03-31T17:00:00",
    "updatedAt": "2026-04-01T10:15:00"
  }
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "문의를 찾을 수 없습니다."
}
```

---

## 5. 문의 삭제

**`DELETE /api/admin/inquiries/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 문의 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "문의를 찾을 수 없습니다."
}
```

common


crm admin common 


> soft delete 처리 (`deleted_at`에 현재 시간 기록). 삭제된 문의는 목록 조회에서 제외됩니다.

---

## InquiryDTO 필드 상세

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `id` | Long | N | PK (BIGINT UNSIGNED) |
| `companyName` | String | N | 소속 기업/기관명 (max 255) |
| `name` | String | N | 문의자 성함 (max 50) |
| `department` | String | N | 부서 (max 100) |
| `position` | String | N | 직함 (max 100) |
| `phone` | String | Y | 전화번호 (max 50) |
| `mobile` | String | N | 휴대폰 (max 50) |
| `email` | String | N | 이메일 (max 100) |
| `content` | String | N | 문의 내용 (TEXT) |
| `ip` | String | Y | 문의자 IP (max 50) |
| `privacyAgreed` | Boolean | N | 개인정보 수집 동의 여부 |
| `adminMemo` | String | Y | 관리자 메모 (TEXT) |
| `status` | String | N | 처리 상태 (`PENDING` / `IN_PROGRESS` / `COMPLETED`) |
| `isRead` | Boolean | N | 열람 여부 (기본: `false`) |
| `readAt` | String (ISO 8601) | Y | 열람 일시 (미열람 시 `null`) |
| `readByAdminId` | Long | Y | 열람한 관리자 ID (미열람 시 `null`) |
| `createdAt` | String (ISO 8601) | N | 문의 등록일 |
| `updatedAt` | String (ISO 8601) | N | 최종 수정일 |
