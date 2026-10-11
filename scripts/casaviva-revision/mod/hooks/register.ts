import type { Register } from 'claude-code'

// Revisión de Casa Viva para Ernesto. Lee (solo lectura) dos scripts en los servidores:
//  - VPS del bot: /root/supervisor/casaviva-revision.mjs (chats, salidas del bot, avisos, códigos de caja)
//  - Web: ~/casaviva-pedidos.php (pedidos web abiertos)
// Copias en ernesto-rondon-nexo/scripts/casaviva-revision/.

const VPS = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', 'C:/Users/Ernesto/.ssh/vivabot_vps', 'root@179.236.242.212', 'cd /root/supervisor && node casaviva-revision.mjs 3']
const WEB = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', '-i', 'C:/Users/Ernesto/.ssh/casa-viva-github-actions', '-p', '65002', 'u824654880@88.223.85.72', 'cd domains/casaviva.company/public_html && wp eval-file ~/casaviva-pedidos.php']

type Fila = Record<string, string | number | null | undefined>
type Revision = {
  sinResponder: Fila[]; perdidos: Fila[]; preguntasGrupos: Fila[]; salidasConError: Fila[]; salidasAtascadas: Fila[]
  avisosAbiertos: Fila[]; preguntasSupervisor: Fila[]; codigosCajaSinUsar: Fila[]; pedidosAbiertos: Fila[]; fallos: string[]
}

const vacia = (): Revision => ({ sinResponder: [], perdidos: [], preguntasGrupos: [], salidasConError: [], salidasAtascadas: [], avisosAbiertos: [], preguntasSupervisor: [], codigosCajaSinUsar: [], pedidosAbiertos: [], fallos: [] })

async function leer($: any, argv: string[], nombre: string, r: Revision): Promise<Record<string, unknown>> {
  try {
    const res = await $.process.run(argv, { timeoutMs: 60000 })
    const linea = String(res.stdout || '').trim().split('\n').filter((l: string) => l.startsWith('{')).pop()
    if (res.exitCode !== 0 || !linea) { r.fallos.push(`${nombre}: no respondió (código ${res.exitCode})`); return {} }
    return JSON.parse(linea)
  } catch (err) {
    r.fallos.push(`${nombre}: ${String((err as Error)?.message || err).slice(0, 120)}`)
    return {}
  }
}

async function revisar($: any): Promise<Revision> {
  const r = vacia()
  const [a, b] = await Promise.all([leer($, VPS, 'servidor del bot', r), leer($, WEB, 'web', r)])
  Object.assign(r, a, b)
  return r
}

const hora = (iso: unknown) => {
  if (!iso) return ''
  try { return new Date(String(iso)).toLocaleTimeString('es-ES', { timeZone: 'America/Havana', hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export function resumen(r: Revision): string {
  const partes: string[] = []
  if (r.sinResponder.length) partes.push(`${r.sinResponder.length} sin responder`)
  if (r.perdidos.length) partes.push(`${r.perdidos.length} perdidos`)
  if (r.pedidosAbiertos.length) partes.push(`${r.pedidosAbiertos.length} pedidos abiertos`)
  if (r.salidasConError.length + r.salidasAtascadas.length) partes.push(`${r.salidasConError.length + r.salidasAtascadas.length} envíos con problema`)
  if (r.avisosAbiertos.length) partes.push(`${r.avisosAbiertos.length} avisos`)
  if (r.fallos.length) partes.push('⚠ revisión incompleta')
  return 'Casa Viva: ' + (partes.length ? partes.join(' · ') : 'todo al día ✓')
}

export function informe(r: Revision): string {
  const L: string[] = ['## Revisión de Casa Viva (últimas 3 h)']
  const sec = (titulo: string, filas: Fila[], fmt: (f: Fila) => string) => {
    L.push('', `### ${titulo} (${filas.length})`)
    L.push(...(filas.length ? filas.slice(0, 15).map((f) => '- ' + fmt(f)) : ['- Nada.']))
    if (filas.length > 15) L.push(`- …y ${filas.length - 15} más`)
  }
  sec('Chats sin respuesta (más de 3 min)', r.sinResponder, (f) => `${hora(f.hora)} · ${f.nombre} (…${f.tel}${f.rol ? ', ' + f.rol : ''}): "${f.texto}"`)
  sec('Mensajes que el bot no procesó', r.perdidos, (f) => `${hora(f.hora)} · ${f.nombre} (…${f.tel}): "${f.texto}"`)
  sec('Pedidos web abiertos', r.pedidosAbiertos, (f) => `#${f.pedido} · hace ${f.minutos} min · ${f.estado}/${f.operacion}/${f.reparto} · ${f.entrega}${f.gestora ? ' · gestora ' + f.gestora : ''}${f.mensajero ? ' · lo lleva ' + f.mensajero : ''}${f.elegido ? ' · elegido ' + f.elegido : ''} · ${f.productos} · ${f.total} USD`)
  sec('Preguntas en los grupos', r.preguntasGrupos, (f) => `${hora(f.hora)} · ${f.grupo} · ${f.nombre}: "${f.texto}"`)
  sec('Envíos del bot con error', r.salidasConError, (f) => `#${f.id} ${hora(f.hora)}: ${f.error}`)
  sec('Envíos atascados (más de 5 min)', r.salidasAtascadas, (f) => `#${f.id} ${f.estado} desde ${hora(f.hora)}`)
  sec('Avisos abiertos del bot', r.avisosAbiertos, (f) => `#${f.id} ${f.tipo} (${hora(f.hora)}): ${f.motivo}`)
  sec('Preguntas esperando tu SÍ/NO', r.preguntasSupervisor, (f) => `#${f.id}: ${f.texto}`)
  sec('Códigos de caja sin usar', r.codigosCajaSinUsar, (f) => `${f.caja} · vence ${hora(f.vence)}`)
  if (r.fallos.length) L.push('', '### ⚠ No se pudo revisar todo', ...r.fallos.map((x) => '- ' + x))
  return L.join('\n')
}

const REGLAS = `Atiende lo pendiente del informe de Casa Viva de arriba. Reglas (de Ernesto, 11-oct):
- Habla a Ernesto en español sencillo, paso a paso. Lee primero docs/00-FUENTE-DE-VERDAD/LEEME.md y la última sección de ESTADO.md si no lo has hecho en esta sesión.
- Antes de contestar a alguien, lee su chat completo (crm_messages y crm_wa_messages) y comprueba los datos reales (pedido, existencias, cuenta). Nunca afirmes algo sin comprobarlo.
- Las respuestas van por el buzón del bot (public.crm_outbox, kind 'texto', created_by 'claude'; a teléfonos por to_phone, a grupos por to_group). Después comprueba que salieron (status 'enviado').
- No prometas lo que no puedes hacer. En pedidos de una gestora, habla solo con la gestora, nunca con su cliente.
- Contactos con bot_mode 'ignorar' son personales de Ernesto: no se les escribe.
- Puedes cancelar pedidos de prueba que su gestora pidió cancelar. Cambios de dinero, borrar datos o tocar código en producción: pregunta antes a Ernesto, salvo lo ya autorizado.
- No reinicies el bot si alguien escribió en el último minuto.
- Si el bot contestó mal, corrígelo (respuesta en crm_knowledge o regla en src/brain.js) y avisa a la persona.
- Al terminar, resume a Ernesto qué hiciste y qué necesita decidir él, y apúntalo en ESTADO.md.`

let ultimoUrgente = 0

async function refrescar($: any) {
  const r = await revisar($)
  await $.ui.status(resumen(r))
  const urgente = r.sinResponder.length + r.perdidos.length + r.salidasConError.length
  if (urgente > ultimoUrgente) await $.ui.toast(`Casa Viva: ${urgente} sin atender. Escribe /casaviva para verlo.`)
  ultimoUrgente = urgente
}

const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'casaviva', description: 'Revisa chats, pedidos y avisos de Casa Viva (solo lectura)' })
    await $.command.register({ name: 'casaviva-atiende', description: 'Revisa Casa Viva y pide a Claude que atienda lo pendiente' })
    $.clock.after(2000, () => refrescar($))
    $.clock.every(5 * 60 * 1000, () => refrescar($))
    return next(e)
  })

  on('command.run', { command: 'casaviva' }, async ($) => {
    const r = await revisar($)
    await $.ui.status(resumen(r))
    return { text: informe(r) }
  })

  on('command.run', { command: 'casaviva-atiende' }, async ($) => {
    const r = await revisar($)
    await $.ui.status(resumen(r))
    const texto = informe(r)
    await $.prompt.submit({ text: `${texto}\n\n${REGLAS}` })
    return { text: 'Revisión hecha. Claude empieza a atender lo pendiente.' }
  })
}

export { register }
