# LECCIONES — errores que ya cometimos y cómo no repetirlos

Lectura obligatoria para cualquier agente antes de decir "ya funciona". Añade una fila cada vez que algo falle por una causa que se pudo prever.

## Reglas que salen de esas lecciones

1. **"Compilado", "enviado" o "desplegado" no es "funciona".** Solo vale lo que se comprobó en el uso real (o lo confirma la persona). Etiquetas: DESARROLLADO · PROBADO EN CI · INSTALADO · VERIFICADO EN OPERACIÓN.
2. **Antes de decir que se publicó, mirar la dirección pública** (`curl` o navegador) y buscar el texto nuevo.
3. **Antes de diagnosticar, buscar una prueba que distinga las hipótesis** (p. ej. "¿le llegaron otros mensajes enviados igual?"). No cambiar código por una sospecha.
4. **Leer el código que corre en producción, no el de `main`.** VivaBot y NEXO tienen ramas `ccr-*` desplegadas que no están en `main`.
5. **Pensar 2 o 3 pasos por delante del usuario**: después de crear algo, ¿cómo entra, cómo lo recupera, qué pasa si se equivoca, qué pasa si ya existía?
6. **Probar con datos reales solo con copia de seguridad** y dejarlo todo como estaba (o explicar qué quedó).
7. **Toda corrección de dinero (comisiones, caja, stock) se simula antes en una transacción revertida** y se prueba el caso parcial, no solo el completo.

## Registro

| Fecha | Qué falló | Causa real | Regla |
|---|---|---|---|
| 2026-10-10 | Lennys no podía entrar al panel aunque "ya estaba arreglado" | El arreglo estaba en una rama y Vercel no publica solo desde el 4-oct | 2 |
| 2026-10-10 | Se dijo "enviado" y a Lennys no le llegó / no lo vio | El buzón marca "enviado" cuando WhatsApp lo acepta; nadie confirmó la entrega | 1 |
| 2026-10-10 | Se cambió el envío a `@lid` y el bot lo rechazó | Diagnóstico sin prueba; el bot en el VPS (rama `ccr`) solo admite teléfono o grupo `@g.us` | 3, 4 |
| 2026-10-10 | Devolver 1 de 3 anulaba la comisión de las 3 | La función solo contemplaba devoluciones totales | 7 |
| 2026-10-10 | Comisión de gestora siempre 0 en la caja | D36 se cargó en la web (Core) y no en NEXO; regla general en 0 | 1 |
| 2026-10-10 | Tras "Crear cuenta" no había forma clara de entrar | Se construyó el paso, no el recorrido completo | 5 |
| 2026-10-10 | Lennys pudo añadir 14 toallas con 3 en stock | La caja no comprobaba existencias al añadir al carrito | 7 |
| 2026-10-11 | El trabajo nocturno habría fallado en silencio (401) | La clave de Vault no es la misma que el secreto de la función; solo se vio al ejecutar el trabajo de verdad | 1 |
| 2026-10-11 | La regla de fotos del panel habría rechazado a la dueña | Las reglas de storage corren como `authenticated`, que no puede llamar a `nexo_business.role_of`; solo se vio probando el INSERT como ella | 1 |
| 2026-10-11 | Copiar comisiones en la ficha de costo habría puesto costo 0 a productos | La comisión vivía dentro de una tabla que exige precio de compra | 5 |
