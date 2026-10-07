import { specs } from "@/components/scene/specs";
import { Reveal } from "@/components/motion/Reveal";
import type { Country } from "@/lib/countries";
import type { ResearchEvent, Research } from "@/lib/research";
import { Head, Note, Section, SourceRef } from "./parts";
import { dateKey, dateLabel, dateTime, parseDate, windowU } from "./helpers";

type Ev = ResearchEvent;

function EventList({ heading, events, color }: { heading: string; events: Ev[]; color: string }) {
  if (!events.length) return null;
  return (
    <div className="mt-10">
      <h3 className="eyebrow mb-5 text-paper-2">{heading}</h3>
      <ol className="relative space-y-6 border-l border-rule pl-6">
        {events.map((e, k) => (
          <Reveal as="li" key={`${e.date}-${e.text}`} delay={Math.min(k, 4) * 50} className="relative">
            <span aria-hidden className="absolute top-1.5 -left-[29.5px] size-2.5 rounded-full ring-4 ring-ink" style={{ background: color }} />
            <p className="eyebrow num text-paper-2">
              <time dateTime={dateTime(e.date)}>{dateLabel(e.date)}</time>
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-paper-2">{e.text}</p>
            {e.source && (
              <p className="mt-1 text-xs">
                <SourceRef source={e.source} />
              </p>
            )}
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

/** The deck's events and the researched ones in one date-ordered list, with the particle helix keyed to the same dates. */
export function Timeline({ c, research }: { c: Country; research: Research | null }) {
  const merged: Ev[] = [...c.events, ...(research?.events ?? [])];
  const seen = new Set<string>();
  const events = merged
    .filter((e) => {
      const k = `${e.date}|${e.text}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => dateKey(a.date) - dateKey(b.date));

  const inWindow = events.filter((e) => (parseDate(e.date)?.y ?? 2024) <= 2024);
  const after = events.filter((e) => (parseDate(e.date)?.y ?? 2024) > 2024);

  // One bead per distinct position on the helix; events after 2024 clamp to its end and share a bead.
  const beads = [...new Map(events.map((e): [number, { u: number; iso: Country["iso"] }] => [Math.round(windowU(e.date) * 500), { u: windowU(e.date), iso: c.iso }])).values()];

  return (
    <Section spec={specs.helix(beads)} id="timeline" label="Timeline">
      <Head
        serial="08"
        eyebrow="Timeline"
        color={c.color}
        title={`${c.short}, event by event`}
        lede={`${inWindow.length} ${inWindow.length === 1 ? "event falls" : "events fall"} inside the 2022–24 window${after.length ? `, and ${after.length} more since` : ""}.`}
      />

      <EventList heading="Inside the window · 2022–2024" events={inWindow} color={c.color} />
      <EventList heading="After the window" events={after} color={c.color} />

      <Reveal delay={100}>
        <Note className="mt-8">
          The particle helix runs from January 2022 to December 2024, one turn a year, with a bead for each event. Events dated only by year sit mid-year, and later ones clamp to the end.
          Events with a source link come from research; the rest are from the seminar deck.
        </Note>
      </Reveal>
    </Section>
  );
}
