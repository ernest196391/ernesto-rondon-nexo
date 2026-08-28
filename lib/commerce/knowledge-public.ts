export type PublicKnowledgeAudience = "customer";

export function publicKnowledgeAudience(): PublicKnowledgeAudience {
  return "customer";
}

export function projectPublicKnowledge<T extends Record<string, unknown>>(result: T) {
  const {
    salesPlaybook: _salesPlaybook,
    sources: _sources,
    gaps: _gaps,
    ...safe
  } = result;

  const currentRules = safe.rules && typeof safe.rules === "object" ? safe.rules as Record<string, unknown> : {};

  return {
    ...safe,
    audience: "customer" as const,
    rules: {
      ...currentRules,
      audience: "customer" as const,
      internalEvidenceHidden: true,
      privilegedKnowledgeRequiresServerAuthorization: true,
    },
  };
}
