# Auditoría inicial y piloto Casa Viva — Saldo 360
Fecha: 2026-10-26 · Rama: `casa-viva/saldo360-piloto-20261026`
Estado: AUDITORÍA INICIAL, NO DESPLEGADO.

## Evidencia comprobada
- Repo: `ernest196391/ernesto-rondon-nexo`; `main` usa Next.js 16, React 19, módulos `apps/business-pos`, `apps/business-dashboard`, `packages/business-*` y tienda/gestoras web.
- Búsqueda de código GitHub en `main`: **0 resultados exactos** para «Saldo 360» o «saldo360». No se puede afirmar que la app exista como módulo propio; sí hay saldos, comisiones, caja, cuentas por cobrar y reportes de NEXO Business.
- Ramas existentes relacionadas con Casa Viva: `claude/casa-viva-catalog-import`, `claude/casa-viva-company-domain`, `fix/casa-viva-stock-guard-20261010`. Se creó una rama nueva desde `main` para evitar alterar trabajos anteriores.
- `docs/00-FUENTE-DE-VERDAD/ESTADO.md` documenta riesgo de stock no verificado y comisiones incorrectas en el piloto POS; antes de exponer saldos o permitir retiros hay que conciliar datos reales.
- Las decisiones centrales D04, D08, D10, D11 y D42 establecen NEXO Business como producto, Casa Viva como piloto y a las gestoras como principales usuarias de herramientas gratuitas. No cambiar precios ni reglas de comisiones sin decisión explícita.
- No se confirmó el servicio de despliegue ni el dominio de un Saldo 360 autónomo; Render requiere elegir un workspace.

## Definición provisional del piloto — NO PRESENTAR COMO SISTEMA CONTABLE VALIDADO
Validar con 5 gestoras de Casa Viva una pantalla móvil **Mi dinero**, sin crear una marca nueva ni duplicar el motor contable.

### Pantalla de gestora (máximo 1 pantalla principal)
Título: «Mi dinero»
1. **Por cobrar:** cantidad confirmada; separar claramente `pendiente de revisión` de `disponible`.
2. **Mis ventas:** lista de últimas ventas, fecha, estado y comisión confirmada.
3. **Mis pagos:** fecha, importe, moneda y comprobante asociado.
Acción principal: «Ver mis movimientos».
Ayuda: «¿Falta una venta? Avisar a Casa Viva».
No mostrar saldos mezclados CUP/USD. No exhibir importes de ejemplo como datos verdaderos ni inferir pagos a partir de pedidos sin conciliar. Sin IA decorativa, sin texto de marketing largo, sin acciones financieras irreversibles.

### Pantalla de dueña (Casa Viva)
«Hoy» · ventas registradas / pendientes de conciliación / comisiones por revisar.
Acciones «Revisar diferencias», «Ver gestoras», «Registrar pago» solo si el contrato de datos y permisos está validado.

## Modelo de negocio — hipótesis para validar hoy
- Primer usuario: 5 gestoras activas de Casa Viva.
- Distribución: invitación personal, no publicidad masiva; acceso sin pago al tablero básico (en línea con D42).
- Casa Viva no paga por una función aún sin conciliación; se usa como prueba de utilidad.
- Ingresos futuros: funciones premium voluntarias de captación y gestión comercial para gestoras; implementación y mensualidad NEXO Business para comercios. **Precios sin decidir**. No cobrar por acceder a comisiones debidas.
- Activación: gestora entra y reconoce su última venta/pago, comprende el estado sin ayuda.
- Métrica primera semana: activación (entra), comprensión (explica su saldo), desacuerdos reportados, tiempo para resolver una discrepancia, retorno a 7 días.

## Puertas antes de publicar
- [ ] Localizar nombre/URL funcional de «Saldo 360» (puede ser una denominación fuera del repositorio).
- [ ] Confirmar si se integra en `app/impulsa`, `apps/business-dashboard` u otro componente existente; evitar duplicación.
- [ ] Auditar fuentes de comisiones, pagos y stock; reconciliar al menos 5 gestoras con controles manuales.
- [ ] Prototipar interfaz con datos sintéticos identificados, capturas móvil y pruebas de comprensión.
- [ ] PR + `lint`, `typecheck`, `test`, `build`, CI sin fallas críticas.
- [ ] Prueba cerrada con permisos reales, consentimiento y privacidad.
- [ ] Seleccionar workspace/despliegue correcto y autorizar lanzamiento.

## Acciones comerciales del día
1. Invitar por WhatsApp a 5 gestoras activas a una prueba cerrada para ver ventas/comisiones, sin prometer que el saldo está conciliado.
2. Mostrar un boceto de 1 pantalla y preguntar qué información necesitan comprobar primero.
3. Registrar las dudas reales y 3 errores de comprensión más frecuentes.
4. Definir con Lennys quién valida diferencias y en cuánto tiempo responde.
5. No anunciar disponibilidad general hasta aprobar las puertas anteriores.

## Hallazgo principal
«Simplificar» no es quitar información financiera necesaria: es enseñar el dato verificable, el estado y la siguiente acción. **No lanzar saldos incorrectos para cumplir una fecha.**
