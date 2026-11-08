# Rectificación posterior al cierre · autorización #1258

Ernesto autorizó corregir exclusivamente la salida errónea de 2 CUP del 8 de noviembre de 2026, conservando el pago correcto de 2 USD y el historial. La tienda cerró el turno a las 15:13 de Cuba antes de efectuar la corrección. Versión instalada comprobada: 1.1.4; equipo `pc-casa-viva-1021-281b`. No tiene acceso remoto.

## Comportamiento de la actualización 1.1.5

- Conserva íntegros movimientos, conteos y cierre. No reabre turnos ni crea una entrada de efectivo; no modifica la apertura siguiente.
- Guarda una anotación posterior e inmutable en `local_cash_rectifications` y su evento `cash_shift.rectified` en una transacción. El evento viaja por la sincronización existente.
- El adaptador Casa Viva permite únicamente el caso ya autorizado #1258, sobre su equipo y movimiento exactos, con fecha real y persona que pulsa el botón. La interfaz no recibe un importe editable ni permite aplicar otras correcciones.
- Comprueba el movimiento protegido de 2 USD y todos los conteos originales contra el plan autorizado antes de escribir. Si hay otra corrección, una moneda/importe distintos, otro equipo, o un cierre diferente, se detiene.
- Identificadores estables y restricciones únicas impiden duplicados después de doble toque, reintento o reinicio. Fallar al guardar el evento revierte también la anotación.
- Copia SQLite consistente antes de la migración, mediante un plugin registrado antes del plugin SQL (orden comprobado en Tauri 2.12.0). Segunda copia antes de aplicar la rectificación. Ambas incluyen WAL y pasan `quick_check`; un fallo impide continuar.
- El servidor acepta solo un evento de un dispositivo autenticado cuyo contenido coincide exactamente con una autorización privada registrada por operaciones. La autorización incluye copias de ambos movimientos y del cierre; cualquier diferencia bloquea la admisión. Tablas con RLS, sin permisos para `anon`/`authenticated`, rectificación inmutable.

## Importes de control

El cierre original conserva CUP contado 42 640,00, esperado 42 612,10, diferencia 27,90. La anotación de +2,00 CUP muestra esperado histórico rectificado 42 614,10 y diferencia 25,90. No modifica el contado, no resuelve la diferencia restante ni autoriza corregirla. USD conserva 643,00 contado/esperado, diferencia cero, y el pago de 2,00 USD intacto.

La anotación se muestra al lado del cierre en la caja; los informes antiguos que solo leen el cierre original seguirán mostrando esa fotografía histórica. No se debe presentar ese valor original como un cierre reescrito ni convertir la rectificación en efectivo del día siguiente.

## Validación y entrega

Probado con SQLite y las migraciones reales: integridad de originales, USD y siguiente turno; reintentos; autorización errónea; rechazo de cambios/borrados; fallo del outbox; rechazo de fecha anterior; comprobación del cierre. Copia desde base de solo lectura con WAL verificada.

Prueba PostgreSQL en esquema desechable y transacción revertida: importe/moneda/dispositivo incorrectos, movimiento USD cambiado, evento válido, reintento, inmutabilidad y permisos. No se escribieron movimientos financieros reales durante las pruebas.

Estado de entrega debe registrarse por separado: compilado, guardia cloud preparada, instalador publicado, instalado por tienda, rectificación aplicada, sincronización confirmada. No cerrar #1258, #1252 ni escalación #552 solo porque se compile o se publique.

Intervención imprescindible: alguien en la PC de tienda cierra la caja, instala la actualización conservando datos, vuelve a abrir, selecciona quién es, entra en Caja y pulsa «Aplicar rectificación de 2 CUP». Debe ver «guardada y sincronizada». El supervisor comprobará la fila cloud y la conservación exacta de los originales antes de declarar completado.

## Recuperación

Antes de aplicar una rectificación, se puede retirar el candidato y restaurar la copia anterior a 1.1.5 con la aplicación cerrada, solo si no hubo nuevas operaciones posteriores a la copia. No copiar una base antigua encima de trabajo nuevo. Después de aplicar/sincronizar, no borrar ni restaurar para ocultar el evento: conservar las pruebas y resolver cualquier incidencia mediante otra actuación autorizada.
