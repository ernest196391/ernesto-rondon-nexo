export type AreaResult={name:string;level:number|null;evidence:string;next:string};
export type BusinessAuditResult={scope:"inside";maturity:number|null;band:string;areas:AreaResult[];missing:number[];privacyBlocked:boolean;privacyReason?:string;hoursNote:string;crossNote:string};

const areaDefs=[
 ["Captación y primer contacto",[7,8,9,10,11],"Centralizar entradas, respuesta fuera de horario y medir consultas."],
 ["Agenda y citas",[12,13,14,15,16],"Pasar a reserva y recordatorios automáticos con no-show medido."],
 ["Cobro y facturación",[17,18,19,20,21],"Conectar presupuesto, cobro y factura para evitar transcripción manual."],
 ["Comunicación y seguimiento",[15,22,23,25],"Automatizar seguimiento y petición de reseña sin perder el tono humano."],
 ["Datos y medición",[26,27,30],"Centralizar datos operativos y revisar indicadores cada mes."],
 ["Retención y reactivación",[22,24,25],"Crear avisos de recurrencia y reactivación medibles."],
 ["Seguridad, copias y RGPD",[8,27,28,29],"Implantar copias verificadas y accesos individuales."],
 ["IA y automatización actual",[33,34],"Empezar por una automatización pequeña con control de calidad."],
] as const;

export function parseAnswers(text:string){const out:Record<number,string>={};const re=/(?:^|\n)\s*(?:\*\*)?P(\d{1,2})(?:\.\*\*)?[^\n]*\n([\s\S]*?)(?=(?:\n\s*(?:\*\*)?P\d{1,2}(?:\.\*\*)?[^\n]*\n)|$)/gi;let m;while((m=re.exec(text)))out[Number(m[1])]=m[2].trim();return out}
function levelFor(values:string[]){const s=values.join(" ").toLowerCase();if(!s.trim())return null;if(/autom[aá]tic|reserva.*internet|secuencia|panel|alerta|integraci|conectad/.test(s))return 4;if(/programa|software|crm|calendar|calendario|tpv|sistema/.test(s))return 3;if(/whatsapp|excel|email|correo|m[oó]vil/.test(s))return 2;return 1}
function band(v:number|null){if(v===null)return"sin datos";if(v<2)return"artesanal";if(v<3)return"herramientas sueltas";if(v<4)return"digitalizado manual";if(v<4.5)return"conectado";return"automatizado"}
export function runBusinessAudit(text:string):BusinessAuditResult{
 const lower=text.toLowerCase();const blocked=["contraseña","password","api key","token de acceso","listado de clientes","historial clínico","historial clinico","exportación de clientes","exportacion de clientes"];
 const hit=blocked.find(x=>lower.includes(x));if(hit)return{scope:"inside",maturity:null,band:"bloqueado",areas:[],missing:[],privacyBlocked:true,privacyReason:`Se detectó contenido potencialmente sensible (${hit}). Retíralo antes de analizar.`,hoursNote:"No se procesaron las respuestas.",crossNote:"No se procesaron las respuestas."};
 const a=parseAnswers(text);const missing=Array.from({length:36},(_,i)=>i+1).filter(n=>!a[n]?.trim());
 const areas=areaDefs.map(([name,qs,next])=>{const vals=qs.map(q=>a[q]).filter(Boolean);const level=levelFor(vals);return{name,level,evidence:vals[0]?`P${qs.find(q=>a[q])}: ${vals[0].slice(0,180)}`:"Sin datos suficientes",next}});
 const scored=areas.map(x=>x.level).filter((x):x is number=>x!==null);const maturity=scored.length?Math.round((scored.reduce((x,y)=>x+y,0)/scored.length)*10)/10:null;
 const p31=a[31]||"";const hoursNote=p31?"Hay tareas repetitivas declaradas en P31. NEXO las conserva como evidencia, pero no inventa horas mensuales si el texto no permite una operación inequívoca.":"Falta P31: no se calculan horas recuperables.";
 return{scope:"inside",maturity,band:band(maturity),areas,missing,privacyBlocked:false,hoursNote,crossNote:"Para cruzar promesa exterior vs capacidad interior, añade también la URL pública del negocio."};
}