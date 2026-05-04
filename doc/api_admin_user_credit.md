# Admin User Credit API 명세

**Base URL:** `http://localhost:2001/api/admin/users/{userId}/credits`
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)
**용도:** 관리자 - 사용자 상세페이지의 크레딧 영역

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/users/{userId}/credits/balance` | 사용자 잔여 크레딧 (무료/유료/전체) |
| `GET` | `/api/admin/users/{userId}/credits/transactions` | 사용자 크레딧 거래 내역 (페이징) |

---

## 공통

### Path

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `userId` | Long | O | 사용자 PK (`users.id`) |

### 공통 에러 — `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "사용자를 찾을 수 없습니다."
}
```

> 존재하지 않거나 `deleted_at` 이 설정된 사용자에 대한 호출.

---

## 1. 사용자 잔여 크레딧 조회

**`GET /api/admin/users/{userId}/credits/balance`**

상태가 `ACTIVE` 인 크레딧 지갑(`credit_wallets`)의 잔액을 합산합니다.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "freeBalance": 50,
    "paidBalance": 100,
    "totalBalance": 150
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `freeBalance` | Integer | 무료 크레딧 잔액 (`creditType = FREE` 합) |
| `paidBalance` | Integer | 유료 크레딧 잔액 (`creditType = PAID` 합) |
| `totalBalance` | Integer | 전체 잔액 (= `freeBalance + paidBalance`) |

> 지갑이 하나도 없거나 모두 `EXPIRED/REVOKED` 라면 모두 `0` 반환.

---

## 2. 사용자 크레딧 거래 내역 조회

**`GET /api/admin/users/{userId}/credits/transactions`**

`credit_transactions` 의 거래 내역을 페이징으로 반환. `transactionDate` 내림차순.

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Query | `page` | Integer | X | `0` | 페이지 번호 (0부터 시작) |
| Query | `size` | Integer | X | `20` | 페이지당 항목 수 |
| Query | `type` | String | X | - | 거래 유형 필터. `GRANT` \| `USE` \| `EXPIRE` \| `REVOKE`. 생략 시 전체 |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "content": [
      {
        "id": 1024,
        "transactionType": "USE",
        "grantType": null,
        "serviceType": "BUYER_ENRICH",
        "expireType": null,
        "amount": -50,
        "balanceAfter": 100,
        "eventKey": "buyer-enrich-20260430-112300",
        "referenceType": "SERVICE",
        "referenceId": 8821,
        "expiredTargetMonth": null,
        "transactionDate": "2026-04-30T11:23:00"
      },
      {
        "id": 1023,
        "transactionType": "GRANT",
        "grantType": "SUBSCRIPTION",
        "serviceType": null,
        "expireType": null,
        "amount": 5000,
        "balanceAfter": 5000,
        "eventKey": "sub-grant-20260401",
        "referenceType": "SUBSCRIPTION",
        "referenceId": 332,
        "expiredTargetMonth": null,
        "transactionDate": "2026-04-01T00:00:01"
      },
      {
        "id": 1022,
        "transactionType": "EXPIRE",
        "grantType": null,
        "serviceType": null,
        "expireType": "PERIOD_EXPIRED",
        "amount": -200,
        "balanceAfter": 0,
        "eventKey": "expire-202603-batch",
        "referenceType": "SETTLEMENT",
        "referenceId": null,
        "expiredTargetMonth": "2026-03",
        "transactionDate": "2026-04-01T00:00:00"
      }
    ],
    "totalElements": 132,
    "totalPages": 7,
    "currentPage": 0
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `content` | Array\<CreditTransactionDTO\> | 거래 내역 (하단 DTO 참조) |
| `totalElements` | Long | 전체 거래 건수 |
| `totalPages` | Integer | 전체 페이지 수 |
| `currentPage` | Integer | 현재 페이지 번호 (0-based) |

---

## CreditTransactionDTO 필드 상세

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `id` | Long | N | PK |
| `transactionType` | String (Enum) | N | 거래 유형 — `GRANT` / `USE` / `EXPIRE` / `REVOKE` |
| `grantType` | String (Enum) | Y | 지급 유형 — `transactionType = GRANT` 일 때만 채워짐. `SUBSCRIPTION` / `UPGRADE_DIFF` / `FREE` |
| `serviceType` | String (Enum) | Y | 서비스 유형 — `transactionType = USE` 일 때만 채워짐. 하단 ServiceType 참조 |
| `expireType` | String (Enum) | Y | 소멸 유형 — `transactionType = EXPIRE` 일 때만 채워짐. `PERIOD_EXPIRED` / `OVER_LIMIT` |
| `amount` | Integer | N | 변동 크레딧. 양수 = 증가, 음수 = 감소 |
| `balanceAfter` | Integer | N | 거래 직후 사용자 전체 잔액 (모든 ACTIVE 지갑 합) |
| `eventKey` | String | N | 동일 이벤트 묶음 식별자 |
| `referenceType` | String | Y | 참조 타입 (`SERVICE` / `SUBSCRIPTION` / `ADMIN` / `SIGNUP` / `SETTLEMENT`) |
| `referenceId` | Long | Y | 참조 ID |
| `expiredTargetMonth` | String | Y | 소멸 대상 년월 (`YYYY-MM`). `EXPIRE` 시에만 채워짐 |
| `transactionDate` | String (ISO 8601) | N | 거래 일시 |

### TransactionType별 채워지는 부가 필드

| transactionType | 채워지는 필드 | amount 부호 |
|---|---|---|
| `GRANT` | `grantType` | + |
| `USE` | `serviceType` | − |
| `EXPIRE` | `expireType`, `expiredTargetMonth` | − |
| `REVOKE` | (부가필드 없음) | − |

### ServiceType (Enum)

| 값 | 설명 |
|----|------|
| `BUYER_ENRICH` | 바이어 Enrichment |
| `BUYER_FIT` | 바이어 적합도 분석 |
| `AI_CORE` | AI Core |
| `BL_SEARCH` | BL 검색 |
| `APOLLO_ORG_SEARCH` | Apollo 기업 검색 |
| `APOLLO_ORG_ENRICH` | Apollo 기업 상세 조회 |
| `APOLLO_PEOPLE_ENRICH` | Apollo 직원 이메일 조회 |
| `APOLLO_PHONE_REVEAL` | Apollo 직원 전화번호 조회 |

---

## 프론트 사용 가이드 (참고)

### 표시 한 줄 만들기 예시

```js
function describeTransaction(tx) {
  switch (tx.transactionType) {
    case 'GRANT':
      return `+${tx.amount} (${tx.grantType})`;       // 예: "+5000 (SUBSCRIPTION)"
    case 'USE':
      return `${tx.amount} (${tx.serviceType})`;       // 예: "-50 (BUYER_ENRICH)"
    case 'EXPIRE':
      return `${tx.amount} 소멸 (${tx.expiredTargetMonth ?? tx.expireType})`;
    case 'REVOKE':
      return `${tx.amount} 회수`;
    default:
      return tx.amount;
  }
}
```

### 잔액 + 첫 페이지 동시 호출

상세페이지 진입 시 두 호출을 병렬로 보내면 됩니다.

```js
const [{ data: balance }, { data: transactions }] = await Promise.all([
  fetch(`/api/admin/users/${userId}/credits/balance`).then(r => r.json()),
  fetch(`/api/admin/users/${userId}/credits/transactions?page=0&size=20`).then(r => r.json())
]);
```

---

## 공통 에러 응답 포맷

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "사람이 읽을 수 있는 한글 메시지"
}
```

| `code` | 의미 |
|------|------|
| `common.SUCCESS` | 정상 응답 |
| `common.NOT_FOUND` | 사용자 없음 |
