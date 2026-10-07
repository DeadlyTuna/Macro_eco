import type { Iso } from "@/lib/data";

function star(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.382 : r;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`;
  }
  return d + "Z";
}

/** Simplified national flags, drawn rather than downloaded. */
export function Flag({ iso, className = "h-4 w-auto" }: { iso: Iso; className?: string }) {
  const title = { BIH: "Flag of Bosnia and Herzegovina", SYC: "Flag of Seychelles", VNM: "Flag of Viet Nam", MDV: "Flag of the Maldives" }[iso];
  if (iso === "BIH")
    return (
      <svg viewBox="0 0 800 400" className={className} role="img" aria-label={title}>
        <rect width="800" height="400" fill="#002395" />
        <path d="M221 0h400v400z" fill="#FECB00" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={star(165 + i * 50, -25 + i * 50, 26)} fill="#fff" />
        ))}
      </svg>
    );
  if (iso === "SYC")
    return (
      <svg viewBox="0 0 600 300" className={className} role="img" aria-label={title}>
        <path d="M0 300V0h200z" fill="#003F87" />
        <path d="M0 300 200 0h200z" fill="#FCD856" />
        <path d="M0 300 400 0h200v100z" fill="#D62828" />
        <path d="M0 300 600 100v100z" fill="#fff" />
        <path d="M0 300 600 200v100z" fill="#007A3D" />
      </svg>
    );
  if (iso === "VNM")
    return (
      <svg viewBox="0 0 900 600" className={className} role="img" aria-label={title}>
        <rect width="900" height="600" fill="#DA251D" />
        <path d={star(450, 300, 180)} fill="#FFFF00" />
      </svg>
    );
  return (
    <svg viewBox="0 0 720 480" className={className} role="img" aria-label={title}>
      <rect width="720" height="480" fill="#D21034" />
      <rect x="180" y="120" width="360" height="240" fill="#007E3A" />
      <circle cx="372" cy="240" r="80" fill="#fff" />
      <circle cx="400" cy="240" r="72" fill="#007E3A" />
    </svg>
  );
}
