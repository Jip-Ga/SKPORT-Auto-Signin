# SKPORT 자동 출석 (GitHub 버전)

### 현재 `명일방주: 엔드필드`만 지원합니다.

**기능 업데이트 :** `2026-07-29`

**PC 화면에서 작업하시는 걸 추천드립니다.**

**검색 기능 : `Ctrl`+`F`**

**[[원본글](https://arca.live/b/akendfield/177104489)]**

- AI 활용해서 깃허브에서 설정 시간마다 자동으로 출석 시도 하도록 바꾼 버전입니다.
- **출석 시간 설정** 방법은 **맨 아래** [[#5. 출석 시간 설정](https://github.com/Jip-Ga/SKPORT-Auto-Signin/blob/main/README.md#5-출석-시간-설정)] 을 참고하시면 됩니다.
- 계정 여러 개 등록해서 사용 가능합니다.


<details>

<summary> ← 이 모양 있는 문장 누르면 추가 설명이 나오고 </summary>
다시 누르면 닫힙니다. ┛

</details>



---
## #실행 결과

<details>

<summary> 〔 디스코드 핸드폰 알림 〕 </summary>

- 계정 여러 개 사용 시 다른 채널의 웹훅 사용하면 알림이 분리돼서 옵니다.

<img width="500" height="375" alt="20260730_064105" src="https://github.com/user-attachments/assets/97bd1283-cffa-44d3-81a1-2c1a9dae8777" />

</details>


<details>

<summary> 〔 성공 결과 디스코드 전송 〕 </summary>

- **`이미 출석 완료`** 메시지는 수동 실행으로만 디스코드로 보내집니다.

<img width="500" height="353" alt="스크린샷 2026-07-29 190149" src="https://github.com/user-attachments/assets/7c57f858-ef58-446e-b7b8-0bfdc4320ac5" />
<img width="500" height="356" alt="스크린샷 2026-07-29 190201" src="https://github.com/user-attachments/assets/472d25e4-5363-4032-9735-fbc9e562e58f" />


</details>


<details>

<summary> 〔 실패 결과 디스코드 전송 〕 </summary>

- 실패 시 실패 이유가(토큰 만료, API 오류, 조회 불가 등등) 작성 되어 나옵니다.

<img width="1000" height="463" alt="스크린샷 2026-07-30 065049" src="https://github.com/user-attachments/assets/7b5fddd2-a4e0-4c7a-886e-063796532f87" />

<img width="300" height="275" alt="스크린샷 2026-07-30 064621" src="https://github.com/user-attachments/assets/9ce7bc69-cce9-4f2b-9c16-567bb466c1d6" />


</details>

- 자동 실행 출력 : 출석 성공/실패
- 수동 실행 출력 : 출석 성공/실패, 이미 출석 완료


---
## 🚨🚨#주의사항#🚨🚨

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
- **`accountToken` 등 해당 값들은 타인에게 유출되면 게임 계정이 위험해질 수 있으니 **`#3. GitHub Secret`** 에만 등록하시길 경고해 드립니다.**
    - 편의를 위해 따로 보관하시더라도 유출에 유의해서 보관하시길 바랍니다.

- 지난 2026년 7월 14일에 공표된 PAT 유출 사태와는 무관합니다.
    - PAT : 비밀번호 대신 사용하는 개인용 인증 토큰.
        - 깃허브 저장소와 외부 서비스 연결할때 사용.

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

---
## #0. 준비물

1. 깃허브 계정
[[GitHub](https://github.com/)]
, [[로그인 페이지](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fwhy-github%3Flocale%3Dko-kr)]
, [[계정 생성 페이지](https://github.com/signup?return_to=https%3A%2F%2Fgithub.com%2Fwhy-github%3Flocale%3Dko-kr&source=login)]

2. 해당 페이지 우측 위 **`⑂ Fork`** 로 저장소 및 파일 복사

<img width="457" height="70" alt="image" src="https://github.com/user-attachments/assets/7655cff5-70f1-45b2-9c2f-8e1f1c2938a4" />

3. 디스코드 개인 서버의 웹훅 또는 타 서버의 웹훅『선택사항』
4. 메모장 어플『선택사항』
5. 자주 사용하지 않는 브라우저『선택사항』


---
## #1. 디스코드 웹훅 생성 (메모장 작성 추천)

<details>

<summary> 『선택사항』 </summary>

PC 화면에서만 웹후크 생성이 가능합니다.

[[Discord-웹브라우저](https://discord.com/channels/@me)]

1. **개인 서버 만드는 방법은 생략**
2. 채널 생성『선택사항』
3. 해당 채널 우클릭 → `채널 편집(⚙️)` → `연동` 탭 → `웹후크` → `웹후크 만들기` → `웹후크 URL 복사`

</details>


---
## #2. 토큰 값 얻기 (메모장 작성 추천)

- **자주 사용하지 않는 브라우저로 실행하는 것 추천.**
- 동일 브라우저에서 SKPORT에 재로그인 할 경우 토큰값(**"ACCOUNT_TOKEN"**)이 갱신됨.

<details>

<summary> 『필수사항』 </summary>

1. SKPORT 로그인 [[SKPORT](https://www.skport.com/)]
2. 엔드필드 출석체크 페이지 [[엔필 출석 페이지](https://game.skport.com/endfield/sign-in?header=0&hg_media=skport&hg_link_campaign=tools)]
3. `F12` (개발자 도구) 열기
4. 상단 **`Application`** 탭 클릭
5. 왼쪽 **`Cookies`** → `https://game.skport.com` 클릭
6. `F5` (새로고침)
7. Name 목록에서 **`ACCOUNT_TOKEN`** 값을 각각 복사

<img width="592" height="117" alt="스크린샷 2026-07-29 182739" src="https://github.com/user-attachments/assets/2dc75d60-1b30-439e-b4a6-17b52d0bba09" />

해당하는 Value(값) 누르면 **개발자 도구창 맨아래에 자세히** 나옵니다.

- **`ACCOUNT_TOKEN`** = qwER1234Asdf... (랜덤의 영어, 숫자 나열)
- **목록에서 안보일 시 `F5` (새로고침)**

</details>


---
## #3. GitHub Secret 등록하기

<details>

<summary> 『필수사항』 </summary>

1. **`⑂ Fork`** 로 복사된 본인 저장소에서 → **상단 탭 `⚙️Settings`** → 왼쪽 아래 쯤에 `*️⃣Secrets and variables` → `Actions` 
2. **`New repository secret`** (초록색) 클릭
3. Name : **`ENDFIELD_CONFIG`**
4. `Secret` 값에는 아래 형식대로 계정 정보를 작성해서 붙여 넣은 후 등록 :


★【 SKPORT 계정 1개 사용 시 코드 】★

```json
{
  "ACCOUNTS": [
    {
      "accountToken" : "계정1의 로그인 토큰값",
      "accountName" : "계정1의 닉네임",
      "skGameRole" : "계정1의 인겜 UID",
      "serverId" : "2",
      "discordWebhook" : "디스코드 웹훅 URL",
      "discordWebhookAvatarUrl" : "웹훅 프로필 이미지 URL",
      "discordWebhookName" : "웹훅 이름"
    }
  ]
}
```

★【 SKPORT 계정 2개 이상 사용 시 코드 】★

```json
{
  "ACCOUNTS": [
    {
      "accountToken" : "계정1의 로그인 토큰값",
      "accountName" : "계정1의 닉네임",
      "skGameRole" : "계정1의 인겜 UID",
      "serverId" : "2",
      "discordWebhook" : "계정1의 디스코드 웹훅 URL",
      "discordWebhookAvatarUrl" : "계정1의 웹훅 프로필 이미지 URL",
      "discordWebhookName" : "계정1의 웹훅 이름"
    }
    ,{
      "accountToken" : "계정2의 로그인 토큰값",
      "accountName" : "계정2의 닉네임",
      "skGameRole" : "계정2의 인겜 UID",
      "serverId" : "2",
      "discordWebhook" : "계정2의 디스코드 웹훅 URL",
      "discordWebhookAvatarUrl" : "계정2의 웹훅 프로필 이미지 URL",
      "discordWebhookName" : "계정2의 웹훅 이름"
    }
  ]
}
```


<details>

<summary> 계정 더 추가 시 해당 코드 이어 붙이기. </summary>

```json
    ,{
      "accountToken" : "로그인 토큰값",
      "accountName" : "닉네임",
      "skGameRole" : "인겜 UID",
      "serverId" : "2",
      "discordWebhook" : "디스코드 웹훅 URL",
      "discordWebhookAvatarUrl" : "웹훅 프로필 이미지 URL",
      "discordWebhookName" : "웹훅 이름"
    }
```

</details>


## #3-1. 코드 설명 -『필수 입력』

- **`"accountToken"`** = **`ACCOUNT_TOKEN`** `(로그인 토큰값)` ([[#2. 토큰 값 얻기](https://github.com/Jip-Ga/SKPORT-Auto-Signin/blob/main/README.md#2-쿠키-값-얻기-메모장-작성-추천)] 참고)
- **`"skGameRole"`** = 엔드필드 UID
- **`"serverId"`** = 2(아시아 서버)


## #3-2. 코드 설명 -『선택사항』

**미사용 시 입력 :**

```json
"accountName" : ""

"discordWebhook" : ""
"discordWebhookAvatarUrl" : ""
"discordWebhookName" : ""
```

값이 비어 있을 시 가장 마지막에 입력된 값으로 사용 됩니다.

= 모든 계정의 값이 비어야 미사용

- **`"accountName"`** = 계정 분류용 (미작성 시 "닉네임"으로 표기)
    - <img width="507" height="358" alt="image" src="https://github.com/user-attachments/assets/3b424e43-8468-4625-9c1f-68a985625ff9" />
- **`"discordWebhook"`** = 웹훅 URL ([[#1. 디스코드 웹훅 생성](https://github.com/Jip-Ga/SKPORT-Auto-Signin/blob/main/README.md#1-디스코드-웹훅-생성-메모장-작성-추천)] 참고)
- **`"discordWebhookAvatarUrl"`** = 웹훅 프로필
    - 일단 저는 구글 드라이브에 1:1비율 이미지 올리고 공유 상태로 전환해 사용하고 있습니다.
        - [[Google Drive](https://drive.google.com/drive/my-drive)]
- **`"discordWebhookName"`** = 웹훅 이름


</details>


---
## #4. 실행 확인

<details>

<summary> 『필수사항』 </summary>

- **수동 테스트 : **`⑂ Fork`** 로 복사된 본인 저장소의 `▶️Actions` 상단 탭 → `SKPORT 자동 출석 (아무거나)` → `Run workflow ▼` → `Run workflow`**
    - **`▶️Actions`** 탭에서 실행 로그 확인 가능.
    - <img width="300" height="169" alt="image" src="https://github.com/user-attachments/assets/a3a5af77-7ac3-4c88-a862-c61c6b871646" />
      <img width="300" height="156" alt="image" src="https://github.com/user-attachments/assets/e21543a5-1952-4673-a23e-f9bcfd6cd62b" />

</details>


---
## #5. 출석 시간 설정

SKPORT 출석 가능 시간 : `한국시간(KST) 01:00` = `중국시간(CST) 00:00` = `UTC 16:00`

<details>
<summary> 『기본 설정』 </summary>

- **`매일 한국시간(KST) 01:16 ~ 05:46, 20:00 ~ 23:00. 총 8회`**
    - 출석 성공/실패, 수동 실행만 디스코드로 전송됩니다.

</details>

<details>
<summary> 『설정 수정 방법』 </summary>

- **`.github/workflows` 폴더 내부의 `checkin` 파일의 `cron` 값을 수정**
    - `KST 09:10` = `UTC 00:10` = **`cron: "10 0 * * *"`**
    - 시간 변환 추천 사이트 : [[Datetime360](https://datetime360.com/ko/utc-seoul-time/)]
- **하루에 파일 내용을 자주 바꿀 시 스케줄러가 작동 안할 수도 있습니다.**
    - 스케줄러 작동 안하는 **하루만 수동 작동**하고, UTC 기준 **다음날부터 스케줄러가 작동하는지 지켜보면 됩니다.**
    - GitHub 서버에 사람이 많아 생긴 문제라 외부 서비스에서 GitHub API를 호출해서 workflow_dispatch를 트리거 해야합니다.
        - 외부 호출 관련은 AI한테 물어보면 답변 잘해줄겁니다 :)


</details>

---
끝 :)
