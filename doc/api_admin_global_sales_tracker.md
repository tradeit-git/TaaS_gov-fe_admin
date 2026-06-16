# Admin 해외영업 상세관리(Tracker) API 명세

**페이지:** `/project/global-sales/tracker?projectNo={projectNo}` (해외영업관리 > 상세관리)
**인증:** Admin JWT 토큰 필요 (쿠키 기반 / `credentials: 'include'`)
**공통 응답 래퍼:** 모든 API는 `{ result, data, message }` 형태로 파싱됨 (`callApi` 기준). 실제 서버 응답은 `{ status, code, message, data }` 구조이며, `status === 200`을 성공으로 간주.

> 이 페이지는 **프로젝트 선택 → 바이어(buyer) 목록 관리 → 바이어 상세/이력 → 영업일지(salesLog) 작성/조회**의 4개 영역으로 구성됩니다.
> 호출 컴포넌트 위치는 모두 `src/app/(Auth)/project/global-sales/tracker/` 하위입니다.

---

## API 요약

| # | Method | Endpoint | 설명 | 호출 위치 |
|---|--------|----------|------|-----------|
| 1 | `GET` | `/api/admin/projects` | 프로젝트(셀렉트박스) 전체 목록 | `layout.tsx` |
| 2 | `GET` | `/api/admin/projects/{projectId}` | 프로젝트 단건 조회 (목록용 plural) | `PageComponent.tsx` (fetchProject) |
| 3 | `GET` | `/api/admin/project/{projectId}` | 프로젝트 단건 조회 (singular) | `PopupRegister.tsx` |
| 4 | `GET` | `/api/admin/project/{projectId}/buyer/list` | 프로젝트 바이어 목록 | `PageComponent`, `PopupRegister`, `ExcelDownloadButton` |
| 5 | `GET` | `/api/admin/project/{projectId}/buyer/manager/list` | 프로젝트 전체 바이어 담당자 목록 (엑셀용) | `ExcelDownloadButton.tsx` |
| 6 | `GET` | `/api/admin/project/{projectId}/buyer/{buyerId}/detail` | 바이어 상세 + 담당자 | `PageComponent`, `ProjectBuyerItem` |
| 7 | `GET` | `/api/admin/project/{projectId}/buyer/{buyerId}/buyerStepHistories` | 바이어 등급 변경 이력 | `PageComponent.tsx` (fetchBuyerDetail) |
| 8 | `GET` | `/api/admin/project/{projectId}/buyer/{buyerId}/salesLogsNoContents` | 영업일지 목록 (본문 제외) | `PageComponent.tsx` |
| 9 | `GET` | `/api/admin/project/{projectId}/buyer/{buyerId}/salesLogs` | 영업일지 전체 (본문 포함, View All) | `ActivityReportBox.tsx` |
| 10 | `GET` | `/api/admin/project/{projectId}/buyer/{buyerId}/salesLog/{salesLogId}` | 영업일지 단건 상세 | `PageComponent.tsx` |
| 11 | `POST` | `/api/admin/project/{projectId}/buyer/store` | 바이어 등록/수정 (담당자 포함) | `PopupRegister.tsx` |
| 12 | `PUT` | `/api/admin/project/{projectId}/buyer/{buyerId}/updateBuyerStep` | 바이어 등급 변경 (이력 동반) | `PopupChangeBuyerStep.tsx` |
| 13 | `PUT` | `/api/admin/project/{projectId}/buyer/{buyerId}/setBookmark` | 바이어 즐겨찾기(고정) 토글 | `ProjectBuyerItem.tsx` |
| 14 | `PUT` | `/api/admin/project/{projectId}/buyer/{buyerId}/setPublic` | 바이어 공개여부 토글 | `ProjectBuyerItem.tsx` |
| 15 | `POST` | `/api/admin/project/{projectId}/buyer/{buyerId}/setBuyerRelease` | 바이어 노출(release) 등급 전환 | `ProjectBuyerItemManageButton.tsx` |
| 16 | `DELETE` | `/api/admin/project/{projectId}/buyer/{buyerId}` | 바이어 삭제 | `ProjectBuyerItemManageButton.tsx` |
| 17 | `POST` | `/api/admin/project/{projectId}/buyer/excel-upload` | 바이어 엑셀 일괄 업로드 | `ProjectBuyer.tsx` |
| 18 | `GET` | `/api/admin/common/buyer-excel-form` | 바이어 등록 엑셀 표준서식 다운로드 | `ProjectBuyer.tsx` (`<Link download>`) |
| 19 | `POST` | `/api/admin/project/{projectId}/buyer/{buyerId}/salesLog/store` | 영업일지 등록/수정 (파일 첨부) | `ReportForm.tsx` |
| 20 | `POST` | `/api/admin/project/{projectId}/buyer/{buyerId}/salesLog/{salesLogId}/delete` | 영업일지 삭제 | `ReportForm.tsx` |
| - | `POST` | `/api/admin/auth/refresh` | (공통) 401 시 토큰 재발급 | `utill/apiRequest.ts` |

> **주의:** #2는 `projects`(plural), #3은 `project`(singular)로 경로가 다릅니다. 프론트 코드 기준 그대로 기재했으며, 백엔드 라우팅 시 확인 필요.

---

## 데이터 모델 (zod 스키마 기준)

### Project (`ProjectType`)
```jsonc
{
  "id": 0,
  "name": "",
  "startDate": "", "endDate": "",
  "createUser": { /* UserType */ },
  "createdAdmin": null,            // AdminType | null
  "createdAt": "", "updatedAt": "",
  "list": "", "listTooltip": "",   // 단계별 커스텀 명칭/툴팁
  "lead": "", "leadTooltip": "",
  "target": "", "targetTooltip": "",
  "client": "", "clientTooltip": "",
  "buyerCountPerStep": { "DB": 0, "List": 0, "Lead": 0, "Target": 0, "Client": 0 },
  "totalSalesLogCount": 0
}
```
- `projectNo`(화면 표기)는 프론트에서 `getProjectNo()`로 생성: `pjt-{YYMMDD}-{id 4자리}` (예: `pjt-260407-0764`).

### Buyer (`BuyerType`)
```jsonc
{
  "id": 0,
  "project": { /* ProjectType */ },
  "isBookmark": false,
  "step": "DB",                    // "DB" | "List" | "Lead" | "Target" | "Client"
  "stepUpdatedAt": null,
  "companyName": "",
  "geoCode": { /* GeoCodeType */ },
  "googleMapAddress": "",
  "geoLatLng": "",
  "timeDiffWithKorea": 0,
  "homepage": "",
  "isDisplayHomepage": true,
  "currencyUnit": null,            // CurrencyUnitType | null
  "revenue": "",
  "keyItems": "",
  "companyContacts": "",           // 콤마(,) 구분 최대 3개
  "companyEmails": "",             // 콤마(,) 구분 최대 3개
  "facebook": "", "linkedin": "", "youtube": "",
  "isPublic": false,
  "modifiedByUser": null, "modifiedByAdmin": null,
  "createdAt": "", "updatedAt": "",
  "salesLogCount": 0,
  "salesLogLastUpdatedAt": ""
}
```

### BuyerManager (`BuyerManagerType`)
```jsonc
{
  "buyerId": 0,
  "role": "Admin",                 // "Admin" | "Manager" | "Member"
  "name": "", "position": "",
  "contact": "", "phone": "", "email": "",
  "twitter": "", "facebook": "", "linkedin": "", "instagram": ""
}
```

### BuyerStepHistory (`BuyerStepHistoryType`)
```jsonc
{
  "id": 0,
  "buyer": { /* BuyerType */ },
  "action": "UP",                  // "UP" | "DOWN"
  "beforeStep": "DB",
  "afterStep": "List",
  "comment": "",
  "modifiedByUser": null, "modifiedByAdmin": null,
  "createdAt": null
}
```

### BuyerSalesLog (`BuyerSalesLogType`)
```jsonc
{
  "id": 0,
  "buyer": { /* BuyerType */ },
  "date": "YYYY-MM-DD",
  "topic": "N/A",                  // "N/A" | "Inquiry" | "RFQ" | "Quotation"
  "title": "",
  "content": "",                   // HTML (TxEditor)
  "modifiedByUser": null, "modifiedByAdmin": null,
  "createdAt": "", "updatedAt": "",
  "files": [ { "id": 0, "s3File": { /* FileType */ } } ]
}
```

---

## 상세 명세

### 1. 프로젝트 전체 목록
**`GET /api/admin/projects`**
- 셀렉트박스용 프로젝트 리스트. `layout.tsx`에서 SSR로 호출, 실패 시 로그인 페이지로 redirect.
- **Response `data`:** `ProjectType[]`

### 2. 프로젝트 단건 조회 (목록 경로)
**`GET /api/admin/projects/{projectId}`**
- 선택된 프로젝트 정보 조회. `projectId === 0`이면 호출 생략.
- **Response `data`:** `ProjectType`

### 3. 프로젝트 단건 조회 (단수 경로)
**`GET /api/admin/project/{projectId}`**
- `PopupRegister`에서 저장 후 프로젝트 갱신용. (#2와 응답 동일, 경로만 다름)
- **Response `data`:** `ProjectType`

### 4. 바이어 목록
**`GET /api/admin/project/{projectId}/buyer/list`**
- 해당 프로젝트의 모든 바이어. 프론트에서 step/검색/정렬/페이지네이션 처리.
- **Response `data`:** `BuyerType[]`

### 5. 바이어 담당자 전체 목록 (엑셀용)
**`GET /api/admin/project/{projectId}/buyer/manager/list`**
- 엑셀 다운로드 시 바이어별 담당자 매핑용. `buyerId` 기준으로 그룹핑하여 사용.
- **Response `data`:** `BuyerManagerType[]`

### 6. 바이어 상세 + 담당자
**`GET /api/admin/project/{projectId}/buyer/{buyerId}/detail`**
- **Response `data`:**
```jsonc
{ "buyer": { /* BuyerType */ }, "buyerManagers": [ /* BuyerManagerType */ ] }
```

### 7. 바이어 등급 변경 이력
**`GET /api/admin/project/{projectId}/buyer/{buyerId}/buyerStepHistories`**
- **Response `data`:** `BuyerStepHistoryType[]`

### 8. 영업일지 목록 (본문 제외)
**`GET /api/admin/project/{projectId}/buyer/{buyerId}/salesLogsNoContents`**
- 좌측 리스트 표시용. `content` 필드 제외하여 경량 응답.
- **Response `data`:** `BuyerSalesLogType[]` (content 비어있음)

### 9. 영업일지 전체 (View All)
**`GET /api/admin/project/{projectId}/buyer/{buyerId}/salesLogs`**
- "View All" 팝업용. 본문(content) 포함.
- **Response `data`:** `BuyerSalesLogType[]`

### 10. 영업일지 단건 상세
**`GET /api/admin/project/{projectId}/buyer/{buyerId}/salesLog/{salesLogId}`**
- **Response `data`:** `BuyerSalesLogType`

### 11. 바이어 등록/수정
**`POST /api/admin/project/{projectId}/buyer/store`**
- `Content-Type: application/json`
- **Request Body:**
```jsonc
{
  "buyer": { /* BuyerType (id=0이면 신규, >0이면 수정) */ },
  "buyerManagers": [ /* BuyerManagerType[] (최대 3명) */ ]
}
```
- **Response `data`:** 저장된 `BuyerType` (또는 성공 여부)

### 12. 바이어 등급 변경
**`PUT /api/admin/project/{projectId}/buyer/{buyerId}/updateBuyerStep`**
- 등급 상/하향 시 변경 사유(comment) 필수.
- **Request Body:** `BuyerStepHistoryType`
```jsonc
{
  "buyer": { /* BuyerType */ },
  "action": "UP",                // "UP" | "DOWN"
  "beforeStep": "List",
  "afterStep": "Lead",
  "comment": "변경 사유"
}
```

### 13. 즐겨찾기(고정) 토글
**`PUT /api/admin/project/{projectId}/buyer/{buyerId}/setBookmark`**
- **Request Body:** `boolean` (예: `true`)

### 14. 공개여부 토글
**`PUT /api/admin/project/{projectId}/buyer/{buyerId}/setPublic`**
- **Request Body:** `boolean`

### 15. 바이어 노출(Release) 전환
**`POST /api/admin/project/{projectId}/buyer/{buyerId}/setBuyerRelease`**
- `Content-Type: application/json`
- DB→List 상승(노출 시작) 또는 List→DB 하락(이력 초기화) 시 호출.
- **Request Body:** `boolean` (`true`=release / `false`=회수)

### 16. 바이어 삭제
**`DELETE /api/admin/project/{projectId}/buyer/{buyerId}`**
- Body 없음.

### 17. 바이어 엑셀 일괄 업로드
**`POST /api/admin/project/{projectId}/buyer/excel-upload`**
- `multipart/form-data`
- **Form fields:** `file` (`.xlsx` / `.xlsm`)
- **Response `data`:** 업로드 반영된 `BuyerType[]`

### 18. 바이어 엑셀 표준서식 다운로드
**`GET /api/admin/common/buyer-excel-form`**
- `<Link download="바이어 DB 등록_표준서식.xlsm">` — 파일 직접 다운로드(바이너리).

### 19. 영업일지 등록/수정
**`POST /api/admin/project/{projectId}/buyer/{buyerId}/salesLog/store`**
- `multipart/form-data`
- **Form fields:**
  - `buyerSalesLog`: `application/json` Blob — `BuyerSalesLogType` (본문 base64 이미지는 사전 업로드 후 URL 치환됨)
  - `uploadFiles`: 첨부파일 (최대 2개, 총 500MB 이하)
- **Response `data`:** 저장된 `BuyerSalesLogType`

### 20. 영업일지 삭제
**`POST /api/admin/project/{projectId}/buyer/{buyerId}/salesLog/{salesLogId}/delete`**
- Body 없음.

---

## 비고
- 본 문서는 프론트엔드 `tracker` 페이지의 호출 코드 기준으로 역추출했습니다. 실제 백엔드 구현/응답 필드와 차이가 있을 수 있으니 연동 시 교차 검증이 필요합니다.
- `step` 값: `DB → List → Lead → Target → Client` (5단계). `DB` 단계는 공개/고정 토글 비활성.
- 인증 토큰 만료(401) 시 `apiRequest`가 `/api/admin/auth/refresh`로 자동 재발급 후 재시도(최대 5회, 지수 백오프).
