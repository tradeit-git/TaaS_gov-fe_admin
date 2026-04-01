# Admin Client API 명세 (고객사 관리)

**Base URL:** `http://localhost:2001/api/admin/clients`  
**대상:** `user_type = 1` (고객사 계정)  
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/clients` | 회원 목록 조회 (페이징 + 검색) |
| `POST` | `/api/admin/clients` | 회원 계정 생성 |
| `GET` | `/api/admin/clients/{id}` | 회원 상세 조회 |
| `PUT` | `/api/admin/clients/{id}` | 회원 정보 + 크레딧 플랜 저장 |
| `GET` | `/api/admin/clients/check-company-name` | 고객사명 중복체크 |
| `GET` | `/api/admin/clients/check-business-number` | 사업자번호 중복체크 |
| `GET` | `/api/admin/clients/check-login-id` | 아이디(E-mail) 중복체크 |

---

## 1. 회원 목록 조회

**`GET /api/admin/clients`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Query | `page` | Integer | X | `0` | 페이지 번호 (0부터 시작) |
| Query | `size` | Integer | X | `10` | 페이지당 항목 수 |
| Query | `keyword` | String | X | - | 고객사명 검색 (부분 일치) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "content": [
      {
        "id": 55,
        "status": "계약",
        "companyName": "트레이드잇",
        "businessNumber": "123-45-67890",
        "loginId": "user@tradeit.co.kr",
        "password": "$2a$10$...",
        "planName": "Enterprise Plan",
        "planStartDate": "2026-01-01",
        "planEndDate": "2026-12-31",
        "planMonths": 12,
        "createdAt": "2026-04-01T10:00:00"
      },
      {
        "id": 52,
        "status": "계약만료",
        "companyName": "테스트기업",
        "businessNumber": "000-00-00000",
        "loginId": "test@test.com",
        "password": "$2a$10$...",
        "planName": null,
        "planStartDate": null,
        "planEndDate": null,
        "planMonths": null,
        "createdAt": "2026-03-30T09:00:00"
      }
    ],
    "totalElements": 55,
    "totalPages": 6,
    "currentPage": 0
  }
}
```

### Response Fields — `data.content[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 회원 PK (순번) |
| `status` | String | 고객상태 (`계약`: 운영기간 내 플랜 있음, `계약만료`: 그 외) |
| `companyName` | String | 고객사명 |
| `businessNumber` | String | 사업자번호 |
| `loginId` | String | 아이디 (E-mail) |
| `password` | String | 패스워드 (암호화된 값) |
| `planName` | String | 현재 서비스 플랜명 (없으면 `null`) |
| `planStartDate` | String (date) | 운영 시작일 (없으면 `null`) |
| `planEndDate` | String (date) | 운영 종료일 (없으면 `null`) |
| `planMonths` | Integer | 운영 개월수 (없으면 `null`) |
| `createdAt` | String (ISO 8601) | 계정생성일 |

### 고객상태 판단 로직

| 조건 | 상태 |
|------|------|
| 가장 최근 플랜의 운영기간(`startDate` ~ `endDate`)에 오늘이 포함 | `계약` |
| 플랜 없음 또는 운영기간 지남 | `계약만료` |

---

## 2. 회원 계정 생성

**`POST /api/admin/clients`**

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `companyName` | String | O | 고객사명 (`name`, `companyName` 컬럼 모두에 저장) |
| `businessNumber` | String | O | 사업자번호 (예: `000-00-00000`) |
| `loginId` | String | O | 아이디 (E-mail 형식, `email` 컬럼에도 저장) |
| `password` | String | O | 패스워드 (BCrypt 암호화 저장) |

```json
{
  "companyName": "트레이드잇",
  "businessNumber": "123-45-67890",
  "loginId": "user@tradeit.co.kr",
  "password": "password123!"
}
```

### 자동 설정 값

| 컬럼 | 값 | 설명 |
|------|----|------|
| `name` | `companyName` 값 | 고객사명과 동일 |
| `email` | `loginId` 값 | 아이디와 동일 |
| `department` | `""` | 빈 문자열 |
| `position` | `""` | 빈 문자열 |
| `contact` | `""` | 빈 문자열 |
| `statusComment` | `""` | 빈 문자열 |
| `userType` | `1` | 신규회원 |
| `status` | `ACTIVE` | 활성 상태 (Entity @PrePersist) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 1,
    "userType": "1",
    "loginId": "user@tradeit.co.kr",
    "name": "트레이드잇",
    "companyName": "트레이드잇",
    "businessNumber": "123-45-67890",
    "department": "",
    "position": "",
    "email": "user@tradeit.co.kr",
    "contact": "",
    "createdAt": "2026-04-01T10:00:00",
    "updatedAt": "2026-04-01T10:00:00",
    "deletedAt": null,
    "lastLoginAt": null
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `409` | 이미 사용중인 아이디 | `{"status":409,"code":"common.CONFLICT","message":"이미 사용중인 아이디입니다."}` |

---

## 3. 회원 상세 조회

**`GET /api/admin/clients/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 회원 PK |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "user": {
      "id": 1,
      "status": "ACTIVE",
      "statusUpdatedAt": "2026-04-01T10:00:00",
      "userType": "1",
      "loginId": "user@tradeit.co.kr",
      "name": "트레이드잇",
      "companyName": "트레이드잇",
      "businessNumber": "123-45-67890",
      "department": "",
      "position": "",
      "email": "user@tradeit.co.kr",
      "contact": "",
      "createdAt": "2026-04-01T10:00:00",
      "updatedAt": "2026-04-01T10:00:00",
      "deletedAt": null,
      "lastLoginAt": null
    },
    "creditPlans": [
      {
        "id": 1,
        "planName": "Team plan / 月 10만",
        "startDate": "2026-01-01",
        "endDate": "2026-06-30",
        "months": 3,
        "createdAt": "2026-01-01T00:00:00",
        "rounds": [
          {
            "id": 10,
            "scheduledDate": "2026-02-01",
            "amount": 100000,
            "status": "ACTIVE"
          },
          {
            "id": 11,
            "scheduledDate": "2026-05-01",
            "amount": 100000,
            "status": "SCHEDULED"
          }
        ]
      }
    ]
  }
}
```

### Response Fields — `data.user`

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `id` | Long | N | PK |
| `status` | String | N | 회원 상태 (`ACTIVE` 등) |
| `statusUpdatedAt` | String (ISO 8601) | N | 마지막 상태 변경일 |
| `userType` | String | Y | 가입 방식 (`0`: 기존회원, `1`: 신규회원) |
| `loginId` | String | N | 로그인 ID (E-mail) |
| `name` | String | N | 이름 (고객사명) |
| `companyName` | String | N | 소속 회사명 |
| `businessNumber` | String | Y | 사업자번호 |
| `department` | String | N | 부서 |
| `position` | String | N | 직책 |
| `email` | String | N | 이메일 |
| `contact` | String | N | 연락처 |
| `createdAt` | String (ISO 8601) | N | 생성일 |
| `updatedAt` | String (ISO 8601) | N | 수정일 |
| `deletedAt` | String (ISO 8601) | Y | 삭제일 |
| `lastLoginAt` | String (ISO 8601) | Y | 최근 접속일 |

### Response Fields — `data.creditPlans[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 플랜 PK |
| `planName` | String | 서비스 플랜명 |
| `startDate` | String (date) | 운영 시작일 |
| `endDate` | String (date) | 운영 종료일 |
| `months` | Integer | 운영 개월수 |
| `createdAt` | String (ISO 8601) | 생성일 |
| `rounds` | Array | 크레딧 회차 목록 |

### Response Fields — `data.creditPlans[].rounds[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | 회차 PK (CreditWallet ID) |
| `scheduledDate` | String (date) | 지급 예정일 |
| `amount` | Integer | 지급 크레딧 |
| `status` | String | `SCHEDULED`: 미지급, `ACTIVE`: 지급완료 |

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "회원을 찾을 수 없습니다."
}
```

---

## 4. 회원 정보 + 크레딧 플랜 저장

**`PUT /api/admin/clients/{id}`**

계정정보 수정과 크레딧 플랜 저장을 한번에 처리합니다.

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 회원 PK |

### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `companyName` | String | O | 고객사명 (`name`, `companyName` 컬럼 모두 반영) |
| `businessNumber` | String | O | 사업자번호 |
| `password` | String | X | 패스워드 (값이 있으면 변경, 빈 값 또는 미전송 시 기존 유지) |
| `creditPlans` | Array | X | 크레딧 플랜 목록 (미전송 시 플랜 변경 없음) |

> **참고:** 아이디(E-mail)는 수정 불가. 고객사명/사업자번호 변경 시 기존 중복체크 API를 재활용하여 프론트에서 사전 검증.

```json
{
  "companyName": "트레이드잇(수정)",
  "businessNumber": "123-45-67890",
  "password": "",
  "creditPlans": [
    {
      "id": 1,
      "planName": "Team plan / 月 10만",
      "startDate": "2026-01-01",
      "endDate": "2026-06-30",
      "months": 3,
      "rounds": [
        {
          "id": 10,
          "scheduledDate": "2026-02-01",
          "amount": 100000,
          "status": "ACTIVE"
        },
        {
          "id": 11,
          "scheduledDate": "2026-05-01",
          "amount": 100000,
          "status": "SCHEDULED"
        },
        {
          "scheduledDate": "2026-06-01",
          "amount": 100000
        }
      ]
    }
  ]
}
```

### Request Fields — `creditPlans[]` (플랜)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | Long | X | 플랜 PK (수정 시 필수, 신규 시 null/미전송) |
| `planName` | String | O | 서비스 플랜명 |
| `startDate` | String (date) | O | 운영 시작일 |
| `endDate` | String (date) | O | 운영 종료일 |
| `months` | Integer | O | 운영 개월수 |
| `rounds` | Array | O | 크레딧 회차 목록 |

### Request Fields — `creditPlans[].rounds[]` (회차)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | Long | X | 회차 PK (수정 시 필수, 신규 시 null/미전송) |
| `scheduledDate` | String (date) | O | 지급 예정일 |
| `amount` | Integer | O | 지급 크레딧 |
| `status` | String | X | 기존 회차의 현재 상태 (신규 시 자동 `SCHEDULED`) |

### 크레딧 플랜 처리 규칙

| 상황 | 동작 |
|------|------|
| `creditPlans` 미전송/null | 크레딧 플랜 변경 없음 |
| 플랜 `id` 없음 | 신규 생성 |
| 플랜 `id` 있음 | 해당 플랜 수정 |
| 기존 플랜이 요청에 없음 | soft delete |
| 회차 `id` 없음 | 신규 생성 (`SCHEDULED` + `PAID`) |
| 회차 `id` 있고 `SCHEDULED` | 수정 가능 |
| 회차 `id` 있고 `ACTIVE` | 수정 불가 (기존 유지) |
| 기존 회차가 요청에 없고 `SCHEDULED` | 삭제 |
| 기존 회차가 요청에 없고 `ACTIVE` | 삭제 불가 → `400 BAD_REQUEST` |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "user": {
      "id": 1,
      "status": "ACTIVE",
      "statusUpdatedAt": "2026-04-01T10:00:00",
      "userType": "1",
      "loginId": "user@tradeit.co.kr",
      "name": "트레이드잇(수정)",
      "companyName": "트레이드잇(수정)",
      "businessNumber": "123-45-67890",
      "department": "",
      "position": "",
      "email": "user@tradeit.co.kr",
      "contact": "",
      "createdAt": "2026-04-01T10:00:00",
      "updatedAt": "2026-04-01T11:30:00",
      "deletedAt": null,
      "lastLoginAt": null
    },
    "creditPlans": [
      {
        "id": 1,
        "planName": "Team plan / 月 10만",
        "startDate": "2026-01-01",
        "endDate": "2026-06-30",
        "months": 3,
        "createdAt": "2026-01-01T00:00:00",
        "rounds": [
          {
            "id": 10,
            "scheduledDate": "2026-02-01",
            "amount": 100000,
            "status": "ACTIVE"
          },
          {
            "id": 11,
            "scheduledDate": "2026-05-01",
            "amount": 100000,
            "status": "SCHEDULED"
          },
          {
            "id": 12,
            "scheduledDate": "2026-06-01",
            "amount": 100000,
            "status": "SCHEDULED"
          }
        ]
      }
    ]
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `404` | 존재하지 않는 회원 | `{"status":404,"code":"common.NOT_FOUND","message":"회원을 찾을 수 없습니다."}` |
| `400` | 지급완료 회차 삭제 시도 | `{"status":400,"code":"common.BAD_REQUEST","message":"지급완료된 회차는 삭제할 수 없습니다."}` |

---

## 5. 고객사명 중복체크

**`GET /api/admin/clients/check-company-name`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Query | `companyName` | String | O | 체크할 고객사명 |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "duplicate": true
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `duplicate` | Boolean | `true`: 이미 존재 (사용 불가), `false`: 사용 가능 |

---

## 6. 사업자번호 중복체크

**`GET /api/admin/clients/check-business-number`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Query | `businessNumber` | String | O | 체크할 사업자번호 |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "duplicate": false
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `duplicate` | Boolean | `true`: 이미 존재 (사용 불가), `false`: 사용 가능 |

---

## 7. 아이디(E-mail) 중복체크

**`GET /api/admin/clients/check-login-id`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Query | `loginId` | String | O | 체크할 아이디 (E-mail 형식) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "duplicate": true
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `duplicate` | Boolean | `true`: 이미 존재 (사용 불가), `false`: 사용 가능 |
