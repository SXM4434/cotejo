// Surface registry — the renderable surfaces you can compare type ON. Each declares its
// FIELDS + SIZE (small → side-by-side|onion, big → one-at-a-time|onion) + its Component.
// Adding a surface = one entry here (+ its component file). Letterforms is the bare grid,
// handled in CompareContent — not a surface component, so it's not in this list.
import type React from "react";
import { HeroSurface, HERO_FIELDS } from "./HeroSurface";
import { ArticleSurface, ARTICLE_FIELDS } from "./ArticleSurface";
import { PricingSurface, PRICING_FIELDS } from "./PricingSurface";
import { CaseStudyIntroSurface, CASESTUDY_FIELDS } from "./CaseStudyIntroSurface";
import { DashboardSurface, DASHBOARD_FIELDS } from "./DashboardSurface";
import { MarketingSurface, MARKETING_FIELDS } from "./MarketingSurface";
import { SpecimenSurface, SPECIMEN_FIELDS } from "./SpecimenSurface";
import { EditorialSurface, EDITORIAL_FIELDS } from "./EditorialSurface";
import { TitleCardSurface, TITLECARD_FIELDS } from "./TitleCardSurface";
import { LowerThirdSurface, LOWERTHIRD_FIELDS } from "./LowerThirdSurface";
import { CaptionSurface, CAPTION_FIELDS } from "./CaptionSurface";
import type { SurfaceField, Resolved } from "./resolve";

export type SurfaceComponentProps = {
  fonts: Record<string, Resolved>;
  content: Record<string, string>;
  editable: boolean;
  onEdit?: (id: string, v: string) => void;
  onFieldClick?: (fieldId: string, e: React.MouseEvent) => void;
  // EDIT CONTENT · images — your uploaded images per slot + a setter (only surfaces with an
  // image slot, e.g. Editorial, use these; the rest ignore them).
  images?: Record<string, string>;
  onImage?: (slot: string, file: File) => void;
  // MEASURE — characters per line for the surface's RUNNING BODY column. Only surfaces with real
  // long-form body (Article, Editorial → `measurable`) honor it; the rest ignore it. Undefined =
  // the surface's own baked default.
  measure?: number;
};

export type SurfaceReg = {
  id: string;
  label: string;
  size: "small" | "big";
  fields: SurfaceField[];
  // has a running-body column whose MEASURE (chars/line) is worth setting — surfaces the
  // measure control appears for. Display/UI surfaces (Hero, Pricing, Dashboard) don't.
  measurable?: boolean;
  Component: React.FC<SurfaceComponentProps>;
};

export const SURFACE_COMPONENTS: SurfaceReg[] = [
  { id: "hero", label: "Hero", size: "small", fields: HERO_FIELDS, Component: HeroSurface },
  { id: "article", label: "Article", size: "big", fields: ARTICLE_FIELDS, measurable: true, Component: ArticleSurface },
  { id: "pricing", label: "Pricing", size: "small", fields: PRICING_FIELDS, Component: PricingSurface },
  { id: "casestudy", label: "Case study", size: "big", fields: CASESTUDY_FIELDS, Component: CaseStudyIntroSurface },
  { id: "dashboard", label: "Dashboard", size: "small", fields: DASHBOARD_FIELDS, Component: DashboardSurface },
  { id: "marketing", label: "Marketing", size: "big", fields: MARKETING_FIELDS, Component: MarketingSurface },
  { id: "specimen", label: "Specimen", size: "big", fields: SPECIMEN_FIELDS, Component: SpecimenSurface },
  { id: "editorial", label: "Editorial", size: "big", fields: EDITORIAL_FIELDS, measurable: true, Component: EditorialSurface },
  // video surfaces — type over footage, for the editor's real cases (title card · chyron · caption)
  { id: "titlecard", label: "Title card", size: "big", fields: TITLECARD_FIELDS, Component: TitleCardSurface },
  { id: "lowerthird", label: "Lower third", size: "big", fields: LOWERTHIRD_FIELDS, Component: LowerThirdSurface },
  { id: "caption", label: "Caption", size: "big", fields: CAPTION_FIELDS, Component: CaptionSurface },
];

export const surfaceById = (id: string): SurfaceReg | undefined => SURFACE_COMPONENTS.find((s) => s.id === id);
