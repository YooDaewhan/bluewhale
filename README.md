# Bluewhale The Fruit

열대과일·과일 바구니 쇼핑몰 (Next.js 16 + MySQL 8). 장바구니만 브라우저에 두고, 나머지는 전부 DB에 저장합니다.
> `AGENTS.md`: 이 Next.js는 기존과 다릅니다. 코드 작성 전 `node_modules/next/dist/docs/`를 확인하세요.

```bash
npm run dev                                              # http://localhost:3000 (.env.local 필요)
node --test scripts/basket-total.test.mjs scripts/tenant.test.mjs   # 금액 계산 · 테넌트 판별 (DB 불필요)
node --env-file=.env.local --test scripts/api.test.mjs   # API 전 구간 (dev 서버 + 테스트용 DB에 쓰고 지움)
```

## 환경 변수 (`.env.local`, 서버는 `/etc/bluewhale.env`)

| 이름 | 내용 |
|---|---|
| `DATABASE_URL` | `mysql://user:pw@host:3306/db` |
| `SESSION_SECRET` | 관리자 세션 쿠키 서명 키 (임의의 긴 문자열) |
| `UPLOAD_DIR` | 업로드 사진 저장 폴더. 없으면 `./uploads`. 운영은 앱 폴더 밖(재배포해도 유지) |
| `DEV_ADMIN_ID`, `DEV_ADMIN_PW` | `scripts/api.test.mjs`가 쓰는 테스트용 본사 관리자 |

DB 구조는 [db/schema.sql](db/schema.sql) (`mysql <db> < db/schema.sql`, 여러 번 실행해도 안전).
관리자 계정 생성·비밀번호 재설정: `node --env-file=.env.local scripts/set-admin.mjs <가맹점 slug> <아이디>`.

## 구조

- **서버**: [app/server.ts](app/server.ts)(DB, 테넌트, 세션) + `app/api/*/route.ts`. 금액은 항상 서버가 DB 가격으로 다시 계산합니다.
- **클라이언트**: [app/store.tsx](app/store.tsx)가 `/api/state`로 한 번에 불러오고, 화면은 `useStore()`만 씁니다.
- **사진**: 관리자가 올린 파일을 브라우저에서 JPEG로 줄여 `/api/upload`로 전송 → `UPLOAD_DIR/<가맹점>/<랜덤>.jpg`, DB에는 경로(`/uploads/...`)만 저장. 외부 링크는 받지 않습니다.
- **로그인**: 관리자만 (아이디/비밀번호, 서명된 httpOnly 쿠키). 고객은 비회원으로 예약·주문하며, 카카오 로그인은 미연동(`members.kakao_id` 칸만 준비).

## 프렌차이즈 (멀티 테넌트)

| 주소 | 테넌트 |
|---|---|
| `www.a.com`, `a.com` | 본사 (`hq`) |
| `seoul.a.com` | 가맹점 `seoul` |

- 서브도메인이 곧 가맹점 slug입니다. 판별은 [app/tenant.ts](app/tenant.ts)의 `tenantFrom()` 하나뿐이고, 서버가 `Host` 헤더로 가맹점을 찾아 모든 쿼리를 `franchise_id`로 제한합니다.
- DB는 하나입니다. **등록**(본사 관리자 → `프렌차이즈 관리`) = `franchises` 한 줄 + 가맹점 관리자 계정 + 본사 메뉴 복사. 주문·예약은 빈 상태로 시작하고, 복사 후 메뉴는 각자 수정합니다.
- 관리자 세션은 소속 가맹점에서만 유효합니다. 본사 관리자도 가맹점 주소에서는 로그인되지 않은 상태입니다.
- **개별 과일 켜기/끄기**: `프렌차이즈 관리` 표의 체크박스(본사 포함). 꺼져 있으면 메인에는 `과일 바구니`만 보입니다. 기본값은 꺼짐.
- 서브도메인 `www, hq, admin, api, app`은 예약어입니다.
- 서브도메인 없이 테스트: `/?tenant=seoul` (탭 세션 동안 유지, `/?tenant=hq`로 복귀). 실제 서브도메인에서는 무시됩니다.
- LAN IP로 접속할 때는 `next.config.ts`의 `allowedDevOrigins`에 그 IP가 있어야 버튼이 동작합니다.

### 아직 안 된 것
- 가맹점 서브도메인을 실제로 열려면 와일드카드 DNS(`*.도메인`)와 그 인증서, nginx `server_name` 추가가 필요합니다.
- 카카오 로그인, 회원 주문 내역 조회(`/orders`), 엑셀 다운로드.
