import type { Metadata } from "next";
import { SlideRail } from "@/components/ui/SlideRail";
import { HeadToHead } from "@/components/compare/HeadToHead";
import { IndicatorExplorer } from "@/components/compare/IndicatorExplorer";
import { Gapminder } from "@/components/compare/Gapminder";
import { Scoreboard } from "@/components/compare/Scoreboard";
import { Verdict } from "@/components/compare/Verdict";
import { Closing } from "@/components/compare/Closing";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Compare Bosnia & Herzegovina, Seychelles, Viet Nam and the Maldives side by side: income per head, GNI, inflation and more from World Bank data, with an indicator explorer, a year-by-year motion chart, a sortable 2024 scoreboard and a real-income verdict.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <>
      <SlideRail />
      <HeadToHead />
      <IndicatorExplorer />
      <Gapminder />
      <Scoreboard />
      <Verdict />
      <Closing />
    </>
  );
}
