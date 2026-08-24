import type { Specialist } from "./types";

export const specialists: Specialist[] = [
  { id:"web-studio",name:"NEXO Web Studio",shortName:"Mejorar una web",description:"Analiza una web y convierte los problemas detectados en una propuesta clara de mejora.",inputHint:"URL de la web",status:"ready",accent:"01" },
  { id:"conversations",name:"NEXO Conversations",shortName:"Asistente de ventas",description:"Prueba cómo debería responder un asistente antes de conectarlo a WhatsApp u otro canal.",inputHint:"Negocio + reglas + mensaje",status:"ready",accent:"02" },
  { id:"business-audit",name:"NEXO Business Audit",shortName:"Auditar un negocio",description:"Cruza lo que ve un cliente con cómo funciona el negocio por dentro y prioriza qué corregir primero.",inputHint:"Web + respuestas del negocio",status:"ready",accent:"03" },
  { id:"creator-intelligence",name:"NEXO Creator Intelligence",shortName:"Analizar contenido",description:"Revisa un canal o perfil público y detecta patrones, oportunidades y próximos experimentos.",inputHint:"Canal, perfil o contenido",status:"ready",accent:"04" },
  { id:"content-studio",name:"NEXO Content Studio",shortName:"Editar un vídeo",description:"Convierte un vídeo en una versión vertical con transcripción, cortes revisables y subtítulos sincronizados.",inputHint:"Archivo de vídeo",status:"ready",accent:"05" },
  { id:"brand-intelligence",name:"NEXO Brand Intelligence",shortName:"Aclarar una marca",description:"Revisa cómo se presenta una marca y señala dónde su mensaje, oferta o posicionamiento pierden claridad.",inputHint:"URL de persona o marca",status:"ready",accent:"06" },
  { id:"commerce-audit",name:"NEXO Commerce Audit",shortName:"Revisar una tienda",description:"Detecta señales de fricción, confianza y conversión en una tienda online.",inputHint:"URL de la tienda",status:"ready",accent:"07" },
  { id:"kit-builder",name:"NEXO Kit Builder",shortName:"Crear un especialista",description:"Convierte una tarea repetitiva en un proceso reutilizable que NEXO pueda ejecutar y validar.",inputHint:"Tarea repetitiva",status:"ready",accent:"08" },
];
