export type SearchMatch = "exact" | "close" | "alternative" | "unconfirmed";
export type ProductHypothesis = {
  name: string;
  category: string;
  request: string;
  visibleAttributes: string[];
  missingImportant: string[];
  confidence: number;
  distinction: string;
};
export type ProductSearchResult = {
  id: string;
  title: string;
  match: SearchMatch;
  price: number | null;
  currency: string;
  priceLabel: string;
  location: string;
  phone: string;
  url: string;
  source: string;
  observedAt: string;
  availability: "advertised" | "unconfirmed";
  note: string;
};
export type NexoSearchResponse = {
  requestId: string;
  hypothesis: ProductHypothesis;
  summary: string;
  results: ProductSearchResult[];
  verificationQuestions: string[];
  provider: string;
};
