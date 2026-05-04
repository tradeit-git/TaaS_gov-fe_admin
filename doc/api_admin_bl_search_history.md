# Admin BL Search History API 명세

**Base URL:** `http://localhost:2001/api/admin/bl-search-histories`
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)
**용도:** 관리자 - 사용자 크레딧 거래내역에서 BL_SEARCH 거래의 `reference_id` 로 추적

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/bl-search-histories/{id}` | 단건 조회 (history 메타 + 연결된 검색 쿼리) |

---

## 연관 흐름

`credit_transactions` 의 `serviceType = BL_SEARCH` 거래는 `reference_id` 에 `user_bl_search_histories.id` 가 채워집니다 (2026-04-30 이후 신규 거래). 관리자가 사용자 상세페이지에서 BL_SEARCH 거래를 봤을 때, 해당 `reference_id` 를 본 API에 넘겨 어떤 검색이었는지 확인합니다.

```
1) GET /api/admin/users/{userId}/credits/transactions
   → content[].referenceId = 1287  (serviceType=BL_SEARCH 거래)

2) GET /api/admin/bl-search-histories/1287
   → 검색 쿼리(HS코드, 키워드, 국가, 기간 등) 반환
```

---

## 1. BL 검색 기록 단건 조회

**`GET /api/admin/bl-search-histories/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | `user_bl_search_histories.id` |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 1287,
    "userId": 42,
    "createdAt": "2026-04-30T11:23:00",
    "query": {
      "id": 998,
      "hash": "ab12cd34ef56...",
      "hsCode": "8517",
      "productKeyword": "smartphone",
      "buyerName": "",
      "supplierName": "",
      "originclCountryCode": "KR,JP",
      "destiCountryCode": "US",
      "startDate": "2025-04-30",
      "endDate": "2026-04-30",
      "perPage": 50,
      "curPage": 1,
      "total": 1284,
      "rowCount": 50,
      "createdAt": "2026-04-30T11:22:58"
    }
  }
}
```

### Response Fields — `data` (AdminBLSearchHistoryDTO)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | `user_bl_search_histories.id` |
| `userId` | Long | 검색을 수행한 사용자 ID |
| `createdAt` | String (ISO 8601) | 검색 기록 생성 시각 |
| `query` | Object | 연결된 BL 검색 쿼리 (하단 Query 참조) |

### Response Fields — `data.query`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Long | `bl_search_queries.id` |
| `hash` | String | 캐시 키용 해시 |
| `hsCode` | String | HS 코드 |
| `productKeyword` | String | 상품 키워드 |
| `buyerName` | String | 수입자명 |
| `supplierName` | String | 수출자명 |
| `originclCountryCode` | String | 원산지 국가 코드 (쉼표 구분) |
| `destiCountryCode` | String | 목적지 국가 코드 (쉼표 구분) |
| `startDate` | String (ISO date) | 검색 시작일 |
| `endDate` | String (ISO date) | 검색 종료일 |
| `perPage` | Integer | 페이지당 조회 건수 |
| `curPage` | Integer | 현재 페이지 번호 |
| `total` | Integer | 전체 검색 결과 개수 |
| `rowCount` | Integer | 현재 페이지 row 수 |
| `createdAt` | String (ISO 8601) | 검색 요청 생성 시각 |

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "BL 검색 기록을 찾을 수 없습니다."
}
```

---

## 메모

- `user_bl_search_histories` 는 검색 결과가 **1건 이상일 때만** 저장됩니다 (BLSearchService.java 동작). 0건 검색은 크레딧도 차감되지 않고 history 도 안 남으므로, 거래내역에서 `reference_id` 가 가리키는 history 는 항상 존재해야 정상입니다.
- 동일 사용자가 동일한 검색 조건으로 여러 번 검색한 경우, `bl_search_query_id` 는 동일 row를 재사용할 수 있지만 `user_bl_search_histories` 는 매 검색마다 row 가 새로 추가됩니다 (1:N).
- 백필되지 않은 과거 거래(2026-04-30 이전)는 `reference_id` 가 `null` 입니다.
