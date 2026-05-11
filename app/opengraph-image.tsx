import { ImageResponse } from "next/og";

export const alt =
  "Model Ethics Catalog — How frontier models reason about ethics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f1ece1";
const INK = "#1a1a1a";
const INK_SOFT = "#4a4a47";
const INK_MUTE = "#8a8a85";
const RULE = "#d6cfbe";
const JADE = "#2d5239";
const VERMILLION = "#a0392c";
const OCHRE = "#b08930";

function tint(color: string, ratio: number): string {
  // Simple linear mix toward paper. ratio = 1 → full color, 0 → paper.
  const c = parseInt(color.slice(1), 16);
  const p = parseInt(PAPER.slice(1), 16);
  const cr = (c >> 16) & 0xff;
  const cg = (c >> 8) & 0xff;
  const cb = c & 0xff;
  const pr = (p >> 16) & 0xff;
  const pg = (p >> 8) & 0xff;
  const pb = p & 0xff;
  const r = Math.round(cr * ratio + pr * (1 - ratio));
  const g = Math.round(cg * ratio + pg * (1 - ratio));
  const b = Math.round(cb * ratio + pb * (1 - ratio));
  return `rgb(${r}, ${g}, ${b})`;
}

type Cell = { label: string; color: string; ratio: number };

const MATRIX_ROW: Cell[] = [
  { label: "pull", color: JADE, ratio: 0.72 },
  { label: "don't push", color: VERMILLION, ratio: 0.72 },
  { label: "cooperate", color: JADE, ratio: 0.72 },
  { label: "$50", color: JADE, ratio: 0.72 },
  { label: "$31–49", color: OCHRE, ratio: 0.72 },
  { label: "$0", color: VERMILLION, ratio: 0.55 },
];

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: PAPER,
          color: INK,
          display: "flex",
          flexDirection: "column",
          padding: "64px 80px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {/* Top bar: M.E.C. · catalog */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 18,
            letterSpacing: "0.18em",
            color: INK_SOFT,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>
            M.E.C.
            <span style={{ color: INK_MUTE, marginLeft: 12 }}>/ catalog</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 14,
              color: INK_MUTE,
              letterSpacing: "0.15em",
            }}
          >
            n=10 · temp=1.0 · 6 models · 30 dilemmas
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 64,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 92,
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: INK,
          }}
        >
          <div style={{ display: "flex" }}>How frontier models</div>
          <div style={{ display: "flex" }}>
            reason about{" "}
            <span style={{ color: JADE, fontStyle: "italic", marginLeft: 18 }}>
              ethics
            </span>
          </div>
        </div>

        {/* Mini matrix row */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 14,
              letterSpacing: "0.18em",
              color: INK_MUTE,
              textTransform: "uppercase",
            }}
          >
            a few cells from the matrix
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {MATRIX_ROW.map((c, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 96,
                  background: tint(c.color, c.ratio),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: INK,
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              fontSize: 14,
              color: INK_MUTE,
              letterSpacing: "0.05em",
            }}
          >
            {["Claude", "GPT", "Gemini", "Grok", "Llama", "DeepSeek"].map(
              (name, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {name}
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            marginTop: 40,
            height: 1,
            background: RULE,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
