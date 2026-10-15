/** Shapes returned by /api/me/* that browser code reads. */

export type SurpriseSloka = {
  slug: string;
  title: string;
  devanagari: string;
  iast: string;
  translation: string;
  citation: string;
  source: string;
  /** True when the student has never opened it before. */
  unseen: boolean;
};
