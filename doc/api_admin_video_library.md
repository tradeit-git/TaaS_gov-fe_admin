# Admin Video Library API 명세

**Base URL:** `http://localhost:2001/api/admin/video-library`
**인증:** Admin JWT 토큰 필요 (`Authorization: Bearer {token}`)

> 보도자료(`/api/admin/news`)와 구조가 동일하며, 다음 3개 필드가 추가됩니다.
> - `tags`: 컬러 태그 배열 (`{color, name}`)
> - `pinned`: 상단 고정 여부 (목록 토글, **게시·비공개 포함 최대 4개**)
> - `content`: 상세내용 (TEXT, 등록/수정 시 필수)
>
> **참고**
> - `videoUrl`은 **유튜브 도메인(`youtube.com`/`youtu.be`)** 만 허용합니다.
> - 상단 고정(`pinned=true`)은 게시 여부와 무관하게 전체 **최대 4개**까지만 가능합니다.

---

## API 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/admin/video-library/list` | 영상 목록 조회 (페이징 + 검색 + 필터) |
| `GET` | `/api/admin/video-library/{id}` | 영상 단건 조회 |
| `POST` | `/api/admin/video-library` | 영상 등록 |
| `PUT` | `/api/admin/video-library/{id}` | 영상 수정 |
| `DELETE` | `/api/admin/video-library/{id}` | 영상 삭제 (soft delete) |
| `PUT` | `/api/admin/video-library/{id}/published` | 게시 여부 토글 |
| `PUT` | `/api/admin/video-library/{id}/pinned` | 상단 고정 여부 토글 |
| `POST` | `/api/admin/video-library/upload-thumbnail` | 썸네일 이미지 업로드 (multipart) |

---

## 1. 영상 목록 조회

**`GET /api/admin/video-library/list`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|------|----------|------|------|--------|------|
| Query | `page` | Integer | X | `1` | 페이지 번호 (1부터 시작) |
| Query | `size` | Integer | X | `10` | 페이지당 항목 수 (`10` \| `20` \| `50`) |
| Query | `search` | String | X | - | 제목 검색 (부분 일치) |
| Query | `published` | Boolean | X | - | 게시 여부 필터. `true`(게시) \| `false`(게시중단) |

> **정렬:** `pinned`(상단고정) 우선, 그다음 `createdAt` 내림차순.
> **필터 조합:** `search`, `published`는 동시 사용 가능하며 AND로 결합됩니다.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "content": [
      {
        "id": 4,
        "title": "트레이드잇, 실리콘밸리 '플러그앤플레이' 서밋 참가",
        "thumbnailUrl": "https://cdn.tradeit.co.kr/video-library/abc.png",
        "tags": [
          { "color": "#37B3F2", "name": "서비스소개" }
        ],
        "content": "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가합니다.",
        "videoUrl": "https://www.youtube.com/watch?v=abc123",
        "duration": 795,
        "viewCount": 0,
        "published": true,
        "pinned": true,
        "createdAt": "2026-05-26T10:55:00",
        "updatedAt": "2026-05-26T10:55:00"
      }
    ],
    "totalElements": 4,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### Response Fields — `data`

| 필드 | 타입 | 설명 |
|------|------|------|
| `content` | Array\<VideoLibraryDTO\> | 영상 목록 (하단 VideoLibraryDTO 참조) |
| `totalElements` | Long | 전체 영상 수 (필터 적용 후) |
| `totalPages` | Integer | 전체 페이지 수 |
| `currentPage` | Integer | 현재 페이지 번호 (1-based) |

---

## 1-1. 영상 단건 조회

**`GET /api/admin/video-library/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 영상 PK |

> 삭제된(soft delete) 영상은 조회되지 않습니다. 관리자 편집용이라 조회수(`viewCount`)는 증가하지 않습니다.

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 4,
    "title": "트레이드잇, 실리콘밸리 '플러그앤플레이' 서밋 참가",
    "thumbnailUrl": "https://cdn.tradeit.co.kr/video-library/abc.png",
    "tags": [{ "color": "#37B3F2", "name": "서비스소개" }],
    "content": "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가합니다.",
    "videoUrl": "https://www.youtube.com/watch?v=abc123",
    "duration": 795,
    "viewCount": 0,
    "published": true,
    "pinned": true,
    "createdAt": "2026-05-26T10:55:00",
    "updatedAt": "2026-05-26T10:55:00"
  }
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "영상을 찾을 수 없습니다."
}
```

---

## 2. 영상 등록

**`POST /api/admin/video-library`**

### Request Body (`application/json`)

```json
{
  "title": "트레이드잇, 실리콘밸리 '플러그앤플레이' 서밋 참가",
  "thumbnailUrl": "https://cdn.tradeit.co.kr/video-library/abc.png",
  "tags": [
    { "color": "#37B3F2", "name": "서비스소개" }
  ],
  "content": "트레이드잇이 실리콘밸리에서 열린 플러그앤플레이 서밋에 참가합니다.",
  "videoUrl": "https://www.youtube.com/watch?v=abc123",
  "duration": 795,
  "published": true,
  "pinned": false
}
```

### Request Fields

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | String | O | 제목 (max 255) |
| `thumbnailUrl` | String | X | 썸네일 URL (`upload-thumbnail` 응답값, 없으면 `null`) |
| `tags` | Array\<TagItem\> | X | 컬러 태그 배열 (기본 `[]`) |
| `content` | String | O | 상세내용 (TEXT) |
| `videoUrl` | String | O | 유튜브 영상 URL (`youtube.com` / `youtu.be` 도메인만 허용) |
| `duration` | Integer | X | 영상 길이(**초**). 미입력 시 `null` (예: `795` = 13분 15초). 관리자 등록/수정 폼에서는 [체크] 버튼으로 자동 추출되며 저장 시 필수 |
| `published` | Boolean | X | 게시 여부 (기본 `true`) |
| `pinned` | Boolean | X | 상단 고정 여부 (기본 `false`, 게시·비공개 포함 최대 4개) |

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 5,
    "title": "...",
    "thumbnailUrl": "...",
    "tags": [{ "color": "#37B3F2", "name": "서비스소개" }],
    "content": "...",
    "videoUrl": "https://...",
    "duration": 795,
    "viewCount": 0,
    "published": true,
    "pinned": false,
    "createdAt": "2026-06-23T10:00:00",
    "updatedAt": "2026-06-23T10:00:00"
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `400` | `title`/`content`/`videoUrl` 누락 | `{"status":400,"code":"common.INVALID_PARAMETER","message":"필수 항목이 누락되었습니다."}` |
| `400` | `videoUrl` 형식 오류 (http/https 아님) | `{"status":400,"code":"common.INVALID_PARAMETER","message":"영상링크 URL 형식이 올바르지 않습니다."}` |
| `400` | `videoUrl` 이 유튜브 도메인 아님 | `{"status":400,"code":"common.INVALID_PARAMETER","message":"유튜브 영상 URL만 등록할 수 있습니다."}` |
| `400` | 상단 고정 4개 초과 (`pinned=true`) | `{"status":400,"code":"common.INVALID_PARAMETER","message":"상단 고정은 최대 4개까지 가능합니다."}` |

---

## 3. 영상 수정

**`PUT /api/admin/video-library/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 영상 PK |

### Request Body (`application/json`)

등록(2번)과 동일한 필드를 받습니다. (`viewCount`, `createdAt` 은 수정 불가 — 무시됨)

```json
{
  "title": "...",
  "thumbnailUrl": "...",
  "tags": [{ "color": "#8ABF28", "name": "뉴스" }],
  "content": "...",
  "videoUrl": "https://...",
  "duration": 795,
  "published": false,
  "pinned": false
}
```

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "id": 5,
    "title": "...",
    "thumbnailUrl": "...",
    "tags": [{ "color": "#8ABF28", "name": "뉴스" }],
    "content": "...",
    "videoUrl": "https://...",
    "duration": 795,
    "viewCount": 12,
    "published": false,
    "pinned": false,
    "createdAt": "2026-06-23T10:00:00",
    "updatedAt": "2026-06-23T11:00:00"
  }
}
```

### Error Response `404 NOT FOUND`

```json
{
  "status": 404,
  "code": "common.NOT_FOUND",
  "message": "영상을 찾을 수 없습니다."
}
```

---

## 4. 영상 삭제

**`DELETE /api/admin/video-library/{id}`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 영상 PK |

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
  "message": "영상을 찾을 수 없습니다."
}
```

> soft delete 처리 (`deleted_at`에 현재 시간 기록). 삭제된 영상은 목록 조회에서 제외됩니다.

---

## 5. 게시 여부 토글

**`PUT /api/admin/video-library/{id}/published`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 영상 PK |
| Query | `published` | Boolean | O | 변경할 게시 상태 (`true` \| `false`) |

**예시:** `PUT /api/admin/video-library/5/published?published=false`

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
  "message": "영상을 찾을 수 없습니다."
}
```

---

## 6. 상단 고정 여부 토글

**`PUT /api/admin/video-library/{id}/pinned`**

### Request

| 구분 | 파라미터 | 타입 | 필수 | 설명 |
|------|----------|------|------|------|
| Path | `id` | Long | O | 영상 PK |
| Query | `pinned` | Boolean | O | 변경할 상단 고정 상태 (`true` \| `false`) |

**예시:** `PUT /api/admin/video-library/5/pinned?pinned=true`

> 상단 고정은 게시 여부와 무관하게 전체 **최대 4개**까지만 가능합니다. (이미 고정된 항목을 다시 고정해도 중복 카운트되지 않음)

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `404` | 영상 없음/삭제됨 | `{"status":404,"code":"common.NOT_FOUND","message":"영상을 찾을 수 없습니다."}` |
| `400` | 상단 고정 4개 초과 (`pinned=true`) | `{"status":400,"code":"common.INVALID_PARAMETER","message":"상단 고정은 최대 4개까지 가능합니다."}` |

---

## 7. 썸네일 이미지 업로드

**`POST /api/admin/video-library/upload-thumbnail`**

### Request (`multipart/form-data`)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `image` | File | O | 썸네일 이미지 파일 (JPG / PNG, 1장, 501 × 281px 권장) |

> 허용 확장자: `.png`, `.jpg`, `.jpeg` / 허용 MIME: `image/png`, `image/jpeg`

### Response `200 OK`

```json
{
  "status": 200,
  "code": "common.SUCCESS",
  "message": null,
  "data": {
    "thumbnailUrl": "https://cdn.tradeit.co.kr/video-library/abc.png"
  }
}
```

### Error Responses

| 상태 | 조건 | 응답 |
|------|------|------|
| `400` | 허용되지 않는 형식 | `{"status":400,"code":"common.INVALID_FILE","message":"JPG 또는 PNG 이미지만 업로드 가능합니다."}` |
| `413` | 용량 초과 | `{"status":413,"code":"common.FILE_TOO_LARGE","message":"파일 용량이 너무 큽니다."}` |

---

## VideoLibraryDTO 필드 상세

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `id` | Long | N | PK (BIGINT UNSIGNED) |
| `title` | String | N | 제목 (max 255) |
| `thumbnailUrl` | String | Y | 썸네일 이미지 URL (미등록 시 `null`) |
| `tags` | Array\<TagItem\> | N | 컬러 태그 배열 (없으면 `[]`) |
| `content` | String | N | 상세내용 (TEXT) |
| `videoUrl` | String | N | 유튜브 영상 URL (`youtube.com` / `youtu.be`) |
| `duration` | Integer | Y | 영상 길이(초). 미등록 시 `null` |
| `viewCount` | Long | N | 조회수 (기본 `0`) |
| `published` | Boolean | N | 게시 여부 (기본 `true`) |
| `pinned` | Boolean | N | 상단 고정 여부 (기본 `false`) |
| `createdAt` | String (ISO 8601) | N | 등록일시 |
| `updatedAt` | String (ISO 8601) | N | 최종 수정일 |

### TagItem 필드

| 필드 | 타입 | Nullable | 설명 |
|------|------|----------|------|
| `color` | String | N | HEX 컬러값. `#FF7063` \| `#FFBB00` \| `#8ABF28` \| `#37B3F2` \| `#AD70EE` \| `#FF5E91` |
| `name` | String | N | 태그명 (max 50) |

---

## 테이블 구조 (MariaDB)

> 컨벤션: `BIGINT UNSIGNED` PK, `utf8mb4`, snake_case, `deleted_at` soft delete, `admins` FK.
> 태그는 순서 보존·영상별 종속 값이므로 자식 테이블(1:N)로 정규화한다.

```sql
CREATE TABLE IF NOT EXISTS video_library
(
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    title            VARCHAR(255)    NOT NULL COMMENT '제목',
    thumbnail_url    VARCHAR(500)         DEFAULT NULL COMMENT '썸네일 이미지 URL',
    content          TEXT            NOT NULL COMMENT '상세내용',
    video_url        VARCHAR(500)    NOT NULL COMMENT '영상링크 URL',
    duration         INT UNSIGNED         DEFAULT NULL COMMENT '영상 길이(초), 유튜브에서 추출',
    view_count       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '조회수',
    published        TINYINT(1)      NOT NULL DEFAULT 1 COMMENT '게시 여부 (1:게시, 0:중단)',
    pinned           TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '상단 고정 여부',
    created_admin_id BIGINT UNSIGNED      DEFAULT NULL COMMENT 'admins pk, 등록한 관리자',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP  NULL DEFAULT NULL,
    INDEX IDX_video_library_list (deleted_at, published, pinned, created_at),
    CONSTRAINT FK_video_library_created_admin_id FOREIGN KEY (created_admin_id) REFERENCES admins (id)
) COMMENT '영상라이브러리 테이블' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS video_library_tags
(
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    video_library_id BIGINT UNSIGNED NOT NULL COMMENT 'video_library pk',
    color            VARCHAR(7)      NOT NULL COMMENT 'HEX 컬러값 (#RRGGBB)',
    name             VARCHAR(50)     NOT NULL COMMENT '태그명',
    sort_order       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '노출 순서 (0부터)',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX IDX_video_library_tags_video (video_library_id, sort_order),
    CONSTRAINT FK_video_library_tags_video FOREIGN KEY (video_library_id)
        REFERENCES video_library (id) ON DELETE CASCADE
) COMMENT '영상라이브러리 태그 테이블' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 인덱스 / 정렬 설계 근거

- **`IDX_video_library_list (deleted_at, published, pinned, created_at)`** — 목록 조회의 기본 동선(삭제 제외 → 게시 필터 → `pinned DESC, created_at DESC` 정렬)을 한 인덱스로 커버.
- **제목 검색(`search`)** 은 `LIKE '%키워드%'` 부분 일치라 B-Tree 인덱스가 무효하다. 데이터가 커지면 `title` 에 `FULLTEXT` 인덱스 추가를 검토.
- **`video_library_tags`** 는 `ON DELETE CASCADE` — 영상 hard delete 시 태그 자동 제거. (단, 본 테이블은 soft delete가 기본이므로 평소엔 CASCADE 미발동)

### 대안: 태그를 JSON 컬럼으로 보관

태그를 별도 조회/집계할 일이 없다면 자식 테이블 대신 본 테이블에 인라인할 수 있다. 조인이 사라지지만 개별 태그 검색·정렬·무결성 제약은 포기한다.

```sql
-- video_library 에 컬럼 추가, video_library_tags 테이블 생략
tags JSON NULL COMMENT '[{"color":"#37B3F2","name":"서비스소개"}, ...]'
```
