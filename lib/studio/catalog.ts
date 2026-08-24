import type { Specialist } from "./types";
export const specialists: Specialist[] = [
  { id:"web-studio",name:"NEXO Web Studio",shortName:"Web Studio",description:"Audita una web, detecta oportunidades y prepara una propuesta de mejora o prototipo.",inputHint:"URL del negocio",status:"ready",accent:"01" },
  { id:"conversations",name:"NEXO Conversations",shortName:"Conversations",description:"Diseña y opera asistentes conversacionales con guardrails, memoria y handoff humano.",inputHint:"Negocio + canal + objetivo",status:"planned",accent:"02" },
  { id:"business-audit",name:"NEXO Business Audit",shortName:"Business Audit",description:"Cruza presencia pública y procesos internos. Ya analiza el formulario de 36 preguntas con privacidad, evidencia y madurez /5.",inputHint:"URL + formulario",status:"ready",accent:"03" },
  { id:"creator-intelligence",name:"NEXO Creator Intelligence",shortName:"Creator",description:"Analiza señales públicas iniciales de canales, perfiles y contenido con límites explícitos sobre métricas no conectadas.",inputHint:"Canal, perfil o contenido",status:"ready",accent:"04" },
  { id:"content-studio",name:"NEXO Content Studio",shortName:"Content Studio",description:"Procesa vídeo, subtítulos, cortes, formatos verticales y activos reutilizables.",inputHint:"Archivo de vídeo",status:"planned",accent:"05" },
  { id:"brand-intelligence",name:"NEXO Brand Intelligence",shortName:"Brand",description:"Audita posicionamiento, mensaje y señales públicas de marca separando evidencia, interpretación y acción.",inputHint:"URL de persona o marca",status:"ready",accent:"06" },
  { id:"commerce-audit",name:"NEXO Commerce Audit",shortName:"Commerce",description:"Evalúa señales públicas de experiencia de compra, confianza, móvil, jerarquía y riesgo de rendimiento.",inputHint:"URL de la tienda",status:"ready",accent:"07" },
  { id:"kit-builder",name:"NEXO Kit Builder",shortName:"Kit Builder",description:"Convierte una tarea repetitiva en un contrato portable de especialista con manifest, SPEC, workflow y gates.",inputHint:"Tarea repetitiva",status:"ready",accent:"08" },
];
