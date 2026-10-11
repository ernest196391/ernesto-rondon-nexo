import { test, expect } from 'claude-code/testing'
import { resumen, informe } from './register.ts'

const base = { sinResponder: [], perdidos: [], preguntasGrupos: [], salidasConError: [], salidasAtascadas: [], avisosAbiertos: [], preguntasSupervisor: [], codigosCajaSinUsar: [], pedidosAbiertos: [], fallos: [] as string[] }

test('todo al día cuando no hay nada pendiente', () => {
  expect(resumen(base)).toBe('Casa Viva: todo al día ✓')
})

test('cuenta chats sin responder y pedidos abiertos', () => {
  const r = { ...base, sinResponder: [{ nombre: 'Dany', tel: '4351', hora: '2026-10-11T16:00:00Z', texto: 'hola?' }], pedidosAbiertos: [{ pedido: 2896 }, { pedido: 2898 }] }
  expect(resumen(r)).toBe('Casa Viva: 1 sin responder · 2 pedidos abiertos')
  const t = informe(r)
  expect(t).toContain('Chats sin respuesta (más de 3 min) (1)')
  expect(t).toContain('Dany (…4351')
  expect(t).toContain('#2898')
})

test('avisa cuando la revisión no pudo leer un servidor', () => {
  const r = { ...base, fallos: ['web: no respondió (código 255)'] }
  expect(resumen(r)).toContain('revisión incompleta')
  expect(informe(r)).toContain('No se pudo revisar todo')
})
