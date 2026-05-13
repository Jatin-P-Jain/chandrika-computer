"use client";

import { useLocale } from "next-intl";

/**
 * Hindi typography scale.
 * Each entry is the Tailwind class override applied when locale === "hi".
 * Default (non-Hindi) locale always gets "" — components rely on their own base classes.
 */
const HI_SCALE = {
  /** Large dialog / card headings  – e.g. a full-page section title */
  display: "text-2xl! font-[inherit]",
  /** Section headings, card titles – h2-level text */
  heading: "text-xl! font-[inherit]",
  /** Sub-section headings, form accordion titles, inline nav links */
  subheading: "text-lg! font-[inherit]",
  /** Responsive page-level h1 (gets a md-breakpoint boost) */
  pageHead: "text-lg! md:text-xl!",
  /** Standard body / table-cell text */
  body: "text-base! font-[inherit]",
  /** Small supporting labels (responsive: bumps up at lg) */
  sm: "text-sm! lg:text-base!",
  /** Extra-small captions, timestamps */
  xs: "text-xs! font-[inherit]",
  /** Toggle / menu-item labels */
  label: "text-base! font-medium",
} as const;

export function useLocaleTypography() {
  const locale = useLocale();
  const isHi = locale === "hi";
  const cls = (hiClass: string) => (isHi ? hiClass : "");

  return {
    locale,
    isHi,
    textDisplayCls: cls(HI_SCALE.display),
    textHeadingCls: cls(HI_SCALE.heading),
    textSubheadingCls: cls(HI_SCALE.subheading),
    textPageHeadCls: cls(HI_SCALE.pageHead),
    textBodyCls: cls(HI_SCALE.body),
    textSmCls: cls(HI_SCALE.sm),
    textXsCls: cls(HI_SCALE.xs),
    textLabelCls: cls(HI_SCALE.label),
  };
}
