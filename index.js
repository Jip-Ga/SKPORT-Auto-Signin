/**
 * ╔══════════════════════════════════════════════════════╗
 * ║   🪐 엔드필드 자동 출석 시스템 (GitHub Actions 버전)   ║
 * ╚══════════════════════════════════════════════════════╝
 * 원본(Google Apps Script) : https://arca.live/b/akendfield/177104489
 */

import fetch from "node-fetch";
import crypto from "crypto";
import fs from "fs";

/**
 * =========================================================================
 * [설정 불러오기]
 * =========================================================================
 * 모든 값을 GitHub Secret "ENDFIELD_CONFIG" 하나에 JSON으로 등록해서 사용합니다.
 */
function loadConfig() {
  const raw = process.env.ENDFIELD_CONFIG;
  if (!raw) {
    throw new Error(
      "ENDFIELD_CONFIG 환경변수(Secret)가 설정되지 않았습니다. README를 참고해서 GitHub Secret을 등록해주세요."
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("ENDFIELD_CONFIG 파싱 실패: JSON 형식이 올바른지 확인해주세요. " + e.message);
  }
  if (!parsed || !Array.isArray(parsed.ACCOUNTS)) {
    throw new Error('ENDFIELD_CONFIG의 "ACCOUNTS" 값이 배열이 아닙니다. 형식을 확인해주세요.');
  }
  return parsed.ACCOUNTS;
}

let RAW_ACCOUNTS;
try {
  RAW_ACCOUNTS = loadConfig();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// 디스코드 웹훅 URL/이름/프로필 이미지가 빈칸인 계정은
// 배열 안에서 "마지막으로 값이 채워진" 계정의 값을 그대로 가져다 씁니다.
function lastNonEmpty(list, key) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i][key]) return list[i][key];
  }
  return "";
}

const fallbackWebhook = lastNonEmpty(RAW_ACCOUNTS, "discordWebhook");
const fallbackAvatar = lastNonEmpty(RAW_ACCOUNTS, "discordWebhookAvatarUrl");
const fallbackName = lastNonEmpty(RAW_ACCOUNTS, "discordWebhookName");

const ACCOUNTS = RAW_ACCOUNTS.map((acc) => ({
  accountToken: acc.accountToken || "",
  accountName: acc.accountName || "닉네임",
  skGameRole: acc.skGameRole || "",
  serverId: acc.serverId || "2",
  discordWebhook: acc.discordWebhook || fallbackWebhook,
  discordWebhookAvatarUrl: acc.discordWebhookAvatarUrl || fallbackAvatar,
  discordWebhookName: acc.discordWebhookName || fallbackName
}));

// 디스코드 웹훅 설정


/* ───────────────────────────────────────────── */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function base64DecodeToString(s) {
  return Buffer.from(s, "base64").toString("utf-8");
}

function md5Hex(str) {
  return crypto.createHash("md5").update(str, "utf-8").digest("hex");
}

function hmacSha256Hex(message, key) {
  return crypto.createHmac("sha256", key).update(message, "utf-8").digest("hex");
}

/**
 * fetch 응답을 JSON으로 파싱하되, 실패하면(HTML 에러 페이지가 온 경우 등)
 * "어느 단계에서, HTTP 상태 코드가 몇이고, 응답이 어떻게 시작하는지"를
 * 로그로 남겨서 나중에 디버깅하기 쉽게 만듭니다.
 */
async function safeParseJson(res, stepName) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    const preview = text.slice(0, 200).replace(/\s+/g, " ");
    console.error(`⚠️ [${stepName}] JSON 파싱 실패 (HTTP ${res.status})`);
    console.error(`⚠️ [${stepName}] 응답 미리보기: ${preview}`);
    throw new Error(`[${stepName}] 응답이 JSON이 아닙니다 (HTTP ${res.status})`);
  }
}

class EndfieldClient {
  constructor(cfg) {
    this.cfg = cfg;
    try {
      this.cfg.accountToken = decodeURIComponent(this.cfg.accountToken);
    } catch (e) {
      /* 그대로 사용 */
    }
    this.role = `3_${this.cfg.skGameRole}_${this.cfg.serverId || "2"}`;
    this.baseUrl = base64DecodeToString("aHR0cHM6Ly96b25haS5za3BvcnQuY29tL3dlYi92MQ==");
    this.authUrl = base64DecodeToString("aHR0cHM6Ly9hcy5ncnlwaGxpbmUuY29t");
  }

  async run() {
    try {
      console.log("🔄 인증 정보 갱신 중...");
      const auth = await this._authenticate(this.cfg.accountToken);
      const ts = Math.floor(Date.now() / 1000).toString();

      const headers = {
        Accept: "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        cred: auth.cred,
        Origin: "https://game.skport.com",
        platform: "3",
        Referer: "https://game.skport.com/",
        "sk-game-role": this.role,
        "sk-language": "ko",
        timestamp: ts,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        vname: "1.0.0"
      };

      const url = `${this.baseUrl}/game/endfield/attendance`;

      // 1. GET 요청 (오늘 출석 여부 확인)
      headers.sign = this._sign1(ts, auth.cred);
      const getRes = await fetch(url, { method: "GET", headers });

      // 방화벽(WAF) 쿠키 장착
      const setCookie = getRes.headers.raw()["set-cookie"];
      if (setCookie && setCookie.length > 0) {
        headers.Cookie = setCookie.join("; ");
        console.log("🍪 보안 쿠키(WAF) 장착 완료");
      }

      const getJson = await safeParseJson(getRes, "출석 여부 확인(GET)");
      if (getJson.code === 0 && getJson.data && getJson.data.hasToday) {
        return this._parseResult(getJson, "이미 출석 완료");
      }

      console.log("🎁 출석 보상 수령 시도...");
      headers.sign = auth.token
        ? this._sign2("/web/v1/game/endfield/attendance", ts, auth.token)
        : this._sign1(ts, auth.cred);

      const postRes = await fetch(url, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: ""
      });
      const postJson = await safeParseJson(postRes, "출석 보상 수령(POST)");
      if (postJson.code !== 0) {
        return { ok: false, msg: `요청 실패 (코드: ${postJson.code}, 메시지: ${postJson.message})` };
      }

      await sleep(1500);
      headers.sign = this._sign1(ts, auth.cred);
      const finalRes = await fetch(url, { method: "GET", headers });
      const finalJson = await safeParseJson(finalRes, "최종 결과 확인(GET)");
      return this._parseResult(finalJson, "출석 성공 (보상 수령됨)");
    } catch (e) {
      return { ok: false, msg: `오류: ${e.message}` };
    }
  }

  /**
   * run()을 실행하다가 WAF 챌린지 페이지(JSON이 아닌 응답)를 만나서 실패하면,
   * 몇 초 기다렸다가 인증부터 다시 시도합니다. (최대 maxAttempts번)
   * 쿠키 만료처럼 재시도해도 어차피 실패할 게 뻔한 오류는 바로 결과를 반환합니다.
   */
  async runWithRetry(maxAttempts = 3, delayMs = 8000) {
    let lastResult = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastResult = await this.run();

      if (lastResult.ok) return lastResult;

      const isWafChallenge = lastResult.msg.includes("응답이 JSON이 아닙니다");
      if (!isWafChallenge) return lastResult; // 재시도해도 소용없는 오류(쿠키 만료 등)는 바로 반환

      if (attempt < maxAttempts) {
        console.log(`⏳ 보안 챌린지 페이지 감지 → ${delayMs / 1000}초 대기 후 재시도 (${attempt}/${maxAttempts})`);
        await sleep(delayMs);
      }
    }
    return lastResult;
  }

  async _authenticate(token) {
    const r1 = await fetch(`${this.authUrl}/user/info/v1/basic?token=${encodeURIComponent(token)}`);
    const d1 = await safeParseJson(r1, "인증 1단계(토큰 확인)");
    if (d1.status !== 0) throw new Error("토큰 오류");

    const r2 = await fetch(`${this.authUrl}/user/oauth2/v2/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, appCode: "6eb76d4e13aa36e6", type: 0 })
    });
    const d2 = await safeParseJson(r2, "인증 2단계(oauth grant)");
    if (d2.status !== 0) throw new Error("인증 실패 (Step 2)");

    const r3 = await fetch(`${this.baseUrl}/user/auth/generate_cred_by_code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", platform: "3" },
      body: JSON.stringify({ code: d2.data.code, kind: 1 })
    });
    const d3 = await safeParseJson(r3, "인증 3단계(cred 발급)");
    if (d3.code !== 0) throw new Error("인증 실패 (Step 3)");

    return { cred: d3.data.cred, token: d3.data.token };
  }

  _sign1(ts, cred) {
    return md5Hex(`timestamp=${ts}&cred=${cred}`);
  }

  _sign2(path, ts, token) {
    const combined = path + ts + JSON.stringify({ platform: "3", timestamp: ts, dId: "", vName: "1.0.0" });
    const hmac = hmacSha256Hex(combined, token);
    return md5Hex(hmac);
  }

  _parseResult(data, defaultMsg) {
    let rewardName = "알 수 없음";
    let count = "0";
    let icon = "";
    if (data.code === 0 && data.data && data.data.calendar) {
      const done = data.data.calendar.filter((x) => x.done).pop();
      if (done) {
        const info = data.data.resourceInfoMap[done.awardId];
        if (info) {
          rewardName = info.name;
          count = info.count;
          icon = info.icon;
        }
      }
    }
    return { ok: true, msg: defaultMsg, rw: rewardName, ct: count, ic: icon };
  }
}

/**
 * 구글 드라이브 공유 링크를 이미지 다이렉트 링크로 변환합니다.
 */
function toDirectImageUrl(url) {
  const m1 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const m2 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const id = (m1 && m1[1]) || (m2 && m2[1]);
  if (!id) return url;
  // thumbnail 엔드포인트가 공유 설정과 무관하게 가장 안정적으로 이미지 바이트를 반환합니다.
  return `https://drive.google.com/thumbnail?id=${id}&sz=w512`;
}

/**
 * 디스코드 웹훅의 프로필(아바타/이름)을 영구적으로 변경합니다.
 */
async function setWebhookProfile(webhookUrl, avatarImageUrl, newName) {
  try {
    const m = webhookUrl.match(/webhooks\/(\d+)\/([^/?]+)/);
    if (!m) {
      console.log("❌ [웹훅 프로필] 웹훅 URL 형식이 올바르지 않습니다.");
      return false;
    }
    const [, webhookId, webhookToken] = m;
    const patchUrl = `https://discord.com/api/webhooks/${webhookId}/${webhookToken}`;

    const body = {};
    if (newName) body.name = newName;

    if (avatarImageUrl) {
      const directUrl = toDirectImageUrl(avatarImageUrl);
      if (directUrl !== avatarImageUrl) {
        console.log(`🔗 [웹훅 프로필] 구글 드라이브 링크 감지 → 다이렉트 링크로 변환: ${directUrl}`);
      }
      const imgRes = await fetch(directUrl, { redirect: "follow" });
      const mimeType = imgRes.headers.get("content-type") || "";

      if (!imgRes.ok || mimeType.indexOf("image/") !== 0) {
        console.log(
          `⚠️ [웹훅 프로필] 이미지 가져오기 실패 - 아바타는 건너뜁니다. (코드: ${imgRes.status}, content-type: ${mimeType})`
        );
        if (mimeType.indexOf("text/html") === 0) {
          console.log(
            "⚠️ [웹훅 프로필] HTML 응답이 왔습니다. 구글 드라이브 파일이 '링크가 있는 모든 사용자'로 공개 공유되어 있는지 확인하세요."
          );
        }
      } else {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        body.avatar = `data:${mimeType};base64,${buf.toString("base64")}`;
      }
    }

    if (Object.keys(body).length === 0) {
      console.log("ℹ️ [웹훅 프로필] 변경할 값이 없어 건너뜁니다.");
      return false;
    }

    const resp = await fetch(patchUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (resp.ok) {
      console.log(`✅ [웹훅 프로필] 변경 완료 (${Object.keys(body).join(", ")})`);
      return true;
    } else {
      console.log(`❌ [웹훅 프로필] 변경 실패 (코드: ${resp.status}, 응답: ${await resp.text()})`);
      return false;
    }
  } catch (e) {
    console.log(`❌ [웹훅 프로필] 오류: ${e.message}`);
    return false;
  }
}

async function sendDiscord(webhook, result, cfg) {
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: result.ok ? "🛰️ 시스템 보고: 작전 성공" : "⚠️ 시스템 보고: 작전 실패",
            description: "**일일 보급품 수령 보고서**",
            color: result.ok ? 5763719 : 15548997,
            fields: [
              { name: "👤 관리자", value: cfg.accountName, inline: true },
              { name: "🆔 UID", value: `\`${cfg.skGameRole}\``, inline: true },
              { name: "📦 획득 보상", value: `**${result.rw}** (x${result.ct})`, inline: false },
              { name: "📝 상세 결과", value: result.msg, inline: false }
            ],
            thumbnail: { url: result.ic || "" },
            footer: { text: `Endfield Daily Helper • ${new Date().toISOString().split("T")[0]}` }
          }
        ]
      })
    });
    if (res.ok) {
      console.log("🔔 디스코드 알림 전송 완료.");
    } else {
      console.log(`🔕 디스코드 전송 실패 (코드: ${res.status})`);
    }
  } catch (e) {
    console.log("🔕 디스코드 전송 실패:", e.message);
  }
}

async function main() {
  const t = new Date().toLocaleString();
  console.log(
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🪐 엔드필드 출석 시스템 가동\n📅 실행 시간 : ${t}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  );

  let hasFailure = false;
  let hasNewSuccess = false; // "출석 성공 (보상 수령됨)"이 하나라도 있으면 true
  // 같은 웹훅에 프로필(이름/아바타) 패치를 중복으로 여러 번 보내지 않기 위한 기록
  const patchedWebhooks = new Set();

  // 수동 실행(workflow_dispatch)인지 여부 (GitHub Actions가 자동으로 넣어주는 값)
  const isManualRun = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";

  for (const account of ACCOUNTS) {
    if (!account.accountToken || !account.skGameRole) {
      console.error(`❌ [오류] "${account.accountName}" 계정의 설정 값이 올바르지 않습니다. GitHub Secret을 확인해주세요.`);
      hasFailure = true;
      continue;
    }

    const client = new EndfieldClient(account);
    const result = await client.runWithRetry();
    const status = result.ok ? "✅" : "❌";

    console.log(
      `\n[ 실행 결과 : ${account.accountName} ] ──────────────────────────────────\n${status} 상 태   : ${result.msg}\n👤 관리자  : ${account.accountName} (UID: ${account.skGameRole})\n🎁 보 상   : ${result.rw || "없음"} (x${result.ct || 0})\n────────────────────────────────────────────────`
    );

    if (!result.ok) hasFailure = true;
    if (result.msg === "출석 성공 (보상 수령됨)") hasNewSuccess = true;

    // 자동 실행 + "이미 출석 완료"면 디스코드 전송을 건너뜀.
    // 수동 실행이거나, 새로 출석 성공/실패했으면 항상 전송.
    const isAlreadyDone = result.msg === "이미 출석 완료";
    const shouldNotify = isManualRun || !isAlreadyDone;

    if (account.discordWebhook) {
      if (shouldNotify) {
        await sendDiscord(account.discordWebhook, result, account);

        // 웹훅 프로필(아바타/이름) 변경이 설정되어 있으면 적용 (같은 웹훅은 한 번만)
        if (
          (account.discordWebhookAvatarUrl || account.discordWebhookName) &&
          !patchedWebhooks.has(account.discordWebhook)
        ) {
          await setWebhookProfile(account.discordWebhook, account.discordWebhookAvatarUrl, account.discordWebhookName);
          patchedWebhooks.add(account.discordWebhook);
        }
      } else {
        console.log(`[${account.accountName}] 이미 완료 상태라 디스코드 전송을 건너뜁니다.`);
      }
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }

  // 워크플로우가 "오늘 새로 출석 성공했는지" 알 수 있도록 GITHUB_OUTPUT에 기록
  // (이걸 보고 워크플로우가 이전 날짜 캐시를 정리할지 결정함)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `had_new_success=${hasNewSuccess}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
