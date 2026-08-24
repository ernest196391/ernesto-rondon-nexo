export type KitBuilderInput = {
  name: string;
  slug: string;
  problem: string;
  inputDescription: string;
  outputDescription: string;
  dataSources: string;
  qualityCriteria: string;
  risks: string;
};

export type GeneratedKit = {
  manifest: string;
  spec: string;
  workflow: string;
  checklist: string[];
};

function cleanList(value: string) {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

export function normalizeSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export function generateKit(input: KitBuilderInput): GeneratedKit {
  const slug = normalizeSlug(input.slug || input.name) || "nuevo-kit";
  const sources = cleanList(input.dataSources);
  const criteria = cleanList(input.qualityCriteria);
  const risks = cleanList(input.risks);

  const manifest = JSON.stringify({
    id: slug,
    version: "0.1.0",
    name: input.name.trim() || slug,
    description: input.problem.trim(),
    inputs: [input.inputDescription.trim()].filter(Boolean),
    outputs: [input.outputDescription.trim()].filter(Boolean),
    capabilities: sources.length ? ["source-acquisition", "analysis"] : ["analysis"],
    permissions: sources.map((source) => `source:${source}`),
    risk: risks.length ? "review-required" : "low",
    runtime: ">=0.1.0"
  }, null, 2);

  const spec = `# ${input.name.trim() || slug} — SPEC\n\n## Problema\n${input.problem.trim() || "Pendiente de definir."}\n\n## Entrada\n${input.inputDescription.trim() || "Pendiente de definir."}\n\n## Salida\n${input.outputDescription.trim() || "Pendiente de definir."}\n\n## Fuentes/dependencias\n${sources.length ? sources.map((item) => `- ${item}`).join("\n") : "- Ninguna declarada todavía."}\n\n## Criterios de calidad\n${criteria.length ? criteria.map((item) => `- ${item}`).join("\n") : "- La salida debe ser reproducible y verificable."}\n\n## Riesgos y revisión\n${risks.length ? risks.map((item) => `- ${item}`).join("\n") : "- No se declararon riesgos adicionales; mantener revisión humana ante acciones sensibles."}\n\n## Gate\nNo considerar listo hasta ejecutar un ejemplo reproducible, validar entradas/salidas y mantener CI verde.\n`;

  const workflow = `# Workflow — ${input.name.trim() || slug}\n\nprepare → acquire → analyze → review → execute → validate → result\n\n## 1. prepare\nValidar que la entrada corresponde al contrato y que no contiene secretos inesperados.\n\n## 2. acquire\nComprobar primero que las fuentes declaradas existen y son accesibles antes de construir lógica dependiente de ellas.\n\n## 3. analyze\nSeparar evidencia, inferencia y recomendación. No completar huecos con datos inventados.\n\n## 4. review\nMostrar “NEXO entendió esto” cuando haya interpretación ambigua o una acción sensible.\n\n## 5. execute\nEjecutar únicamente herramientas y permisos declarados en el manifest.\n\n## 6. validate\nEvaluar criterios de calidad y ejecutar un caso de práctica reproducible.\n\n## 7. result\nEntregar artefactos, limitaciones y siguiente acción recomendada.\n`;

  return {
    manifest,
    spec,
    workflow,
    checklist: [
      "Contrato de entrada definido",
      "Contrato de salida definido",
      "Fuentes/dependencias comprobables",
      "Permisos mínimos declarados",
      "Criterios de calidad explícitos",
      "Riesgos/revisión humana definidos",
      "Ejemplo reproducible pendiente de ejecutar antes de marcar ready",
      "Build, lint y typecheck verdes antes de integrar"
    ]
  };
}
