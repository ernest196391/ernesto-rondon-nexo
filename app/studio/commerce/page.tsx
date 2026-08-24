import SpecialistAuditClient from "../audits/SpecialistAuditClient";
import "../audits/specialist-audit.css";

export default function CommerceAuditPage() {
  return <SpecialistAuditClient kind="commerce" title="Commerce Audit" subtitle="Evalúa señales públicas de experiencia de compra, confianza, jerarquía, móvil y riesgo de rendimiento sin inventar datos que la tienda no expone." placeholder="https://mitienda.com" />;
}
