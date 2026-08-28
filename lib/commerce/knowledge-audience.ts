import type { KnowledgeAudience } from "./knowledge";

type AudienceFaq = { audience?: KnowledgeAudience } & Record<string, unknown>;
type AudienceGap = Record<string, unknown>;

export type KnowledgeContextProjection = Record<string, unknown> & {
  faq?: AudienceFaq[];
  salesPlaybook?: unknown;
  sources?: unknown;
  gaps?: AudienceGap[];
  rules?: Record<string, unknown>;
};

function faqForAudience(faq: AudienceFaq[] | undefined, audience: KnowledgeAudience) {
  const items = faq ?? [];
  if (audience === "admin") return items;
  if (audience === "gestora") return items.filter((item) => item.audience === "customer" || item.audience === "gestora");
  return items.filter((item) => item.audience === "customer");
}

export function projectKnowledgeForAudience<T extends KnowledgeContextProjection>(context: T, audience: KnowledgeAudience) {
  const rules = context.rules && typeof context.rules === "object" ? context.rules : {};
  const faq = faqForAudience(context.faq, audience);

  if (audience === "admin") {
    return {
      ...context,
      faq,
      audience,
      rules: { ...rules, audience, privilegedKnowledgeAuthorized: true },
    };
  }

  if (audience === "gestora") {
    const { sources: _sources, ...safe } = context;
    const gaps = (context.gaps ?? []).map(({ required_evidence: _requiredEvidence, requiredEvidence: _requiredEvidenceCamel, ...gap }) => gap);
    return {
      ...safe,
      faq,
      gaps,
      audience,
      rules: {
        ...rules,
        audience,
        rawSourcesHidden: true,
        unresolvedGapsMustNotBeInvented: true,
      },
    };
  }

  const { salesPlaybook: _salesPlaybook, sources: _sources, gaps: _gaps, ...safe } = context;
  return {
    ...safe,
    faq,
    audience: "customer" as const,
    rules: {
      ...rules,
      audience: "customer" as const,
      internalEvidenceHidden: true,
      privilegedKnowledgeRequiresServerAuthorization: true,
    },
  };
}
