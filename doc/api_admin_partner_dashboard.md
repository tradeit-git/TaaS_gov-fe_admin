# Admin Partner Dashboard API 명세 (제휴 키 대시보드)

**Base URL:** `http://localhost:2001/api/admin/partner-keys`
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

특정 제휴 키(`{partnerKey}` = `partners.partner_key` 문자열)에 소속된 가입자/결제 데이터를 집계하여 대시보드를 구성한다. 전달된 키로 partner를 조회한 뒤 해당 partner의 PK로 집계하며, 모든 집계는 `users.partner_key_id` 로 필터링되고 삭제된 회원(`deleted_at IS NOT NULL`)은 제외한다.

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/partner-keys/{partnerKey}/dashboard` | 요약 지표(가입자수·결제건수·결제금액) + 현재 플랜 이용 현황 |
| `GET` | `/api/admin/partner-keys/{partnerKey}/dashboard/daily-signups` | 월 일별 가입자 수 |
| `GET` | `/api/admin/partner-keys/{partnerKey}/dashboard/members` | 가입자 명단 (필터 + 페이징) |

### 공통 규칙

- **결제 집계 기준:** `payment_histories.status = 'SUCCESS'` 인 건만 포함 (FAILED / CANCELLED / REFUNDED 제외). 결제 시점은 `approved_at` 기준.
- **저번주 대비 상승률(`growthRate`):**
  - 주 단위는 **월요일 시작(ISO)**. 이번주 = 이번 월요일 00:00 ~ 다음 월요일 00:00, 저번주 = 지난 월요일 00:00 ~ 이번 월요일 00:00 (각 7일 전체).
  - 계산식: `(이번주 - 저번주) / 저번주 × 100`, 소수 첫째 자리 반올림.
  - 예) 저번주 10건 → 이번주 5건 = `-50.0`, 저번주 100건 → 이번주 200건 = `100.0`.
  - **저번주 값이 0이면** 0으로 나눌 수 없어 `growthRate: null` 반환 (프론트에서 "신규" / "-" 등으로 표시 권장).
  - ⚠️ 이번주는 주 전체(월~일) 범위라, 주 초반에는 아직 경과하지 않은 요일이 0으로 포함되어 상승률이 낮게 보일 수 있음 (의도된 동작).
- 존재하지 않는 `{partnerKey}` 요청 시 `404 common.NOT_FOUND` ("제휴 키를 찾을 수 없습니다.").

---

## 1. 대시보드 요약

**`GET /api/admin/partner-keys/{partnerKey}/dashboard`**

총 가입자수 / 총 결제건수 / 누적 결제금액(각 저번주 대비 상승률)과 현재 플랜 이용 현황을 한 번에 반환한다.

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `partnerKey` | String | O | 제휴 키 문자열 (`partners.partner_key`) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "data": {
    "signups": { "value": 120, "growthRate": -50.0 },
    "payments": { "value": 30, "growthRate": 100.0 },
    "amount": { "value": 1500000, "growthRate": 12.5 },
    "planUsage": [
      { "planName": "해외영업실행", "count": 10 },
      { "planName": "Personal", "count": 4 }
    ]
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `signups.value` | Long | 총 가입자수 (누적, `users`) |
| `signups.growthRate` | Double \| null | 가입자 수 저번주 대비 상승률(%) |
| `payments.value` | Long | 총 결제건수 (누적, SUCCESS) |
| `payments.growthRate` | Double \| null | 결제건수 저번주 대비 상승률(%) |
| `amount.value` | Long | 누적 결제금액 (원, SUCCESS `total_amount` 합) |
| `amount.growthRate` | Double \| null | 결제금액 저번주 대비 상승률(%) |
| `planUsage[]` | Array | 현재 플랜 이용 현황 |
| `planUsage[].planName` | String | 플랜명 (`user_subscriptions.plan_name`) |
| `planUsage[].count` | Long | 해당 플랜 이용 회원 수 |

> **planUsage 집계 기준:** `user_subscriptions` 중 `subscription_plan_id IS NOT NULL`(결제로 발생한 플랜만, 관리자 무료 지급 제외) AND `status = 'ACTIVE'` AND `deleted_at IS NULL`. `plan_name` 으로 그룹핑하며 이용 수 내림차순 정렬.

---

## 2. 월 일별 가입자 수

**`GET /api/admin/partner-keys/{partnerKey}/dashboard/daily-signups`**

지정한 연/월의 일별 가입자 수를 반환한다. 가입이 없는 일자도 `count: 0` 으로 채워 해당 월의 전체 일수를 반환한다.

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Path | `partnerKey` | String | O | - | 제휴 키 문자열 (`partners.partner_key`) |
| Query | `year` | Integer | X | 현재 연도 | 조회 연도 (예: `2026`) |
| Query | `month` | Integer | X | 현재 월 | 조회 월 (`1`~`12`) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "data": [
    { "day": 1, "count": 3 },
    { "day": 2, "count": 0 },
    { "day": 3, "count": 5 }
    // ... 해당 월 마지막 일까지
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `day` | Integer | 일자 (1 ~ 해당 월 말일) |
| `count` | Long | 해당 일자 가입자 수 |

---

## 3. 가입자 명단

**`GET /api/admin/partner-keys/{partnerKey}/dashboard/members`**

제휴 키 소속 가입자 명단을 필터 + 페이징하여 반환한다. 모든 필터는 부분 일치(LIKE)이며 AND 조건으로 결합된다. 빈 문자열/공백은 미적용으로 처리된다. 정렬은 가입일 내림차순(`created_at DESC`).

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Path | `partnerKey` | String | O | - | 제휴 키 문자열 (`partners.partner_key`) |
| Query | `page` | Integer | X | `1` | 페이지 번호 (**1부터 시작**) |
| Query | `size` | Integer | X | `10` | 페이지당 항목 수 |
| Query | `companyName` | String | X | - | 회사명 부분 일치 |
| Query | `loginId` | String | X | - | 아이디(로그인 ID) 부분 일치 |
| Query | `name` | String | X | - | 이름 부분 일치 |
| Query | `deptPos` | String | X | - | 부서·직함 부분 일치 (`department` 또는 `position` 중 하나라도 매칭) |
| Query | `contact` | String | X | - | 전화번호 부분 일치 |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "data": {
    "content": [
      {
        "id": 55,
        "companyName": "이노베이션워크스",
        "loginId": "yoonkh88@gmail.com",
        "name": "윤태준",
        "department": "파트너영업팀",
        "position": "차장",
        "contact": "010-1234-5678",
        "createdAt": "2024-12-05T10:00:00"
      }
    ],
    "totalElements": 120,
    "totalPages": 12,
    "currentPage": 1
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `content[].id` | Long | 회원 ID |
| `content[].companyName` | String | 회사명 |
| `content[].loginId` | String | 로그인 ID |
| `content[].name` | String | 이름 |
| `content[].department` | String | 부서 |
| `content[].position` | String | 직함 |
| `content[].contact` | String | 전화번호 |
| `content[].createdAt` | DateTime | 가입일시 |
| `totalElements` | Long | 전체 건수 |
| `totalPages` | Integer | 전체 페이지 수 |
| `currentPage` | Integer | 현재 페이지 (요청한 `page`) |
