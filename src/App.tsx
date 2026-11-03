import { useState, useEffect, useContext, createContext } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { Heart, ThumbsUp, Meh, ThumbsDown, type LucideIcon } from "lucide-react";
import { allSeries, getCurrentSeries, getSeriesColor } from "./data";
import logoBlack from "./assets/logo-black.png";

// ─── Fonts ──────────────────────────────────────────────────────────────────
const hSerif = "'Playfair Display', Georgia, serif";
const hLato = "'Lato', sans-serif";

// ─── Theme ──────────────────────────────────────────────────────────────────
type Theme = { bg: string; ink: string; sub: string; accent: string; rule: string; faint: string };

// Lighten a hex color toward white by `amt` (0–1). Used to lift per-series
// accents so they read on the dark background.
function lighten(hex: string, amt = 0.4): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const up = (c: number) => Math.round(c + (255 - c) * amt);
  const x = (c: number) => up(c).toString(16).padStart(2, "0");
  return `#${x(r)}${x(g)}${x(b)}`;
}

function makeTheme(dark: boolean, accent: string): Theme {
  return dark
    ? { bg: "#16130F", ink: "#EBE4D8", sub: "#8F8576", accent: lighten(accent, 0.42), rule: "#2C2620", faint: "#1E1A15" }
    : { bg: "#FBF9F6", ink: "#211D18", sub: "#998D7D", accent, rule: "#E8E1D6", faint: "#F2EDE5" };
}

const ThemeCtx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });

// ─── Helpers ────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// Render inline markdown (**bold**) as React nodes. Plain text passes through.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function formatDate(dateStr: string | null, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!dateStr) return null;
  // Parse as local date to avoid timezone offset shifting the day
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", opts);
}

function weekDateRange(publishDate: string | null) {
  if (!publishDate) return null;
  const [y, m, d] = publishDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 4);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

const ORDINALS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

// ─── Icons ────────────────────────────────────────────────────────────────────
function ChevronRight({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M5 2.5L9.5 7L5 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M9 2.5L4.5 7L9 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ size = 13, color = "#c0b8b0" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <rect x="2.5" y="5.5" width="8" height="6" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M4.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ dark, toggle, t }: { dark: boolean; toggle: () => void; t: Theme }) {
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: t.sub }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="8" cy="8" r="3.1" />
          <g strokeLinecap="round">
            <line x1="8" y1="1" x2="8" y2="2.6" /><line x1="8" y1="13.4" x2="8" y2="15" />
            <line x1="1" y1="8" x2="2.6" y2="8" /><line x1="13.4" y1="8" x2="15" y2="8" />
            <line x1="3.1" y1="3.1" x2="4.2" y2="4.2" /><line x1="11.8" y1="11.8" x2="12.9" y2="12.9" />
            <line x1="12.9" y1="3.1" x2="11.8" y2="4.2" /><line x1="4.2" y1="11.8" x2="3.1" y2="12.9" />
          </g>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M13 9.6A5.5 5.5 0 0 1 6.4 3 5.5 5.5 0 1 0 13 9.6z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Share Button ─────────────────────────────────────────────────────────────
function ShareButton({ title, text, url, t }: { title: string; text: string; url: string; t: Theme }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label="Share this devotional"
      title={copied ? "Link copied!" : "Share this devotional"}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: copied ? t.accent : t.sub }}
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2.5 7.5L6 11L12.5 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="11.5" cy="3" r="1.8" />
          <circle cx="11.5" cy="12" r="1.8" />
          <circle cx="3.5" cy="7.5" r="1.8" />
          <line x1="9.76" y1="3.9" x2="5.24" y2="6.6" strokeLinecap="round" />
          <line x1="9.76" y1="11.1" x2="5.24" y2="8.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

// ─── Reactions ────────────────────────────────────────────────────────────────
// Anonymous one-tap feedback at the end of each devotional. Each tap is saved
// to Netlify Database (via a Netlify Function) and sent to GA4 as an event.

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

type ReactionKey = "spoke" | "helpful" | "okay" | "not_today";

const REACTIONS: { key: ReactionKey; label: string; Icon: LucideIcon }[] = [
  { key: "spoke", label: "This spoke to me", Icon: Heart },
  { key: "helpful", label: "Helpful", Icon: ThumbsUp },
  { key: "okay", label: "Okay", Icon: Meh },
  { key: "not_today", label: "Not for me today", Icon: ThumbsDown },
];

const REACTIONS_STORE = "hf-reactions";
const VISITOR_STORE = "hf-visitor";

function readReactions(): Record<string, ReactionKey> {
  try { return JSON.parse(localStorage.getItem(REACTIONS_STORE) ?? "{}"); } catch { return {}; }
}

function getVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORE);
    if (existing) return existing;
  } catch { /* storage unavailable — fall through to a one-off id */ }
  let id: string;
  if (typeof crypto.randomUUID === "function") {
    id = crypto.randomUUID();
  } else {
    // RFC 4122 v4 UUID from random bytes, for older browsers.
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  try { localStorage.setItem(VISITOR_STORE, id); } catch { /* ignore */ }
  return id;
}

function ReactionBar({ slug, day, title, t }: { slug: string; day: number; title: string; t: Theme }) {
  const pageKey = `${slug}/${day}`;
  const [selected, setSelected] = useState<ReactionKey | null>(() => readReactions()[pageKey] ?? null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function choose(key: ReactionKey) {
    if (key === selected || status === "saving") return;
    const previous = selected;
    setSelected(key);
    setStatus("saving");

    window.gtag?.("event", "devotional_reaction", {
      reaction: key,
      series: slug,
      day,
      devotional_title: title,
    });

    try {
      const res = await fetch("/.netlify/functions/reactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, day, reaction: key, visitorId: getVisitorId() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      try { localStorage.setItem(REACTIONS_STORE, JSON.stringify({ ...readReactions(), [pageKey]: key })); } catch { /* ignore */ }
      setStatus("saved");
    } catch {
      setSelected(previous);
      setStatus("error");
    }
  }

  const note =
    status === "error" ? "Something went wrong. Please try again."
    : selected ? "Thank you for sharing."
    : "";

  return (
    <div style={{ margin: "36px 26px 0", textAlign: "center" }}>
      <Label t={t} center>How did today’s devotional land?</Label>
      <div role="group" aria-label="Your response to this devotional" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, maxWidth: 380, margin: "0 auto" }}>
        {REACTIONS.map(({ key, label, Icon }) => {
          const on = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              aria-pressed={on}
              disabled={status === "saving"}
              style={{
                background: "none",
                border: "none",
                padding: "4px 2px",
                cursor: status === "saving" ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                color: on ? t.accent : t.sub,
                opacity: selected && !on ? 0.7 : 1,
                transition: "color 160ms ease, opacity 160ms ease",
              }}
            >
              <span style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${on ? t.accent : t.rule}`,
                background: on ? t.faint : "transparent",
                transition: "border-color 160ms ease, background 160ms ease",
              }}>
                <Icon size={19} strokeWidth={on ? 1.9 : 1.4} aria-hidden="true" />
              </span>
              <span style={{ fontFamily: hLato, fontWeight: 400, fontSize: 11, letterSpacing: "0.04em", lineHeight: 1.35 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 13, color: status === "error" ? t.ink : t.sub, minHeight: 20, marginTop: 14 }}>
        {note}
      </p>
    </div>
  );
}

// ─── Ornament & Label ───────────────────────────────────────────────────────
function Ornament({ t, on = true }: { t: Theme; on?: boolean }) {
  if (!on) return <div style={{ width: 80, height: 1, background: t.rule, margin: "26px auto" }} />;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "26px 0" }}>
      <div style={{ width: 48, height: 1, background: t.rule }} />
      <div style={{ width: 6, height: 6, background: t.accent, transform: "rotate(45deg)" }} />
      <div style={{ width: 48, height: 1, background: t.rule }} />
    </div>
  );
}

function Label({ t, center, children }: { t: Theme; center?: boolean; children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: t.accent, textAlign: center ? "center" : "left", marginBottom: 16 }}>
      {children}
    </p>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ t, dark, toggle, share }: { t: Theme; dark: boolean; toggle: () => void; share?: React.ReactNode }) {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 22px",
      borderBottom: `1px solid ${t.rule}`,
      background: t.bg,
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <img src={logoBlack} alt="Harrison Faith" style={{ height: 26, width: "auto", filter: dark ? "invert(1)" : "none", opacity: 0.9 }} />
        <span style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: t.sub }}>
          Weekly Devotionals
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {share}
        <ThemeToggle dark={dark} toggle={toggle} t={t} />
        <Link to="/series" style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: t.accent, textDecoration: "none" }}>
          Series
        </Link>
      </div>
    </header>
  );
}

// ─── Landing Page (Direction A — Quiet Editorial) ─────────────────────────────
function LandingPage() {
  const { dark, toggle } = useContext(ThemeCtx);
  const series = getCurrentSeries();
  const color = getSeriesColor(series.sermonSeries);
  const t = makeTheme(dark, color.accent);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const range = weekDateRange(series.days[0]?.publishDate ?? null);
  const mv = series.days.find((d) => d.memoryVerse)?.memoryVerse ?? null;

  return (
    <div style={{ background: t.bg, minHeight: "100vh" }}>
      <Nav t={t} dark={dark} toggle={toggle} />

      <div style={{ padding: "44px 24px 36px" }}>
        <p style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: t.accent, marginBottom: 16 }}>
          {series.sermonSeries} · This Week
        </p>
        <h1 style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 40, lineHeight: 1.12, letterSpacing: "-0.015em", color: t.ink, marginBottom: 18 }}>
          {series.title}
        </h1>
        <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 12.5, letterSpacing: "0.04em", color: t.sub }}>
          A {series.days.length}-day devotional{range ? ` · ${range}` : ""}
        </p>
      </div>

      <div style={{ margin: "0 24px", height: 1, background: t.rule }} />

      <div style={{ padding: "8px 24px 48px" }}>
        {series.days.map((day, i) => {
          const locked = (day.publishDate ?? "") > today;
          const row = (
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, padding: "20px 0", borderBottom: i < series.days.length - 1 ? `1px solid ${t.rule}` : "none", opacity: locked ? 0.42 : 1 }}>
              <span style={{ fontFamily: hSerif, fontWeight: 500, fontStyle: "italic", fontSize: 15, color: t.accent, width: 20, flexShrink: 0 }}>{day.day}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 18.5, lineHeight: 1.3, color: t.ink, marginBottom: 5 }}>{day.title}</p>
                <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 11.5, letterSpacing: "0.08em", color: t.sub }}>{day.scripture.reference}</p>
              </div>
              <span style={{ fontFamily: hLato, fontWeight: 300, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: locked ? t.sub : t.accent }}>{locked ? "Soon" : "Read"}</span>
            </div>
          );
          return locked ? (
            <div key={day.day}>{row}</div>
          ) : (
            <Link key={day.day} to={`/read/${series.slug}/${day.day}`} style={{ textDecoration: "none", display: "block" }}>{row}</Link>
          );
        })}
      </div>

      {mv && (
        <div style={{ padding: "0 24px 48px" }}>
          <p style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 13.5, color: t.sub, lineHeight: 1.6 }}>“{mv.text}”</p>
          <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: t.sub, marginTop: 8 }}>Memory verse · {mv.reference}</p>
        </div>
      )}
    </div>
  );
}

// ─── Reading Page (Direction B — Liturgical Print) ────────────────────────────
function ReadingPage() {
  const { dark, toggle } = useContext(ThemeCtx);
  const { slug, dayNum } = useParams();
  useNavigate(); // kept for parity; navigation handled via <Link>

  const series = allSeries.flatMap((s) => s.weeks).find((w) => w.slug === slug);
  const day = series?.days.find((d) => d.day === Number(dayNum));

  if (!series || !day) {
    const tnf = makeTheme(dark, "#7a6a5a");
    return <div style={{ background: tnf.bg, minHeight: "100vh", color: tnf.ink, fontFamily: hLato, padding: 40 }}>Not found.</div>;
  }

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const color = getSeriesColor(series.sermonSeries);
  const t = makeTheme(dark, color.accent);
  const prevDay = series.days.find((d) => d.day === day.day - 1);
  const nextDay = series.days.find((d) => d.day === day.day + 1);
  const nextDayLocked = nextDay && (nextDay.publishDate ?? "") > today;

  // Reading recipe (from the approved mockup): centered, drop cap, ornaments, 18px body.
  const ta: React.CSSProperties["textAlign"] = "center";
  const body: React.CSSProperties = { fontFamily: hSerif, fontSize: 18, lineHeight: 1.78, color: t.ink, marginBottom: 21 };

  if ((day.publishDate ?? "") > today) {
    return (
      <div style={{ background: t.bg, minHeight: "100vh" }}>
        <Nav t={t} dark={dark} toggle={toggle} />
        <div style={{ padding: "80px 24px", textAlign: "center" }}>
          <LockIcon size={28} color={t.sub} />
          <p style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 22, color: t.ink, marginTop: 20, marginBottom: 10 }}>Not yet available</p>
          <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 13, color: t.sub, marginBottom: 32 }}>
            This devotional unlocks on {formatDate(day.publishDate)}.
          </p>
          <Link to="/" style={{ fontFamily: hLato, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: t.accent, textDecoration: "none" }}>
            ← Back to today
          </Link>
        </div>
      </div>
    );
  }

  const first = day.devotional[0] ?? "";
  const canDropCap = /[A-Za-z]/.test(first.charAt(0));
  const navLink = (color: string): React.CSSProperties => ({ fontFamily: hLato, fontWeight: 300, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color, textDecoration: "none" });

  return (
    <div style={{ background: t.bg, minHeight: "100vh" }}>
      <Nav
        t={t}
        dark={dark}
        toggle={toggle}
        share={
          <ShareButton
            title={`${day.title} — ${series.title}`}
            text={`${day.scripture.reference} — "${day.scripture.text.length > 120 ? day.scripture.text.slice(0, 117) + "…" : day.scripture.text}"`}
            url={window.location.href}
            t={t}
          />
        }
      />

      {/* Header — ceremonial opening */}
      <div style={{ textAlign: ta, padding: "38px 26px 0" }}>
        <p style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: t.sub, marginBottom: 8 }}>{series.title}</p>
        <p style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 13.5, color: t.accent, marginBottom: 18 }}>Day {ORDINALS[day.day - 1] ?? day.day}</p>
        <h1 style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 33, lineHeight: 1.16, letterSpacing: "-0.01em", color: t.ink }}>{day.title}</h1>
        <Ornament t={t} />
      </div>

      {/* Scripture */}
      <div style={{ padding: "0 30px", textAlign: ta }}>
        <p style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 17, lineHeight: 1.68, color: t.ink }}>“{day.scripture.text}”</p>
        <p style={{ fontFamily: hLato, fontWeight: 400, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: t.sub, marginTop: 14 }}>{day.scripture.reference} · {day.scripture.translation}</p>
      </div>

      <Ornament t={t} />

      {/* Devotional — drop cap on first paragraph */}
      <div style={{ padding: "2px 26px 4px" }}>
        {canDropCap ? (
          <p style={body}>
            <span style={{ float: "left", fontFamily: hSerif, fontWeight: 600, fontSize: 56, lineHeight: "0.82", color: t.accent, paddingRight: 10, paddingTop: 7 }}>{first.charAt(0)}</span>
            {renderInline(first.slice(1))}
          </p>
        ) : (
          <p style={body}>{renderInline(first)}</p>
        )}
        {day.devotional.slice(1).map((p, i) => (
          <p key={i} style={body}>{renderInline(p)}</p>
        ))}
      </div>

      {/* Questions — roman numerals */}
      <div style={{ margin: "24px 26px 0", borderTop: `1px solid ${t.rule}`, paddingTop: 26 }}>
        <Label t={t} center>For Reflection</Label>
        {day.questions.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <span style={{ fontFamily: hSerif, fontWeight: 600, fontSize: 13, color: t.accent, flexShrink: 0, width: 16, lineHeight: 1.8, textAlign: "center" }}>{ROMAN[i] ?? i + 1}</span>
            <p style={{ fontFamily: hSerif, fontSize: 15, lineHeight: 1.7, color: t.ink }}>{renderInline(q)}</p>
          </div>
        ))}
      </div>

      {/* Challenge */}
      <div style={{ margin: "22px 26px 0", border: `1px solid ${t.rule}`, background: t.faint, padding: "24px 22px" }}>
        <Label t={t} center>Today's Challenge</Label>
        <p style={{ fontFamily: hSerif, fontSize: 15, lineHeight: 1.7, color: t.ink, textAlign: ta }}>{renderInline(day.challenge)}</p>
      </div>

      {/* Memory verse */}
      {day.memoryVerse && (
        <div style={{ padding: "40px 34px 0", textAlign: ta }}>
          <Label t={t} center>This Week's Memory Verse</Label>
          <p style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 19, lineHeight: 1.62, color: t.accent }}>“{day.memoryVerse.text}”</p>
          <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: t.sub, marginTop: 14 }}>{day.memoryVerse.reference}</p>
        </div>
      )}

      <Ornament t={t} />

      {/* Prayer */}
      <div style={{ padding: "0 30px 8px", textAlign: ta }}>
        <Label t={t} center>Prayer</Label>
        <p style={{ fontFamily: hSerif, fontStyle: "italic", fontSize: 15.5, lineHeight: 1.78, color: t.ink }}>{renderInline(day.prayer)}</p>
      </div>

      {/* Reactions — keyed so state resets when moving between days */}
      <ReactionBar key={`${series.slug}/${day.day}`} slug={series.slug} day={day.day} title={day.title} t={t} />

      {/* Prev / next */}
      <div style={{ margin: "20px 26px 0", borderTop: `1px solid ${t.rule}`, padding: "20px 0 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {prevDay ? (
          <Link to={`/read/${series.slug}/${prevDay.day}`} style={navLink(t.sub)}>← Day {prevDay.day}</Link>
        ) : (
          <Link to="/" style={navLink(t.sub)}>← The Week</Link>
        )}
        {nextDay && !nextDayLocked ? (
          <Link to={`/read/${series.slug}/${nextDay.day}`} style={navLink(t.accent)}>Day {nextDay.day} →</Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// ─── Series / Archive Page ────────────────────────────────────────────────────
function SeriesPage() {
  const { dark, toggle } = useContext(ThemeCtx);
  const [jumpOpen, setJumpOpen] = useState(false);
  const t = makeTheme(dark, "#7a6a5a");

  // Group sermon series by year of their most recent week
  const byYear: Record<string, typeof allSeries> = {};
  for (const sermonSeries of allSeries) {
    const year = sermonSeries.weeks[0]?.days[0]?.publishDate?.slice(0, 4) ?? "Unknown";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(sermonSeries);
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  function scrollToSeries(name: string) {
    const el = document.getElementById(slugify(name));
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setJumpOpen(false);
  }

  return (
    <div style={{ background: t.bg, minHeight: "100vh" }}>
      <Nav t={t} dark={dark} toggle={toggle} />

      <div style={{ padding: "32px 24px 100px" }}>
        <h1 style={{ fontFamily: hSerif, fontSize: 32, fontWeight: 500, color: t.ink, marginBottom: 36, letterSpacing: "-0.02em" }}>All Series</h1>

        {years.map((year) => (
          <div key={year}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, marginTop: year === years[0] ? 0 : 48 }}>
              <span style={{ fontFamily: hLato, fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", color: t.ink }}>{year}</span>
              <div style={{ flex: 1, height: 1, background: t.rule }} />
            </div>

            {byYear[year].map((sermonSeries) => {
              const sc = getSeriesColor(sermonSeries.title);
              const accent = dark ? lighten(sc.accent, 0.42) : sc.accent;
              return (
                <div key={sermonSeries.title} id={slugify(sermonSeries.title)} style={{ marginBottom: 44 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                    <p style={{ fontFamily: hLato, fontWeight: 400, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{sermonSeries.title}</p>
                  </div>

                  {sermonSeries.weeks.map((week) => (
                    <div key={week.slug} style={{ marginBottom: 4, border: `1px solid ${t.rule}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "16px 18px", background: t.faint, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: hSerif, fontSize: 18, fontWeight: 500, color: t.ink }}>{week.title}</span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontFamily: hLato, fontWeight: 300, fontSize: 11, color: accent, letterSpacing: "0.06em", display: "block" }}>{week.days.length} days</span>
                          {weekDateRange(week.days[0]?.publishDate ?? null) && (
                            <span style={{ fontFamily: hLato, fontWeight: 300, fontSize: 10, color: t.sub, letterSpacing: "0.04em", display: "block", marginTop: 2 }}>
                              {weekDateRange(week.days[0]?.publishDate ?? null)}
                            </span>
                          )}
                        </div>
                      </div>
                      {week.days.map((day) => {
                        const archiveToday = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
                        const locked = (day.publishDate ?? "") > archiveToday;
                        const rowStyle: React.CSSProperties = {
                          display: "flex",
                          alignItems: "center",
                          padding: "13px 18px",
                          borderTop: `1px solid ${t.rule}`,
                          textDecoration: "none",
                          gap: 14,
                          background: t.bg,
                          opacity: locked ? 0.45 : 1,
                          cursor: locked ? "default" : "pointer",
                        };
                        const inner = (
                          <>
                            <span style={{ fontFamily: hLato, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: locked ? t.sub : accent, opacity: locked ? 1 : 0.6, width: 32, flexShrink: 0 }}>Day {day.day}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontFamily: hSerif, fontSize: 15, color: locked ? t.sub : t.ink, lineHeight: 1.4, marginBottom: 1 }}>{day.title}</p>
                              <p style={{ fontFamily: hLato, fontWeight: 300, fontSize: 11, color: t.sub }}>{day.scripture.reference}</p>
                            </div>
                            {locked ? <LockIcon size={12} color={t.sub} /> : <ChevronRight color={accent} size={13} />}
                          </>
                        );
                        return locked ? (
                          <div key={day.day} style={rowStyle}>{inner}</div>
                        ) : (
                          <Link key={day.day} to={`/read/${week.slug}/${day.day}`} style={rowStyle}>{inner}</Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Jump to series button */}
      <button
        onClick={() => setJumpOpen(true)}
        style={{ position: "fixed", bottom: 24, right: 20, display: "flex", alignItems: "center", gap: 6, background: t.ink, color: t.bg, border: "none", borderRadius: 100, padding: "10px 16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 50 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="2" width="11" height="1.5" rx="0.75" fill={t.bg} />
          <rect x="1" y="5.75" width="11" height="1.5" rx="0.75" fill={t.bg} />
          <rect x="1" y="9.5" width="11" height="1.5" rx="0.75" fill={t.bg} />
        </svg>
        <span style={{ fontFamily: hLato, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Jump to Series</span>
      </button>

      {jumpOpen && (
        <div onClick={() => setJumpOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      )}

      {jumpOpen && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: t.bg, borderRadius: "20px 20px 0 0", paddingBottom: 32, zIndex: 101, boxShadow: "0 -4px 32px rgba(0,0,0,0.25)" }}>
          <div style={{ padding: "14px 0 4px", textAlign: "center" }}>
            <div style={{ width: 36, height: 4, background: t.rule, borderRadius: 2, margin: "0 auto" }} />
          </div>
          <p style={{ fontFamily: hLato, fontWeight: 700, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: t.sub, textAlign: "center", padding: "10px 0 6px" }}>Sermon Series</p>
          {allSeries.map((s, i) => {
            const sc = getSeriesColor(s.title);
            const accent = dark ? lighten(sc.accent, 0.42) : sc.accent;
            return (
              <button
                key={s.title}
                onClick={() => scrollToSeries(s.title)}
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 24px", border: "none", borderTop: i === 0 ? `1px solid ${t.rule}` : "none", borderBottom: `1px solid ${t.rule}`, background: "transparent", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                <span style={{ fontFamily: hLato, fontWeight: 400, fontSize: 14, letterSpacing: "0.04em", color: t.ink }}>{s.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reactions Report (private) ───────────────────────────────────────────────
// Unlisted page for the pastor. Data is only returned when the report key
// (Netlify env var REACTIONS_REPORT_KEY) is entered.

type ReportPage = {
  slug: string; day: number; weekTitle: string; dayTitle: string; sermonSeries: string;
  publishDate: string | null; counts: Partial<Record<ReactionKey, number>>; total: number; lastAt: string;
};

const REPORT_KEY_STORE = "hf-report-key";

function ReactionsReportPage() {
  const { dark, toggle } = useContext(ThemeCtx);
  const t = makeTheme(dark, "#7a6a5a");
  const [key, setKey] = useState<string>(() => {
    try { return localStorage.getItem(REPORT_KEY_STORE) ?? ""; } catch { return ""; }
  });
  const [draft, setDraft] = useState("");
  const [pages, setPages] = useState<ReportPage[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep this page out of search results.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/.netlify/functions/reactions-report", { headers: { "x-report-key": key } });
        if (res.status === 401) {
          try { localStorage.removeItem(REPORT_KEY_STORE); } catch { /* ignore */ }
          if (!cancelled) { setKey(""); setError("That key didn’t work."); }
          return;
        }
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
        const data = await res.json();
        try { localStorage.setItem(REPORT_KEY_STORE, key); } catch { /* ignore */ }
        if (!cancelled) setPages(data.pages);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  function forget() {
    try { localStorage.removeItem(REPORT_KEY_STORE); } catch { /* ignore */ }
    setKey("");
    setPages(null);
  }

  const sorted = [...(pages ?? [])].sort((a, b) =>
    (b.publishDate ?? "").localeCompare(a.publishDate ?? "") || b.day - a.day);
  const totals = REACTIONS.map((r) => ({ ...r, n: sorted.reduce((s, p) => s + (p.counts[r.key] ?? 0), 0) }));
  const grand = totals.reduce((s, r) => s + r.n, 0);
  const small: React.CSSProperties = { fontFamily: hLato, fontWeight: 300, fontSize: 11.5, letterSpacing: "0.04em", color: t.sub };

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.ink }}>
      <Nav t={t} dark={dark} toggle={toggle} />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 22px 60px" }}>
        <Label t={t}>Private</Label>
        <h1 style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 32, lineHeight: 1.15, marginBottom: 24 }}>Reader Reactions</h1>

        {!key && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setKey(draft.trim()); setDraft(""); } }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Report key"
              aria-label="Report key"
              autoComplete="current-password"
              style={{ flex: "1 1 220px", minWidth: 0, padding: "11px 12px", fontFamily: hLato, fontSize: 14, color: t.ink, background: t.faint, border: `1px solid ${t.rule}`, borderRadius: 4 }}
            />
            <button type="submit" style={{ padding: "11px 18px", fontFamily: hLato, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: t.bg, background: t.ink, border: "none", borderRadius: 4, cursor: "pointer" }}>
              View report
            </button>
          </form>
        )}

        {error && <p style={{ ...small, color: t.ink, marginTop: 14 }}>{error}</p>}
        {loading && <p style={{ ...small, marginTop: 14 }}>Loading…</p>}

        {pages && !loading && (
          <>
            {/* Totals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 30 }}>
              {totals.map(({ key: k, label, Icon, n }) => (
                <div key={k} style={{ border: `1px solid ${t.rule}`, background: t.faint, padding: "14px 14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.sub }}>
                    <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                    <span style={{ ...small, fontSize: 11 }}>{label}</span>
                  </div>
                  <p style={{ fontFamily: hSerif, fontSize: 28, fontWeight: 500, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{n}</p>
                  <p style={{ ...small, fontSize: 10.5 }}>{grand ? Math.round((n / grand) * 100) : 0}% of {grand}</p>
                </div>
              ))}
            </div>

            {/* Per devotional */}
            <Label t={t}>By devotional · newest first</Label>
            {sorted.length === 0 && <p style={small}>No reactions yet.</p>}
            {sorted.map((p) => (
              <div key={`${p.slug}/${p.day}`} style={{ padding: "16px 0", borderTop: `1px solid ${t.rule}` }}>
                <Link to={`/read/${p.slug}/${p.day}`} style={{ fontFamily: hSerif, fontWeight: 500, fontSize: 17, color: t.ink, textDecoration: "none" }}>
                  {p.dayTitle}
                </Link>
                <p style={{ ...small, marginTop: 3 }}>
                  {p.weekTitle} · Day {p.day}{p.publishDate ? ` · ${formatDate(p.publishDate)}` : ""}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 10 }}>
                  {REACTIONS.map(({ key: k, label, Icon }) => (
                    <span key={k} title={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: hLato, fontSize: 13, color: (p.counts[k] ?? 0) ? t.ink : t.sub, fontVariantNumeric: "tabular-nums" }}>
                      <Icon size={14} strokeWidth={1.5} aria-label={label} />
                      {p.counts[k] ?? 0}
                    </span>
                  ))}
                  <span style={{ ...small, marginLeft: "auto" }}>{p.total} total</span>
                </div>
              </div>
            ))}

            <button type="button" onClick={forget} style={{ ...small, marginTop: 28, background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
              Forget key on this device
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem("hf-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("hf-theme", dark ? "dark" : "light"); } catch { /* ignore */ }
    const bg = dark ? "#16130F" : "#FBF9F6";
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/read/:slug/:dayNum" element={<ReadingPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/reactions-report" element={<ReactionsReportPage />} />
      </Routes>
    </ThemeCtx.Provider>
  );
}
