import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { allSeries, currentSeries, getSeriesColor } from "./data";
import logoBlack from "./assets/logo-black.png";

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

// ─── Layout / Nav ─────────────────────────────────────────────────────────────
function Nav({ accent = "#2D4A3E" }: { accent?: string }) {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      borderBottom: "1px solid #e8e2da",
      padding: "0 20px",
      height: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#faf7f3",
    }}>
      <Link to="/" style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
      }}>
        <img src={logoBlack} alt="Harrison Faith" style={{ height: "30px", width: "auto" }} />
        <span style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 400,
          fontSize: "11px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#1e1a17",
        }}>
          HF Weekly Devotionals
        </span>
      </Link>
      <Link to="/series" style={{
        fontFamily: "'Lato', sans-serif",
        fontWeight: 400,
        fontSize: "11px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: accent,
        textDecoration: "none",
      }}>
        All Series
      </Link>
    </header>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage() {
  const series = currentSeries;
  const color = getSeriesColor(series.sermonSeries);

  return (
    <div style={{ backgroundColor: "#faf7f3", minHeight: "100vh" }}>
      <Nav accent={color.accent} />

      {/* Hero */}
      <div style={{
        backgroundColor: color.accent,
        padding: "40px 24px 80px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "14px",
        }}>
          {series.sermonSeries}
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "52px",
          fontWeight: 700,
          lineHeight: "1.05",
          color: "#ffffff",
          letterSpacing: "-0.02em",
          marginBottom: "10px",
        }}>
          {series.title}
        </h1>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 300,
          fontSize: "12px",
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.55)",
          textTransform: "uppercase",
        }}>
          A {series.days.length}-Day Devotional
        </p>
      </div>

      {/* Day list card */}
      <div style={{
        margin: "-44px 16px 40px",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }}>
        {series.days.map((day, i) => (
          <Link
            key={day.day}
            to={`/read/${series.slug}/${day.day}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "18px 20px",
              borderBottom: i < series.days.length - 1 ? "1px solid #f0ece6" : "none",
              textDecoration: "none",
              gap: "16px",
            }}
          >
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px",
              fontWeight: 700,
              color: color.accent,
              opacity: 0.35,
              width: "24px",
              flexShrink: 0,
              textAlign: "center",
            }}>
              {day.day}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "17px",
                fontWeight: 400,
                color: "#1e1a17",
                marginBottom: "3px",
                lineHeight: "1.3",
              }}>
                {day.title}
              </p>
              <p style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 300,
                fontSize: "12px",
                color: "#b0a898",
                letterSpacing: "0.03em",
              }}>
                {day.scripture.reference}
              </p>
            </div>
            <ChevronRight color={color.accent} size={14} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Reading Page ─────────────────────────────────────────────────────────────
function ReadingPage() {
  const { slug, dayNum } = useParams();
  const navigate = useNavigate();

  const series = allSeries.flatMap(s => s.weeks).find(w => w.slug === slug);
  const day = series?.days.find(d => d.day === Number(dayNum));

  if (!series || !day) {
    return <div style={{ padding: 40 }}>Not found.</div>;
  }

  const color = getSeriesColor(series.sermonSeries);
  const prevDay = series.days.find(d => d.day === day.day - 1);
  const nextDay = series.days.find(d => d.day === day.day + 1);

  return (
    <div style={{ backgroundColor: "#faf7f3", minHeight: "100vh" }}>
      <Nav accent={color.accent} />

      {/* Hero */}
      <div style={{
        backgroundColor: color.accent,
        padding: "32px 24px 76px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "14px",
        }}>
          {series.sermonSeries}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "18px" }}>
          <Link to={`/read/${series.slug}/1`} style={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 400,
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: color.accent,
            backgroundColor: "rgba(255,255,255,0.9)",
            padding: "3px 10px",
            borderRadius: "2px",
            textDecoration: "none",
          }}>
            {series.title}
          </Link>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontWeight: 300,
            fontSize: "11px",
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.06em",
          }}>
            Day {day.day} of {series.days.length}
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "42px",
          fontWeight: 700,
          lineHeight: "1.1",
          color: "#ffffff",
          letterSpacing: "-0.02em",
        }}>
          {day.title}
        </h1>
      </div>

      {/* Scripture card */}
      <div style={{
        margin: "-44px 16px 0",
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "24px 22px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
      }}>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: color.accent,
          marginBottom: "10px",
          textAlign: "center",
        }}>
          {day.scripture.reference} {day.scripture.translation}
        </p>
        <p style={{
          fontFamily: "utopia-std, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          fontSize: "1.05rem",
          fontStyle: "italic",
          color: "#3a3530",
          lineHeight: "1.7",
          textAlign: "center",
        }}>
          "{day.scripture.text}"
        </p>
      </div>

      {/* Devotional */}
      <div style={{ padding: "32px 24px 0" }}>
        {day.devotional.map((p, i) => (
          <p key={i} style={{
            fontFamily: "utopia-std, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
            fontSize: "1.3rem",
            lineHeight: "1.85",
            color: "#2e2a26",
            marginBottom: "22px",
          }}>
            {p}
          </p>
        ))}
      </div>

      {/* Divider */}
      <div style={{ margin: "8px 24px 28px", height: "1px", backgroundColor: "#e8e2da" }} />

      {/* Application questions */}
      <div style={{ padding: "0 24px 24px" }}>
        {day.questions.map((q, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "20px" }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "18px",
              color: color.accent,
              flexShrink: 0,
              lineHeight: "1.5",
              opacity: 0.4,
              width: "16px",
            }}>
              {i + 1}
            </span>
            <p style={{
              fontFamily: "utopia-std, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
              fontSize: "1.05rem",
              lineHeight: "1.7",
              color: "#3a3530",
            }}>
              {q}
            </p>
          </div>
        ))}
      </div>

      {/* Challenge */}
      <div style={{
        margin: "0 24px 28px",
        padding: "18px 20px",
        borderLeft: `3px solid ${color.accent}`,
        backgroundColor: color.light,
      }}>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 400,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: color.accent,
          marginBottom: "10px",
        }}>
          Today's Challenge
        </p>
        <p style={{
          fontFamily: "utopia-std, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          fontSize: "1.05rem",
          lineHeight: "1.7",
          color: color.text,
        }}>
          {day.challenge}
        </p>
      </div>

      {/* Prayer */}
      <div style={{ padding: "0 24px 32px" }}>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#b0a898",
          marginBottom: "14px",
        }}>
          Prayer
        </p>
        <p style={{
          fontFamily: "utopia-std, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
          fontSize: "1.05rem",
          fontStyle: "italic",
          lineHeight: "1.8",
          color: "#4a4440",
        }}>
          {day.prayer}
        </p>
      </div>

      {/* Prev / Next nav */}
      <div style={{
        borderTop: "1px solid #e8e2da",
        margin: "0 24px",
        padding: "20px 0 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        {prevDay ? (
          <Link to={`/read/${series.slug}/${prevDay.day}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Lato', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: color.accent,
            textDecoration: "none",
          }}>
            <ChevronLeft color={color.accent} />
            Day {prevDay.day}: {prevDay.title}
          </Link>
        ) : (
          <Link to="/" style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Lato', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: "#b0a898",
            textDecoration: "none",
          }}>
            <ChevronLeft color="#b0a898" />
            Back to Series
          </Link>
        )}
        {nextDay && (
          <Link to={`/read/${series.slug}/${nextDay.day}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "'Lato', sans-serif",
            fontSize: "12px",
            letterSpacing: "0.06em",
            color: color.accent,
            textDecoration: "none",
          }}>
            Day {nextDay.day}: {nextDay.title}
            <ChevronRight color={color.accent} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Series / Archive Page ────────────────────────────────────────────────────
function SeriesPage() {
  return (
    <div style={{ backgroundColor: "#faf7f3", minHeight: "100vh" }}>
      <Nav />

      <div style={{ padding: "32px 24px 56px" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "32px",
          fontWeight: 700,
          color: "#1e1a17",
          marginBottom: "36px",
          letterSpacing: "-0.02em",
        }}>
          All Series
        </h1>

        {allSeries.map((sermonSeries) => {
          const color = getSeriesColor(sermonSeries.title);
          return (
            <div key={sermonSeries.title} style={{ marginBottom: "44px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color.accent, flexShrink: 0 }} />
                <p style={{
                  fontFamily: "'Lato', sans-serif",
                  fontWeight: 400,
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: color.accent,
                }}>
                  {sermonSeries.title}
                </p>
              </div>

              {sermonSeries.weeks.map((week) => (
                <div key={week.slug} style={{
                  marginBottom: "4px",
                  border: "1px solid #ece6de",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "16px 18px",
                    backgroundColor: color.light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <span style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "18px",
                      fontWeight: 400,
                      color: "#1e1a17",
                    }}>
                      {week.title}
                    </span>
                    <span style={{
                      fontFamily: "'Lato', sans-serif",
                      fontWeight: 300,
                      fontSize: "11px",
                      color: color.accent,
                      letterSpacing: "0.06em",
                    }}>
                      {week.days.length} days
                    </span>
                  </div>
                  {week.days.map((day, i) => (
                    <Link key={day.day} to={`/read/${week.slug}/${day.day}`} style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "13px 18px",
                      borderTop: "1px solid #ece6de",
                      textDecoration: "none",
                      gap: "14px",
                      backgroundColor: "#faf7f3",
                    }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "14px",
                        color: color.accent,
                        opacity: 0.4,
                        width: "16px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}>
                        {day.day}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontFamily: "'Georgia', serif",
                          fontSize: "15px",
                          color: "#1e1a17",
                          lineHeight: "1.4",
                          marginBottom: "1px",
                        }}>
                          {day.title}
                        </p>
                        <p style={{
                          fontFamily: "'Lato', sans-serif",
                          fontWeight: 300,
                          fontSize: "11px",
                          color: "#b0a898",
                        }}>
                          {day.scripture.reference}
                        </p>
                      </div>
                      <ChevronRight color={color.accent} size={13} />
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/read/:slug/:dayNum" element={<ReadingPage />} />
      <Route path="/series" element={<SeriesPage />} />
    </Routes>
  );
}
