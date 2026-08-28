import { describe, expect, it } from "vitest";
import { projectKnowledgeForAudience } from "./knowledge-audience";

const context = {
  identity: { id: "pk_test" },
  faq: [
    { question: "Cliente", answer: "A", audience: "customer" as const },
    { question: "Gestora", answer: "B", audience: "gestora" as const },
    { question: "Admin", answer: "C", audience: "admin" as const },
  ],
  salesPlaybook: { sellingPoints: ["argumento"] },
  sources: [{ title: "Fuente interna", url: "https://example.test/source" }],
  gaps: [{ question: "Dato pendiente", required_evidence: "Foto privada", priority: "high" }],
  commerce: { price: "90" },
  rules: { priceAndStockSource: "WooCommerce live only" },
};

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

describe("NEXO knowledge audience projection", () => {
  it("mantiene al cliente sin playbook, fuentes ni gaps internos", () => {
    const result = projectKnowledgeForAudience(context, "customer");
    expect(result.faq).toHaveLength(1);
    expect(result).not.toHaveProperty("salesPlaybook");
    expect(result).not.toHaveProperty("sources");
    expect(result).not.toHaveProperty("gaps");
    expect(result.audience).toBe("customer");
  });

  it("da a gestora FAQ y playbook sin filtrar fuentes crudas ni evidencia privada", () => {
    const result = projectKnowledgeForAudience(context, "gestora");
    const record = asRecord(result);
    expect(result.faq).toHaveLength(2);
    expect(record.salesPlaybook).toEqual(context.salesPlaybook);
    expect(result).not.toHaveProperty("sources");
    expect(record.gaps).toEqual([{ question: "Dato pendiente", priority: "high" }]);
    expect(JSON.stringify(result)).not.toContain("Foto privada");
    expect(JSON.stringify(result)).not.toContain("example.test/source");
  });

  it("conserva evidencia completa solo para admin", () => {
    const result = projectKnowledgeForAudience(context, "admin");
    const record = asRecord(result);
    expect(result.faq).toHaveLength(3);
    expect(record.sources).toEqual(context.sources);
    expect(record.gaps).toEqual(context.gaps);
    expect(result.rules).toMatchObject({ audience: "admin", privilegedKnowledgeAuthorized: true });
  });
});
