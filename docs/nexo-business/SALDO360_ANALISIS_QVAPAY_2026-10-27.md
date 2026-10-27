# Saldo 360 — ¿Qué copiar de QvaPay («Cubapay») y qué no? (27-oct-2026)

Pedido de Ernesto: verificación de identidad (KYC), doble factor (2FA), tienda dentro, **custodia de saldo** y **transferencias**.
Base: información pública de QvaPay (las fotos que Ernesto mandó a «Tú» no se pudieron ver: el VPS rechazaba SSH ese momento).

## Cómo funciona QvaPay (resumen)
- Cuenta digital en «dólares» internos (**QUSD**, 1:1 con USD). Se recarga con cripto, Payeer o AirTM; se retira a tarjetas MLC o fuera de Cuba.
- **KYC obligatorio**: verificación de identidad (dicen que automática con IA).
- **P2P** entre usuarios sin comisión; **tiendas** dentro de la web (las tiendas pagan comisión/impuestos).
- QvaPay **custodia el dinero** de los usuarios: es, en la práctica, una billetera/pasarela de pagos.

## Lo que significaría en Saldo 360
| Función | Qué implica | ¿Ahora? |
|---|---|---|
| **2FA** (código de una app tipo Google Authenticator) | Supabase lo trae gratis (TOTP). Bajo coste, protege cuentas de vendedores y admin. | ✅ **Sí** (admin y vendedores, opcional para compradores) |
| **Verificación de vendedor por niveles** («KYC ligero») | Nivel 1: número verificado por WhatsApp (**ya hecho**). Nivel 2: revisión humana (foto/selfie con el número, sin guardar carné). Insignia «Vendedor verificado». | ✅ **Sí**, sin guardar documentos de identidad |
| **KYC completo** (carné/pasaporte guardados) | Datos muy sensibles; obligaciones de protección, retención y seguridad; riesgo si se filtran. | ⏸️ Solo si hay custodia de dinero o lo exige la ley |
| **Tienda dentro** | Ya existe (Mi tienda + ofertas). Ampliar a otros productos digitales (recargas, paquetes) o perfil destacado de pago. | ✅ Ampliación pequeña, después del piloto |
| **Custodia de saldo** (que la gente «guarde» saldo en Saldo 360) | Saldo 360 tendría que poseer líneas Cubacel o dinero ajeno: licencia de pagos del Banco Central de Cuba (como ETECSA con Transfermóvil), riesgo de fraude y robo, responsabilidad ante pérdidas, posibles problemas con condiciones de ETECSA y con sanciones/leyes del país de Ernesto. Vercel Hobby no permite uso comercial. | ❌ **No ahora** |
| **Transferencias entre usuarios** | Igual que la custodia: es mover dinero de terceros (transmisor de dinero). | ❌ **No ahora** |
| **Garantía/escrow** («pago retenido hasta confirmar») | Es custodia temporal: mismos riesgos. | ❌ No propio. ⏩ Alternativa: integrar un proveedor que ya custodia (p. ej. la API de pagos de QvaPay) más adelante, sin tocar el dinero |

## Recomendación
1. **Ahora (semanas):** cerrar el piloto con 3 proveedores reales; **2FA** para admin y vendedores; **insignia de vendedor verificado** (WhatsApp verificado + revisión humana); reportes y reputación ya existentes.
2. **Después del piloto (si hay tracción):** perfil destacado de pago, más productos en la tienda, estadísticas para vendedores.
3. **Solo con asesoría legal y socio con licencia:** pagos dentro de la app usando una pasarela existente (QvaPay u otra) que custodie ella; nunca custodia propia.
4. **No hacer:** billetera propia, saldo guardado, transferencias P2P, cripto. Contradice D83 («no custodiar fondos ni procesar pagos en el MVP») y añade el riesgo más alto con el menor beneficio a corto plazo.
