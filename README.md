# 엔드필드 자동 출석 (GitHub Actions)

Google Apps Script 전용 코드를 GitHub Actions에서 매일 자동으로 돌아가게 바꾼 버전입니다.
계정 정보는 코드에 넣지 않고 GitHub Secrets에 저장해서 사용합니다.

## 1. 등록해야 할 GitHub Secrets

레포 → **Settings → Secrets and variables → Actions → New repository secret**에서 아래 항목들을 하나씩 등록하세요.

| Secret 이름 | 설명 | 필수 여부 |
|---|---|---|
| `ENDFIELD_ACCOUNT_TOKEN` | 로그인 쿠키값 (accountToken) | 필수 |
| `ENDFIELD_SK_GAME_ROLE` | 인게임 UID (skGameRole) | 필수 |
| `ENDFIELD_ACCOUNT_NAME` | 디스코드 메시지에 표시할 닉네임 | 선택 (없으면 "닉네임"으로 표시) |
| `DISCORD_WEBHOOK` | 디스코드 웹훅 URL | 선택 (없으면 알림 안 보냄) |
| `DISCORD_WEBHOOK_AVATAR_URL` | 웹훅 프로필 이미지로 쓸 URL | 선택 |
| `DISCORD_WEBHOOK_NAME` | 웹훅 이름으로 쓸 값 | 선택 |

`ENDFIELD_SERVER_ID`(서버 ID)는 기본값 `"2"`로 워크플로우 파일에 이미 넣어뒀습니다. 다른 서버를 쓰신다면 `.github/workflows/checkin.yml`의 `ENDFIELD_SERVER_ID` 값을 수정하세요.

## 2. 실행 시간 설정

`.github/workflows/checkin.yml`의 `cron` 값을 원하는 시간으로 바꾸시면 됩니다. (UTC 기준이라 한국시간 - 9시간 = UTC 시간)

## 3. 테스트

Actions 탭 → "엔드필드 자동 출석" → **Run workflow**로 수동 실행해서 정상 작동하는지 확인하세요.

## 주의사항

- `ENDFIELD_ACCOUNT_TOKEN`, `ENDFIELD_SK_GAME_ROLE` 등은 유출되면 계정이 위험해질 수 있으니 GitHub Secret 외의 곳에는 절대 붙여넣지 마세요.
- 이 스크립트는 원본(Google Apps Script) 코드의 인증/서명 로직을 그대로 Node.js로 옮긴 것입니다. 게임 쪽에서 API 스펙을 바꾸면 원본과 마찬가지로 동작하지 않을 수 있습니다.
