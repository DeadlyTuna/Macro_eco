import { ImageResponse } from "next/og";
import { COUNTRIES, ORDER } from "@/lib/countries";

export const alt = "Four economies, three years, one question: who is actually better off? Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives, 2022–2024.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0f1c";
const PAPER = "#ece5d3";
const PAPER_2 = "#bdb7a8";
const MUTED = "#8a90a2";
const RULE = "rgba(236, 229, 211, 0.16)";

/** A static guilloche rosette (interlaced rose curves), drawn once as an SVG data URI. */
function rosette() {
  const curve = (R: number, petals: number, amp: number, ph: number) => {
    let d = "";
    const steps = 360;
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = R * (1 - amp + amp * Math.cos(petals * t + ph)) + R * amp * 0.35 * Math.cos(2 * petals * t - ph);
      d += `${i ? "L" : "M"}${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
    }
    return `<path d="${d}Z"/>`;
  };
  const paths: string[] = [];
  const petals = 18;
  const strands = 5;
  for (let ring = 0; ring < 3; ring++) {
    const R = 96 - ring * 22;
    for (let s = 0; s < strands; s++) paths.push(curve(R, petals - ring * 4, 0.12, (s * Math.PI * 2) / (strands * petals) + ring * 0.37));
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200"><g fill="none" stroke="${PAPER}" stroke-width="0.5">${paths.join("")}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK, color: PAPER }}>
        {/* Banknote frame: an outer hairline with a second rule inset. */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: `1px solid ${RULE}`, display: "flex" }} />
        <div style={{ position: "absolute", top: 34, left: 34, right: 34, bottom: 34, border: "1px solid rgba(236, 229, 211, 0.07)", display: "flex" }} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={rosette()} width={520} height={520} style={{ position: "absolute", top: -60, right: -140, opacity: 0.22 }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "72px 80px 70px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 18, letterSpacing: 4, color: MUTED, textTransform: "uppercase" }}>Four Economies · World Bank data · 2022–2024</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 34, maxWidth: 880, fontSize: 66, lineHeight: 1.06, letterSpacing: -1.5 }}>
              <span>Four economies, three years, one question:</span>
              <span style={{ color: PAPER_2 }}>who is actually better off?</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            {ORDER.map((iso) => {
              const c = COUNTRIES[iso];
              return (
                <div key={iso} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", height: 10, background: c.color, borderRadius: 2 }} />
                  <div style={{ display: "flex", marginTop: 16, fontSize: 26, color: PAPER }}>{c.short}</div>
                  <div style={{ display: "flex", marginTop: 4, fontSize: 16, letterSpacing: 2, color: MUTED, textTransform: "uppercase" }}>{c.regimeShort}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
