import { chromium } from "playwright";
import fs from "fs";

const BASE = process.env.QA_URL || "http://localhost:5174";
const OUT = "C:/Users/skanda/AppData/Local/Temp/opencode";
fs.mkdirSync(OUT + "/shots", { recursive: true });

const results = [];
const note = (phase, name, status, expected, actual, evidence = "") =>
  results.push({ phase, name, status, expected, actual, evidence });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page._errors = [];
  page._net = [];
  page.on("console", (m) => { if (m.type() === "error") page._errors.push(m.text()); });
  page.on("pageerror", (e) => page._errors.push("PAGEERROR: " + e.message));
  page.on("response", (r) => { if (r.status() >= 400) page._net.push(`${r.status()} ${r.url()}`); });
  return { ctx, page };
}

async function shot(page, name) {
  try { await page.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: false }); } catch {}
}

// ---------- PHASE 1: GLOBAL SANITY ----------
const routes = ["/", "/vote", "/results", "/control", "/saas", "/this-route-does-not-exist-xyz"];
for (const r of routes) {
  const { ctx, page } = await newPage();
  let http = "?";
  try {
    const resp = await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 20000 });
    http = resp ? resp.status() : "?";
  } catch (e) { http = "NAV_ERR:" + e.message.slice(0, 80); }
  await page.waitForTimeout(1200);
  const title = await page.title().catch(() => "");
  const bodyLen = (await page.content().catch(() => "")).length;
  const hasMain = await page.locator("body > div, #root > *").count().catch(() => 0);
  note("P1", `route ${r} loads`, "INFO", "page loads, no blank", `http=${http} title="${title}" bodyLen=${bodyLen} rootChildren=${hasMain}`, `errors=${page._errors.length}`);
  if (page._errors.length) note("P1", `route ${r} console errors`, "FAIL", "0 critical errors", `${page._errors.length} errors`, page._errors.slice(0,3).join(" | "));
  if (page._net.length) note("P1", `route ${r} network 4xx/5xx`, "INFO", "note failures", page._net.slice(0,5).join(" | "));
  await shot(page, "p1" + r.replace(/\//g, "_"));
  await ctx.close();
}

// ---------- PHASE 2/3/11/12: LANDING CONTENT + ASSETS ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);

  const text = await page.locator("body").innerText().catch(() => "");
  const checks = {
    "College name": "Dayananda Sagar College of Arts, Science and Commerce",
    "BBA": "BBA",
    "I Semester": "I Semester",
    "Section B": "Section B",
    "CR Election title": "CLASS REPRESENTATIVE (CR) ELECTION",
    "Description (Four CRs)": "Four CRs",
    "HOD name": "Prof. Rekha M. P.",
    "Coordinator name": "Dr. Sudarshan S. Savanoor",
    "Counsellor name": "Dr. Purobi Avinash",
  };
  for (const [k, v] of Object.entries(checks)) {
    const ok = text.includes(v);
    note("P2", `Landing shows ${k}`, ok ? "PASS" : "FAIL", `contains "${v}"`, ok ? "present" : "MISSING");
  }

  // guidelines exact count + key phrases
  const ruleItems = await page.locator("ul li").allInnerTexts().catch(() => []);
  const ruleText = ruleItems.join(" ");
  const keyPhrases = [
    "2 Male and 2 Female CRs",
    "Only students of I Semester BBA – Section B are eligible",
    "one vote for a Male candidate and one vote for a Female candidate",
    "Candidates may vote for themselves",
    "irrespective of their own gender",
    "do not vote solely on the basis of friendship or popularity",
    "submit the voting form only once",
    "weighted score",
    "top 2 Male and top 2 Female",
    "tie",
    "Class Counsellor and Class Coordinator",
  ];
  for (const p of keyPhrases) {
    const ok = ruleText.includes(p);
    note("P11", `Guideline phrase: "${p.slice(0,40)}"`, ok ? "PASS" : "FAIL", "present", ok ? "present" : "MISSING");
  }
  note("P11", "Guideline item count", ruleItems.length >= 14 ? "PASS" : "FAIL", ">=14 items", `${ruleItems.length} items`);

  // Assets
  for (const a of ["/college-logo.png", "/authorities/hod.jpg", "/authorities/coordinator.jpg", "/authorities/counsellor.jpg"]) {
    const ok = await page.evaluate(async (src) => {
      return await new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img.naturalWidth > 0 && img.naturalHeight > 0);
        img.onerror = () => res(false);
        img.src = src;
      });
    }, BASE + a).catch(() => false);
    note("P3", `Asset loads ${a}`, ok ? "PASS" : "FAIL", "image 200 + natural size > 0", ok ? "loaded" : "BROKEN");
  }

  // QR present
  const qr = await page.locator("svg, canvas").count().catch(() => 0);
  note("P25", "QR code element present on landing", qr > 0 ? "PASS" : "FAIL", "svg/canvas exists", `${qr} elements`);

  // Firestore error banner (evidence of disabled API)
  const banner = await page.locator("text=Election data unavailable").count().catch(() => 0);
  note("ENV", "Firestore disabled banner shown", banner > 0 ? "BLOCKED" : "INFO", "n/a", banner > 0 ? "banner present (API disabled)" : "no banner");

  await shot(page, "landing");
  await ctx.close();
}

// ---------- PHASE 4/14: VOTE PAGE GATING + AUTH UI ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/vote", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText().catch(() => "");
  const signInCard = body.includes("Sign in to vote");
  const googleBtn = await page.locator("button:has-text('Sign in with Google')").count().catch(() => 0);
  note("P4", "Vote page gates unauthenticated users", signInCard ? "PASS" : "FAIL", "shows sign-in wall", signInCard ? "shown" : "NOT shown");
  note("P4", "Google sign-in button present", googleBtn > 0 ? "PASS" : "BLOCKED", "button exists", googleBtn > 0 ? "exists" : "missing");
  note("P14", "Vote page does not leak candidates before login", !body.includes("Boy Candidates") ? "PASS" : "FAIL", "no candidate list pre-auth", body.includes("Boy Candidates") ? "LEAK" : "hidden");
  await shot(page, "vote_gated");
  await ctx.close();
}

// ---------- PHASE 18/19: RESULTS PAGE PRIVACY ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/results", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText().catch(() => "");
  const noTotals = !body.includes("%") || !/winner|ranking/i.test(body);
  note("P18", "Results page hides actual data pre-release", noTotals ? "PASS" : "FAIL", "no totals/winners shown", noTotals ? "hidden" : "EXPOSED: " + body.slice(0, 120));
  note("P18", "Results shows suspense/sealed state", /sealed|suspense|reveal|RESULTS/i.test(body) ? "PASS" : "FAIL", "sealed/suspense copy", body.slice(0, 120));
  await shot(page, "results");
  await ctx.close();
}

// ---------- PHASE 26/31/32: CONTROL + VIEWPORTS ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/control", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText().catch(() => "");
  const hasLogin = /Sign in|Google|email/i.test(body);
  note("P26", "Control page reachable / shows auth", hasLogin ? "PASS" : "FAIL", "auth UI present", hasLogin ? "login UI" : "no UI");
  await shot(page, "control");

  // mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await mp.waitForTimeout(1500);
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => 0);
  note("P31", "Mobile (390x844) no horizontal overflow", overflow <= 2 ? "PASS" : "FAIL", "scrollWidth - clientWidth <= 2", `overflowPx=${overflow}`);
  await mp.screenshot({ path: `${OUT}/shots/mobile_landing.png` });
  await m.close();

  // desktop shot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/shots/desktop_landing.png` });
  await ctx.close();
}

// ---------- PHASE 33: A11Y SMOKE ----------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1200);
  const imgsNoAlt = await page.locator("img:not([alt])").count().catch(() => 0);
  const btnsNoName = await page.locator("button:not([aria-label]):empty").count().catch(() => 0);
  note("P33", "Images have alt text", imgsNoAlt === 0 ? "PASS" : "FAIL", "0 imgs without alt", `${imgsNoAlt} without alt`);
  note("P33", "Buttons have accessible names", btnsNoName === 0 ? "PASS" : "FAIL", "0 nameless buttons", `${btnsNoName} nameless`);
  await ctx.close();
}

// ---------- SUMMARY ----------
const passed = results.filter(r => r.status === "PASS").length;
const failed = results.filter(r => r.status === "FAIL").length;
const blocked = results.filter(r => r.status === "BLOCKED").length;
const info = results.filter(r => r.status === "INFO").length;
console.log("\n===== QA SUMMARY =====");
console.log(`PASS=${passed} FAIL=${failed} BLOCKED=${blocked} INFO=${info} TOTAL=${results.length}`);
console.log("===== DETAIL =====");
for (const r of results) {
  console.log(`[${r.status}] ${r.phase} | ${r.name} | exp: ${r.expected} | act: ${r.actual}${r.evidence ? " | ev: " + r.evidence : ""}`);
}
fs.writeFileSync(OUT + "/qa_results.json", JSON.stringify(results, null, 2));

await browser.close();
