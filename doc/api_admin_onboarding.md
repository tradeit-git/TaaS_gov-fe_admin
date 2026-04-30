# Admin Onboarding Session API 명세

**Base URL:** `http://localhost:2001/api/admin/onboarding-sessions`
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/onboarding-sessions` | 온보딩 세션 목록 조회 (페이징 + 키워드 검색) |
| `GET` | `/api/admin/onboarding-sessions/{id}` | 온보딩 세션 단건 조회 |
| `GET` | `/api/admin/onboarding-sessions/check-duplicate` | 일시·URL 중복 체크 |
| `GET` | `/api/admin/onboarding-sessions/hosts` | 진행자 후보(MS팀/MM팀) 목록 |
| `POST` | `/api/admin/onboarding-sessions` | 온보딩 세션 등록 |
| `PUT` | `/api/admin/onboarding-sessions/{id}` | 온보딩 세션 수정 |
| `DELETE` | `/api/admin/onboarding-sessions/{id}` | 온보딩 세션 삭제 (soft delete) |

---

## 비즈니스 규칙

- **유니크 제약:** `sessionAt`(일시), `url`(접속 URL)은 각각 전역 유니크.
- **진행자 제한:** `admins.department` 가 `MS팀` 또는 `MM팀` 이고 `status = ACTIVE` 인 관리자만 진행자로 지정 가능.
- **상태(status):** DB 저장 컬럼이 아닌 **계산값**. 응답 시 현재 시간 기준으로 결정.
  - `sessionAt > now()` → `"예정"`
  - `sessionAt <= now()` → `"종료"`

---

## 1. 온보딩 세션 목록 조회

**`GET /api/admin/onboarding-sessions`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Query | `page` | Integer | X | `0` | 페이지 번호 (0부터 시작) |
| Query | `size` | Integer | X | `10` | 페이지당 항목 수 |
| Query | `keyword` | String | X | - | 진행자명(`admin.name`) 또는 URL 부분 일치 |

> 정렬: `sessionAt DESC`. soft delete된 행은 자동 제외.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "content": [
      {
        "id": 5,
        "sessionAt": "2026-04-30T14:00:00",
        "className": "산업별 실제 해외 바이어 발굴 실습 '화장품, 뷰티'",
        "url": "https://meet.tradeit.global/onb/stu901",
        "hostAdmin": {
          "id": 12,
          "loginId": "yangmj",
          "name": "양민지",
          "department": "MS팀",
          "position": "매니저",
          "email": "yangmj@tradeit.co.kr",
          "contact": "010-0000-0000"
        },
        "status": "예정",
        "createdAt": "2026-04-24T11:00:00",
        "updatedAt": "2026-04-24T11:00:00"
      }
    ],
    "totalElements": 12,
    "totalPages": 2,
    "currentPage": 0
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `content` | Array\<OnboardingSessionDTO\> | 세션 목록 (하단 DTO 참조) |
| `totalElements` | Long | 전체 건수 |
| `totalPages` | Integer | 전체 페이지 수 |
| `currentPage` | Integer | 현재 페이지 번호 (0-based) |

---

## 2. 온보딩 세션 단건 조회

**`GET /api/admin/onboarding-sessions/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 세션 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 5,
    "sessionAt": "2026-04-30T14:00:00",
    "className": "산업별 실제 해외 바이어 발굴 실습 '화장품, 뷰티'",
    "url": "https://meet.tradeit.global/onb/stu901",
    "hostAdmin": {
      "id": 12,
      "loginId": "yangmj",
      "name": "양민지",
      "department": "MS팀",
      "position": "매니저",
      "email": "yangmj@tradeit.co.kr",
      "contact": "010-0000-0000"
    },
    "status": "예정",
    "createdAt": "2026-04-24T11:00:00",
    "updatedAt": "2026-04-24T11:00:00"
  }
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "온보딩 세션을 찾을 수 없습니다."
}
```

---

## 3. 일시·URL 중복 체크

**`GET /api/admin/onboarding-sessions/check-duplicate`**

등록/수정 화면의 "중복체크" 버튼용. 전달된 파라미터에 대해서만 응답에 키가 포함됩니다.

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Query | `sessionAt` | String (ISO 8601 LocalDateTime) | X | 검사할 일시. 예: `2026-04-30T14:00:00` |
| Query | `url` | String | X | 검사할 접속 URL |
| Query | `excludeId` | Long | X | 수정 시 자기 자신을 제외하기 위한 세션 id |

> `sessionAt`, `url` 중 **최소 하나**는 전달되어야 의미가 있습니다 (둘 다 없으면 빈 객체 응답).

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "sessionAtDuplicated": false,
    "urlDuplicated": true
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `sessionAtDuplicated` | Boolean | 같은 `sessionAt` 으로 등록된 세션 존재 여부 (요청에 `sessionAt`이 있을 때만 포함) |
| `urlDuplicated` | Boolean | 같은 `url` 로 등록된 세션 존재 여부 (요청에 `url`이 있을 때만 포함) |

---

## 4. 진행자 후보 목록

**`GET /api/admin/onboarding-sessions/hosts`**

진행자 dropdown용. `admins.department IN ('MS팀','MM팀')` AND `status = ACTIVE` AND `deleted_at IS NULL` 만 반환. 이름(`name`) 오름차순.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": [
    {
      "id": 7,
      "loginId": "leehy",
      "name": "이한열",
      "department": "MS팀",
      "position": "매니저",
      "email": "leehy@tradeit.co.kr",
      "contact": "010-0000-0001"
    },
    {
      "id": 12,
      "loginId": "yangmj",
      "name": "양민지",
      "department": "MS팀",
      "position": "매니저",
      "email": "yangmj@tradeit.co.kr",
      "contact": "010-0000-0002"
    }
  ]
}
```

---

## 5. 온보딩 세션 등록

**`POST /api/admin/onboarding-sessions`**

### Request Body

```json
{
  "sessionAt": "2026-05-10T14:00:00",
  "className": "우리 제품의 실제 해외 바이어 찾기 '기본 실습'",
  "url": "https://meet.tradeit.global/onb/abc123",
  "hostAdminId": 7
}
```

| 필드 | 타입 | 필수 | 제약 | 설명 |
|------|------|------|------|------|
| `sessionAt` | String (ISO 8601 LocalDateTime) | O | 전역 유니크 | 세션 일시 |
| `className` | String | O | max 255 | 온보딩 클래스명 |
| `url` | String | O | max 500, 전역 유니크 | 접속 URL |
| `hostAdminId` | Long | O | MS팀/MM팀 admin | 진행자 admin id |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 13,
    "sessionAt": "2026-05-10T14:00:00",
    "className": "우리 제품의 실제 해외 바이어 찾기 '기본 실습'",
    "url": "https://meet.tradeit.global/onb/abc123",
    "hostAdmin": {
      "id": 7,
      "loginId": "leehy",
      "name": "이한열",
      "department": "MS팀",
      "position": "매니저",
      "email": "leehy@tradeit.co.kr",
      "contact": "010-0000-0001"
    },
    "status": "예정",
    "createdAt": "2026-04-30T15:30:00",
    "updatedAt": "2026-04-30T15:30:00"
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 message |
|------|------|------|
| `400` | 필수값 누락 또는 형식 오류 | Bean Validation 메시지 (예: "일시는 필수입니다.") |
| `400` | `hostAdminId`가 MS팀/MM팀 소속이 아님 | `"MS팀 또는 MM팀 소속만 진행자로 지정할 수 있습니다."` |
| `404` | 존재하지 않는 `hostAdminId` | `"진행자를 찾을 수 없습니다."` |
| `409` | 같은 `sessionAt` 중복 | `"이미 등록된 일시입니다."` |
| `409` | 같은 `url` 중복 | `"이미 등록된 접속 URL입니다."` |

---

## 6. 온보딩 세션 수정

**`PUT /api/admin/onboarding-sessions/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 세션 PK |
| Body | (등록과 동일) | - | O | `sessionAt`, `className`, `url`, `hostAdminId` |

### Request Body

```json
{
  "sessionAt": "2026-05-10T15:00:00",
  "className": "산업별 실제 해외 바이어 발굴 실습 '식품, K-Food'",
  "url": "https://meet.tradeit.global/onb/abc123",
  "hostAdminId": 12
}
```

> 일시·URL 중복 검사 시 자기 자신은 제외됩니다 (서비스 내부적으로 `excludeId = id` 적용).

### Response `200 OK`

수정된 세션의 전체 DTO를 반환. 응답 형식은 [5번 등록](#5-온보딩-세션-등록) 응답과 동일.

### Error Responses

| 상태 | 조건 |
|------|------|
| `400` | 필수값 누락, MS팀/MM팀 외 진행자 지정 |
| `404` | 존재하지 않거나 삭제된 세션 |
| `404` | 존재하지 않는 `hostAdminId` |
| `409` | `sessionAt` 또는 `url` 중복 (자기 자신 제외) |

---

## 7. 온보딩 세션 삭제

**`DELETE /api/admin/onboarding-sessions/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 세션 PK |

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
  "message": "온보딩 세션을 찾을 수 없습니다."
}
```

> soft delete 처리 (`deleted_at` 에 현재 시각 기록). 삭제된 세션은 목록·단건 조회에서 제외됩니다.

---

## OnboardingSessionDTO 필드 상세

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `id` | Long | N | PK (BIGINT UNSIGNED) |
| `sessionAt` | String (ISO 8601 LocalDateTime) | N | 세션 일시 (전역 유니크) |
| `className` | String | N | 온보딩 클래스명 (max 255) |
| `url` | String | N | 접속 URL (max 500, 전역 유니크) |
| `hostAdmin` | AdminDTO | N | 진행자 정보. `admins` 테이블 — MS팀/MM팀 한정 |
| `status` | String | N | 계산값. `"예정"` (sessionAt > now) / `"종료"` (sessionAt ≤ now) |
| `createdAt` | String (ISO 8601) | N | 생성일 |
| `updatedAt` | String (ISO 8601) | N | 최종 수정일 |

### AdminDTO (`hostAdmin`)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 관리자 PK |
| `loginId` | String | 로그인 ID |
| `name` | String | 이름 |
| `department` | String | 부서 (`MS팀` 또는 `MM팀`) |
| `position` | String | 직책 |
| `email` | String | 이메일 |
| `contact` | String | 연락처 |

---

## 공통 에러 응답 포맷

```json
{
  "status": 400,
  "code": "common.BAD_REQUEST",
  "message": "사람이 읽을 수 있는 한글 메시지"
}
```

| `code` | 의미 |
|------|------|
| `common.SUCCESS` | 정상 응답 |
| `common.NOT_FOUND` | 리소스 없음 |
| `common.DUPLICATED` | 일시 또는 URL 중복 |
| `common.BAD_REQUEST` | 입력 검증 실패 / 비즈니스 규칙 위반 |
