export type PageSize = "A4" | "A5" | "Letter" | "Pocket";
export type PageOrientation = "portrait" | "landscape";
export type MarginPreset = "normal" | "narrow" | "wide" | "custom";

export interface PdfExportOptions {
  pageSize: PageSize;
  orientation: PageOrientation;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  fontSizePt: number;
  lineHeight: number;
  showPageNumbers: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  pageSize: "A5", // Formato clássico de livro
  orientation: "portrait",
  marginTopMm: 20,
  marginRightMm: 15,
  marginBottomMm: 20,
  marginLeftMm: 15,
  fontSizePt: 12,
  lineHeight: 1.6,
  showPageNumbers: true,
};
