# Admin 관리 대상 사용자(Managed Users) API 명세

**도메인:** `/api/admin/managed-users`
**모듈:** `api_admin`
**인증:** Admin JWT 토큰 필요 (쿠키 기반 / `credentials: 'include'`)
**공통 응답 래퍼:** 실제 서버 응답은 `{ status, code, message, data }` 구조이며, `status === 200`을 성공으로 간주.

> 이 도메인은 **관리자가 "관리 대상 사용자"를 선별·등록**하고, 등록된 사용자 단위로 **해당 사용자의 프로젝트**를 조회하는 영역입니다.
> 데이터는 신규 테이블 `managed_users`에 적재됩니다. (해외영업 tracker 구조에서 한 단계 상위에 `{userId}`가 추가된 형태)

---

## API 요약

| # | Method | Endpoint | 설명 |
|---|--------|----------|------|
| 1 | `GET` | `/api/admin/managed-users` | 관리 대상 사용자 목록 |
| 2 | `GET` | `/api/admin/managed-users/search-users` | 등록용 사용자 검색 (미등록 사용자만) |
| 2-1 | `GET` | `/api/admin/managed-users/projects/search` | 프로젝트 전역 검색 (빠른이동) |
| 3 | `POST` | `/api/admin/managed-users` | 관리 대상 사용자 추가 |
| 4 | `DELETE` | `/api/admin/managed-users/{userId}` | 관리 대상 사용자 제거 (soft delete) |
| 5 | `GET` | `/api/admin/managed-users/{userId}/projects` | 관리 대상 사용자의 프로젝트 목록 (즐겨찾기 여부 포함) |
| 5-1 | `POST` | `/api/admin/managed-users/{userId}/projects` | 프로젝트 생성 (body: `{ projectName }`) |
| 6 | `GET` | `/api/admin/managed-users/{userId}/projects/{projectId}` | 프로젝트 단건 (즐겨찾기 여부 포함) |
| 6-1 | `PUT` | `/api/admin/managed-users/{userId}/projects/{projectId}/setBookmark` | 프로젝트 즐겨찾기 추가/제거 (body: `boolean`, 관리자 개별) |
| 7 | `GET` | `.../buyer/list` | 바이어 목록 |
| 8 | `GET` | `.../buyer/manager/list` | 바이어 담당자 전체 목록 (엑셀용) |
| 9 | `POST` | `.../buyer/store` | 바이어 등록/수정 (담당자 포함) |
| 10 | `POST` | `.../buyer/excel-upload` | 바이어 엑셀 일괄 업로드 (multipart) |
| 11 | `GET` | `.../buyer/{buyerId}/detail` | 바이어 상세 + 담당자 |
| 12 | `DELETE` | `.../buyer/{buyerId}` | 바이어 삭제 |
| 13 | `GET` | `.../buyer/getBookmarks` | 바이어 북마크 목록 |
| 14 | `PUT` | `.../buyer/{buyerId}/setBookmark` | 바이어 즐겨찾기 토글 (body: `boolean`) |
| 15 | `PUT` | `.../buyer/{buyerId}/setPublic` | 바이어 공개여부 토글 (body: `boolean`) |
| 16 | `GET` | `.../buyer/{buyerId}/buyerStepHistories` | 바이어 등급 변경 이력 |
| 17 | `POST` | `.../buyer/{buyerId}/setBuyerRelease` | 바이어 노출(release) 전환 (body: `boolean`) |
| 18 | `PUT` | `.../buyer/{buyerId}/updateBuyerStep` | 바이어 등급 변경 (body: `BuyerStepHistoryDTO`) |
| 19 | `GET` | `.../buyer/{buyerId}/salesLogs` | 영업일지 목록 (본문 포함) |
| 20 | `GET` | `.../buyer/{buyerId}/salesLogsNoContents` | 영업일지 목록 (본문 제외) |
| 21 | `GET` | `.../buyer/{buyerId}/salesLog/{buyerSalesLogId}` | 영업일지 단건 상세 |
| 22 | `POST` | `.../buyer/{buyerId}/salesLog/store` | 영업일지 등록/수정 (multipart, 파일 첨부) |
| 23 | `POST` | `.../buyer/{buyerId}/salesLog/{buyerSalesLogId}/delete` | 영업일지 삭제 |

> #7~#23의 base path는 모두 `/api/admin/managed-users/{userId}/projects/{projectId}/buyer` 입니다.
> 기존 `ProjectBuyerController`(`/api/admin/project/{projectId}/buyer/...`)의 **모든 엔드포인트(읽기+쓰기)를 동일 시그니처로 미러링**하며, 같은 서비스에 위임합니다. 요청/응답 스키마·동작은 `api_admin_global_sales_tracker.md` #4~#20과 동일.

---

## 데이터 모델

### UserList (`UserListDTO`) — #1 / #2 응답 항목
> 회원 목록(`/api/admin/members/...`)과 **동일한 DTO**. 여기에 `projectCount` 필드가 추가됨.
```jsonc
{
  "id": 0,
  "userStatus": "ACTIVE",       // AuthStatus
  "companyName": "", "businessNumber": "",
  "loginId": "", "password": "",
  "name": "", "department": "", "position": "", "contract": "",
  "creditTotal": 0, "creditUsed": 0, "creditExpired": 0, "creditBalance": 0,
  "creditSummary": { "granted": 0, "used": 0, "expired": 0, "balance": 0 },
  "planName": "Free", "planSourceType": "FREE",   // PG | ADMIN | FREE
  "planStartDate": null, "planEndDate": null, "planMonths": null,
  "paymentMethod": null, "paymentMethodName": null, "billingDay": null,
  "contractDate": null, "contractAmount": null,
  "partnerName": "",
  "projectCount": 0,            // ★ #1에만 포함: 생성한 프로젝트 수 (삭제 제외). #2(search-users)에는 없음
  "managedAt": "",             // ★ #1에만 포함: 관리 대상 등록일 (managed_users.createdAt)
  "createdAt": "", "lastLoginAt": null
}
```
> `projectCount` · `managedAt`는 #1(목록)에만 내려가며, #2(search-users) 응답에는 포함되지 않습니다(JSON에서 생략).

### ManagedUser (`ManagedUserDTO`) — #3 추가 응답
```jsonc
{
  "id": 0,                 // managed_users PK
  "user": { /* UserDTO */ },
  "createdAt": ""          // 관리 대상 추가일
}
```

### User (`UserDTO`)
```jsonc
{
  "id": 0,
  "userType": "",          // 0:내부, 1:고객, 2:직접가입, 100:체험
  "loginId": "",
  "password": null,        // 응답에서 항상 null 처리
  "name": "",
  "companyName": "",
  "businessNumber": "",
  "department": "",
  "position": "",
  "email": "",
  "contact": "",
  "createdAt": "", "updatedAt": "", "deletedAt": null,
  "lastLoginAt": null
}
```

### Project (`ProjectDTO`)
```jsonc
{
  "id": 0,
  "name": "",
  "startDate": "", "endDate": "",
  "createUser": { /* UserDTO */ },
  "createdAdmin": null,            // AdminDTO | null
  "createdAt": "", "updatedAt": "",
  "list": "", "listTooltip": "",   // 단계별 커스텀 명칭/툴팁
  "lead": "", "leadTooltip": "",
  "target": "", "targetTooltip": "",
  "client": "", "clientTooltip": "",
  "buyerCountPerStep": { "DB": 0, "List": 0, "Lead": 0, "Target": 0, "Client": 0 },
  "totalSalesLogCount": 0,
  "isBookmark": false              // managed-users 프로젝트 즐겨찾기 여부 (#5/#6)
}
```

---

## 상세 명세

### 1. 관리 대상 사용자 목록
**`GET /api/admin/managed-users`**
- `managed_users`에 등록된(삭제되지 않은) 사용자 목록. 추가일(`createdAt`) 내림차순. **페이지네이션**.
- 삭제된 사용자(`user.deletedAt`)는 제외.
- **Query Params:**
  - `page` (선택, 기본 `0`): 0-base 페이지 번호.
  - `size` (선택, 기본 `10`): 페이지 크기.
  - `keyword` (선택): 사용자 이름 / 로그인ID / 회사명 / 이메일 부분일치.
  - `projectName` (선택): 해당 사용자가 생성한 프로젝트명 부분일치 (삭제되지 않은 프로젝트 기준, EXISTS 필터).
- **Response `data`:** (`content`는 `UserListDTO[]` — 회원 목록과 동일 + `projectCount` + `managedAt`)
```jsonc
{
  "content": [ /* UserListDTO[] (projectCount, managedAt 포함) */ ],
  "totalElements": 0,
  "totalPages": 0,
  "currentPage": 0
}
```

### 2. 등록용 사용자 검색
**`GET /api/admin/managed-users/search-users`**
- 관리 대상 **추가 모달**에서 사용. `managed_users`에 **아직 등록되지 않은** 사용자만 반환.
- **Query Params:**
  - `keyword` (선택): 이름 / 로그인ID / 회사명 / 이메일 부분일치. 생략 시 전체 미등록 사용자.
- 정렬: 이름(`name`) 오름차순. 삭제된 사용자 제외. 결과 수 제한 없음(전체 반환).
- **Response `data`:** `UserListDTO[]` (`projectCount` · `managedAt` 미포함)

### 2-1. 프로젝트 전역 검색 (빠른이동)
**`GET /api/admin/managed-users/projects/search`**
- 관리 대상 사용자(`managed_users`)의 프로젝트를 가로질러 검색. 결과 클릭 시 `/managed-users/{userId}/projects/{projectId}`로 이동 → 각 항목에 `userId`/`projectId` 포함.
- **Query Params:** (둘 다 선택, AND, 생략 시 전체)
  - `projectName`: 프로젝트명 부분일치
  - `keyword`: 기업명 / 이름 / 로그인ID / 이메일 부분일치
  - `page` (기본 `0`), `size` (기본 `10`)
- 정렬: **기업명 → 이름 → 프로젝트명** (오름차순). 삭제된 프로젝트/사용자 제외.
- **Response `data`:**
```jsonc
{
  "content": [
    {
      "userId": 0,        // 소유자(관리 대상 사용자) id — 라우팅 필수
      "projectId": 0,     // 프로젝트 id — 라우팅 필수
      "companyName": "",  // 기업명
      "ownerName": "",    // 이름
      "ownerLoginId": "", // 로그인ID(이메일)
      "projectName": "",
      "buyerCountPerStep": { "DB": 0, "List": 0, "Lead": 0, "Target": 0, "Client": 0 },
      "salesLogCount": 0  // 활동(영업)일지 수
    }
  ],
  "totalElements": 0, "totalPages": 0, "currentPage": 0
}
```
> `buyerCountPerStep`은 해당 프로젝트에 존재하는 단계만 키로 포함될 수 있음(0인 단계는 생략될 수 있으니 프론트에서 기본 0 처리).

### 3. 관리 대상 사용자 추가
**`POST /api/admin/managed-users`**
- `Content-Type: application/json`
- **Request Body:**
```jsonc
{ "userId": 1 }
```
- 검증:
  - `userId` 누락 → `400` (`common.INVALID_REQUEST`)
  - 존재하지 않는/삭제된 사용자 → `404` (`user.USER_NOT_FOUND`)
  - 이미 등록된 사용자 → `400` (`common.ALREADY_REPORTED`)
- 추가한 관리자는 `created_admin_id`로 기록됨 (JWT principal 기준).
- **Response `data`:** 등록된 `ManagedUserDTO`

### 4. 관리 대상 사용자 제거
**`DELETE /api/admin/managed-users/{userId}`**
- soft delete (`managed_users.deletedAt` 세팅). Body 없음.
- 미등록/이미 제거됨 → `404` (`common.NOT_FOUND`)
- 제거 후 해당 사용자는 #2 검색 결과에 다시 노출됨.

### 5. 관리 대상 사용자의 프로젝트 목록
**`GET /api/admin/managed-users/{userId}/projects`**
- 해당 사용자가 생성자(`createUser`)인 프로젝트 목록. 삭제되지 않고 `status = ACTIVE`인 사용자 기준.
- 각 항목에 `isBookmark`(요청 관리자 기준 즐겨찾기 여부) 포함.
- **Response `data`:** `ProjectDTO[]` (`isBookmark` 포함)

### 5-1. 프로젝트 생성
**`POST /api/admin/managed-users/{userId}/projects`**
- `Content-Type: application/json`
- **Request Body:** `{ "projectName": "..." }`
- 생성되는 프로젝트의 생성자(`createUser`)는 경로의 `{userId}`, 생성 관리자(`createdAdmin`)는 JWT principal.
- `projectName` 누락/공백 → `400` (`common.INVALID_REQUEST`)
- 바이어 단계 명칭(List/Lead/Target/Client)은 기본값으로 자동 세팅.
- **Response `data`:** 생성된 `ProjectDTO`

### 6. 프로젝트 단건
**`GET /api/admin/managed-users/{userId}/projects/{projectId}`**
- 프로젝트 단건 상세 (바이어 단계별 카운트 · 영업일지 총계 · `isBookmark` 포함).
- 존재하지 않는 프로젝트 → `404` (`project.PROJECT_NOT_FOUND`)
- **Response `data`:** `ProjectDTO` (`isBookmark` 포함)

### 6-1. 프로젝트 즐겨찾기 추가/제거
**`PUT /api/admin/managed-users/{userId}/projects/{projectId}/setBookmark`**
- **Request Body:** `boolean` (`true`=추가, `false`=제거)
- **관리자 개별** 즐겨찾기. `managed_project_bookmarks` 테이블에 `(created_admin_id, project_id)` 단위로 저장(중복 없음, idempotent).
- `isBookmark`(#5/#6)는 **요청한 관리자 기준**으로 계산됨.

---

## 바이어/영업일지 (#7~#23, 읽기+쓰기 풀 미러)

> base path: `/api/admin/managed-users/{userId}/projects/{projectId}/buyer`
> 기존 `ProjectBuyerController`(`/api/admin/project/{projectId}/buyer/...`)와 **요청/응답·동작 완전 동일**. 아래는 요약이며, 상세는 `api_admin_global_sales_tracker.md` #4~#20 참고.

| # | Method | Path (base 생략) | Req Body / 비고 | Response `data` |
|---|--------|------------------|------------------|------------------|
| 7 | `GET` | `/list` | - | `BuyerDTO[]` |
| 8 | `GET` | `/manager/list` | - | `BuyerManagerDTO[]` |
| 9 | `POST` | `/store` | `BuyerDetailDTO` (`{buyer, buyerManagers}`) | - |
| 10 | `POST` | `/excel-upload` | `multipart` (`file`) | `BuyerDTO[]` |
| 11 | `GET` | `/{buyerId}/detail` | - | `BuyerDetailDTO` |
| 12 | `DELETE` | `/{buyerId}` | - | - |
| 13 | `GET` | `/getBookmarks` | - | `BuyerBookmarkDTO[]` |
| 14 | `PUT` | `/{buyerId}/setBookmark` | `boolean` | - |
| 15 | `PUT` | `/{buyerId}/setPublic` | `boolean` | - |
| 16 | `GET` | `/{buyerId}/buyerStepHistories` | - | `BuyerStepHistoryDTO[]` |
| 17 | `POST` | `/{buyerId}/setBuyerRelease` | `boolean` | - |
| 18 | `PUT` | `/{buyerId}/updateBuyerStep` | `BuyerStepHistoryDTO` | - |
| 19 | `GET` | `/{buyerId}/salesLogs` | - | `BuyerSalesLogDTO[]` |
| 20 | `GET` | `/{buyerId}/salesLogsNoContents` | - | `BuyerSalesLogDTO[]` (content 비어있음) |
| 21 | `GET` | `/{buyerId}/salesLog/{buyerSalesLogId}` | - | `BuyerSalesLogDTO` |
| 22 | `POST` | `/{buyerId}/salesLog/store` | `multipart` (`buyerSalesLog` JSON + `uploadFiles`) | `BuyerSalesLogDTO` |
| 23 | `POST` | `/{buyerId}/salesLog/{buyerSalesLogId}/delete` | - | - |

---

## 신규 테이블 (`managed_users`)

```sql
CREATE TABLE IF NOT EXISTS managed_users
(
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    user_id          BIGINT UNSIGNED DEFAULT NULL COMMENT 'users pk, 관리 대상 사용자',
    created_admin_id BIGINT UNSIGNED DEFAULT NULL COMMENT 'admins pk, 추가한 관리자',
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP  NULL DEFAULT NULL,
    INDEX IDX_managed_users_user_id (user_id),
    CONSTRAINT FK_managed_users_user_id FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT FK_managed_users_created_admin_id FOREIGN KEY (created_admin_id) REFERENCES admins (id)
) COMMENT '관리 대상 사용자 테이블' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS managed_project_bookmarks
(
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    project_id       BIGINT UNSIGNED NOT NULL COMMENT 'projects pk, 즐겨찾기 프로젝트',
    created_admin_id BIGINT UNSIGNED NOT NULL COMMENT 'admins pk, 즐겨찾기한 관리자 (소유자)',
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UK_managed_project_bookmarks_admin_project UNIQUE (created_admin_id, project_id),
    CONSTRAINT FK_managed_project_bookmarks_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT FK_managed_project_bookmarks_created_admin FOREIGN KEY (created_admin_id) REFERENCES admins (id)
) COMMENT '관리 대상 프로젝트 즐겨찾기 테이블 (관리자 개별)' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> 스키마는 `core/src/main/resources/db/mariadb/schema.sql`에도 반영됨. (`ddl-auto=none` — 수동 적용)

---

## 비고
- 등록 흐름: **#2 `search-users`로 미등록 사용자 조회 → #3 `POST`로 추가**. 추가 시 해당 사용자는 검색 결과에서 자동 제외됨.
- 응답의 `UserDTO.password`는 항상 `null`로 내려감.
- 권한: 도메인 전체가 `/api/admin/**` 하위로 Admin JWT 인증 필요.
