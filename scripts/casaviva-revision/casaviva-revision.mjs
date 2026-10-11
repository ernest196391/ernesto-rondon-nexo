// Revisión de Casa Viva (solo lectura) para el mod /casaviva de Claude Code.
// Vive en el VPS del bot: /root/supervisor/casaviva-revision.mjs. Uso: node casaviva-revision.mjs [horas=3]
// Devuelve un JSON con lo que hay que mirar: chats sin respuesta, audios perdidos, preguntas en
// los grupos, salidas con error o atascadas, avisos abiertos, preguntas del supervisor y códigos de caja.
import { createRequire } from 'module';
const require = createRequire('/root/vivabot/package.json');
require('dotenv').config({ path: '/root/vivabot/.env' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const horas = Number(process.argv[2] || 3);
const desde = new Date(Date.now() - horas * 3600e3).toISOString();
const hace = (min) => new Date(Date.now() - min * 60e3).toISOString();
const ocho = (s) => String(s || '').replace(/\D/g, '').slice(-8);
const corto = (s, n = 140) => String(s || '').replace(/\s+/g, ' ').slice(0, n);
const DUENO = '54056173'; // número de Ernesto / del bot
const GRUPOS = { '120363304301144410@g.us': 'General', '120363399264934901@g.us': 'Mensajerías CASA Viva' };

const out = {};

// Contactos: modo del bot por número (los "ignorar" son personales de Ernesto).
const { data: contactos } = await db.from('crm_contacts').select('id,name,phone,bot_mode,role').limit(5000);
const porId = new Map((contactos || []).map((c) => [c.id, c]));
const ignorados = new Set((contactos || []).filter((c) => c.bot_mode === 'ignorar').map((c) => ocho(c.phone)));

// 1) Chats cuyo último mensaje es del cliente y lleva más de 3 minutos sin respuesta.
const { data: msgs } = await db.from('crm_messages').select('contact_id,direction,author,body,created_at').gt('created_at', desde).order('created_at');
const ultimo = new Map();
for (const m of msgs || []) ultimo.set(m.contact_id, m);
out.sinResponder = [...ultimo.values()]
  .filter((m) => m.direction === 'in' && m.created_at < hace(3))
  .map((m) => ({ c: porId.get(m.contact_id) || {}, m }))
  .filter(({ c }) => c.bot_mode !== 'ignorar' && ocho(c.phone) !== DUENO)
  .map(({ c, m }) => ({ nombre: c.name || '?', tel: ocho(c.phone).slice(-4), rol: c.role || '', hora: m.created_at, texto: corto(m.body) }));

// 2) Mensajes que llegaron a WhatsApp pero el bot nunca procesó (p. ej. durante un reinicio).
const { data: wa } = await db.from('crm_wa_messages').select('chat_jid,sender_name,sender_phone,body,sent_at,is_group,from_me').gt('sent_at', desde).eq('from_me', false).order('sent_at').limit(2000);
const entradas = (msgs || []).filter((m) => m.direction === 'in').map((m) => ({ t: Date.parse(m.created_at), tel: ocho(porId.get(m.contact_id)?.phone) }));
out.perdidos = (wa || [])
  .filter((w) => !w.is_group && w.sent_at < hace(2))
  .filter((w) => { const t = ocho(w.sender_phone || w.chat_jid); return t && t !== DUENO && !ignorados.has(t); })
  .filter((w) => { const t = Date.parse(w.sent_at), tel = ocho(w.sender_phone || w.chat_jid); return !entradas.some((e) => e.tel === tel && e.t >= t - 20e3 && e.t <= t + 120e3); })
  .map((w) => ({ nombre: w.sender_name || '?', tel: ocho(w.sender_phone || w.chat_jid).slice(-4), hora: w.sent_at, texto: corto(w.body) }));

// 3) Preguntas en los grupos de gestoras y de mensajería.
out.preguntasGrupos = (wa || [])
  .filter((w) => w.is_group && GRUPOS[w.chat_jid] && /\?/.test(w.body || ''))
  .map((w) => ({ grupo: GRUPOS[w.chat_jid], nombre: w.sender_name || '?', hora: w.sent_at, texto: corto(w.body, 200) }));

// 4) Salidas del bot con error o atascadas.
const { data: errores } = await db.from('crm_outbox').select('id,status,error,created_at,to_phone,to_group').gt('created_at', hace(12 * 60)).eq('status', 'error');
out.salidasConError = (errores || []).map((o) => ({ id: o.id, hora: o.created_at, error: corto(o.error, 100) }));
const { data: atascadas } = await db.from('crm_outbox').select('id,status,created_at').in('status', ['pendiente', 'enviando']).lt('created_at', hace(5));
out.salidasAtascadas = (atascadas || []).map((o) => ({ id: o.id, estado: o.status, hora: o.created_at }));

// 5) Avisos abiertos y preguntas del supervisor esperando a Ernesto.
const { data: esc } = await db.from('crm_escalations').select('id,kind,reason,created_at').eq('status', 'abierta').order('created_at');
out.avisosAbiertos = (esc || []).map((e) => ({ id: e.id, tipo: e.kind, hora: e.created_at, motivo: corto(e.reason, 160) }));
const { data: preg } = await db.from('crm_supervisor').select('id,body,created_at').eq('kind', 'pregunta').eq('status', 'pendiente').order('id');
out.preguntasSupervisor = (preg || []).map((p) => ({ id: p.id, texto: corto(p.body, 160) }));

// 6) Códigos de caja sin usar (y cuándo vencen).
const { data: cods } = await db.schema('nexo_business').from('device_enrollments').select('label,expires_at,used_at').eq('business_id', 'casa-viva').is('used_at', null).gt('expires_at', new Date().toISOString());
out.codigosCajaSinUsar = (cods || []).map((c) => ({ caja: c.label, vence: c.expires_at }));

out.generado = new Date().toISOString();
console.log(JSON.stringify(out));
