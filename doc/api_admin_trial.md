# Admin Trial Key API 명세

**Base URL:** `http://localhost:2001/api/admin/trial-keys`  
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/trial-keys` | 체험 키 목록 조회 |
| `POST` | `/api/admin/trial-keys` | 체험 키 생성 |
| `PUT` | `/api/admin/trial-keys/{id}` | 체험 키 수정 |
| `DELETE` | `/api/admin/trial-keys/{id}` | 체험 키 삭제 |
| `GET` | `/api/admin/trial-keys/{id}/users` | 체험 키로 가입한 기업 명단 |
| `PUT` | `/api/admin/trial-keys/{id}/users/{userId}` | 체험 가입 회원 정보 수정 |
| `DELETE` | `/api/admin/trial-keys/{id}/users/{userId}` | 체험 가입 회원 삭제 |

---

## 1. 체험 키 목록 조회

**`GET /api/admin/trial-keys`**

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": [
    {
      "id": 1,
      "trialKey": "TRIAL-2026-DEMO",
      "trialName": "2026년 4월 체험 프로모션",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "creditAmount": 50000,
      "maxUses": 100,
      "usedCount": 23,
      "createdAt": "2026-03-25T10:00:00"
    }
  ]
}
```

### Response Fields — `data[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | PK |
| `trialKey` | String | 체험 키 |
| `trialName` | String | 체험 명 |
| `startDate` | String (date) | 체험 시작일 |
| `endDate` | String (date) | 체험 종료일 |
| `creditAmount` | Integer | 지급 크레딧 |
| `maxUses` | Integer | 최대 사용 횟수 (`null`이면 무제한) |
| `usedCount` | Integer | 사용된 횟수 |
| `createdAt` | String (ISO 8601) | 생성일 |

---

## 2. 체험 키 생성

**`POST /api/admin/trial-keys`**

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `trialKey` | String | O | 체험 키 (고유값) |
| `trialName` | String | O | 체험 명 |
| `startDate` | String (date) | O | 체험 시작일 |
| `endDate` | String (date) | O | 체험 종료일 |
| `creditAmount` | Integer | O | 지급 크레딧 |
| `maxUses` | Integer | X | 최대 사용 횟수 (`null`이면 무제한) |

```json
{
  "trialKey": "TRIAL-2026-DEMO",
  "trialName": "2026년 4월 체험 프로모션",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "creditAmount": 50000,
  "maxUses": 100
}
```

### Response `200 OK`

생성된 체험 키 엔티티 반환 (목록 조회와 동일한 구조)

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `409` | `common.CONFLICT` | 이미 존재하는 체험 키 |

---

## 3. 체험 키 수정

**`PUT /api/admin/trial-keys/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 체험 키 PK |

### Request Body

생성과 동일한 구조

### Response `200 OK`

수정된 체험 키 엔티티 반환

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `404` | `common.NOT_FOUND` | 존재하지 않는 체험 키 |

---

## 4. 체험 키 삭제

**`DELETE /api/admin/trial-keys/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 체험 키 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null
}
```

> soft delete 처리

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `404` | `common.NOT_FOUND` | 존재하지 않는 체험 키 |

---

## 5. 체험 키로 가입한 기업 명단

**`GET /api/admin/trial-keys/{id}/users`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 체험 키 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": [
    {
      "id": 10,
      "loginId": "user@example.com",
      "name": "홍길동",
      "companyName": "테스트기업",
      "contact": "010-1234-5678",
      "status": "ACTIVE",
      "createdAt": "2026-04-05T14:30:00"
    },
    {
      "id": 11,
      "loginId": "demo@company.com",
      "name": "김철수",
      "companyName": "데모기업",
      "contact": "010-9876-5432",
      "status": "TRIAL_EXPIRED",
      "createdAt": "2026-04-03T09:00:00"
    }
  ]
}
```

### Response Fields — `data[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 회원 PK |
| `loginId` | String | 아이디 (E-mail) |
| `name` | String | 이름 |
| `companyName` | String | 회사명 |
| `contact` | String | 연락처 |
| `status` | String | 상태 (`ACTIVE`: 사용중, `TRIAL_EXPIRED`: 체험 만료) |
| `createdAt` | String (ISO 8601) | 가입일 |

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `404` | `common.NOT_FOUND` | 존재하지 않는 체험 키 |

---

## 6. 체험 가입 회원 정보 수정

**`PUT /api/admin/trial-keys/{id}/users/{userId}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 체험 키 PK |
| Path | `userId` | Long | O | 회원 PK |

### Request Body

변경할 필드만 전달 (partial update)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `companyName` | String | X | 기업명 |
| `loginId` | String | X | 아이디 (E-mail, 변경 시 중복 체크) |
| `name` | String | X | 담당자명 |
| `contact` | String | X | 연락처 |

```json
{
  "companyName": "변경기업명",
  "loginId": "new@email.com",
  "name": "홍길동",
  "contact": "010-1234-5678"
}
```

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null
}
```

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `404` | `common.NOT_FOUND` | 존재하지 않는 체험 키 또는 해당 키 소속 회원이 아님 |
| `409` | `common.CONFLICT` | 이미 사용중인 아이디 (loginId 변경 시) |

---

## 7. 체험 가입 회원 삭제

**`DELETE /api/admin/trial-keys/{id}/users/{userId}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 체험 키 PK |
| Path | `userId` | Long | O | 회원 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null
}
```

> soft delete 처리. `loginId`에 `_deleted_{userId}` 구분자를 추가하여 동일 이메일로 재가입 가능.

### Error Responses

| 상태 | 코드 | 조건 |
|------|------|------|
| `404` | `common.NOT_FOUND` | 존재하지 않는 체험 키 또는 해당 키 소속 회원이 아님 |
