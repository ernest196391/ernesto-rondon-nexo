import { describe, expect, it } from "vitest";
import { projectPublicKnowledge, publicKnowledgeAudience } from "./knowledge-public";

describe("NEXO public knowledge boundary", () => {
  it("always resolves the public audience as customer", () => {
    expect(publicKnowledgeAudience()).toBe("customer");
  });

  it("removes privileged sales, sources and gaps from public responses", () => {
    const projected = projectPublicKnowledge({
      identity: { id: "pk_test" },
      summary: "Producto de prueba",
      salesPlaybook: { sellingPoints: ["interno"] },
      sources: [{ title: "fuente interna" }],
      gaps: [{ question: "dato pendiente" }],
      rules: { probableMustNotBePresentedAsConfirmed: true },
    });

    expect(projected).not.toHaveProperty("salesPlaybook");
    expect(projected).not.toHaveProperty("sources");
    expect(projected).not.toHaveProperty("gaps");
    expect(projected.audience).toBe("customer");
    expect(projected.rules).toMatchObject({
      probableMustNotBePresentedAsConfirmed: true,
      internalEvidenceHidden: true,
      privilegedKnowledgeRequiresServerAuthorization: true,
    });
  });
});
