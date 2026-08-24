import SpecialistAuditClient from "../audits/SpecialistAuditClient";
import "../audits/specialist-audit.css";

export default function BrandAuditPage() {
  return <SpecialistAuditClient kind="brand" title="Brand Intelligence" subtitle="Audita posicionamiento, mensaje y señales públicas de marca distinguiendo evidencia observable de interpretación y recomendación." placeholder="https://mimarca.com" />;
}
