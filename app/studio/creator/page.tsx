import SpecialistAuditClient from "../audits/SpecialistAuditClient";
import "../audits/specialist-audit.css";

export default function CreatorAuditPage() {
  return <SpecialistAuditClient kind="creator" title="Creator Intelligence" subtitle="Analiza señales públicas iniciales de un canal, perfil o contenido sin fingir métricas que todavía no están conectadas." placeholder="https://youtube.com/@canal" />;
}
