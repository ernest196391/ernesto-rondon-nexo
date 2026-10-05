# BLUEPRINT NEXO v1.1 (corregido tras la auditoría del 2026-10-05)

Versión ilustrada con diagramas (solo lectura, puede quedar atrás): documento "NEXO Ecosystem Blueprint v1" en claude.ai.
**Si hay diferencia, manda este archivo.**

## Definición

- **En una oración:** NEXO conecta los productos, las ventas y las operaciones de un pequeño negocio para que venda más con menos trabajo.
- **A un negocio:** registras tus productos una vez y NEXO los pone a vender en la caja, en WhatsApp, en internet y a través de gestoras, con el inventario y la caja al día, aunque no haya internet.
- **A un comprador:** buscas, preguntas, te responden con precio y stock reales, compras y recibes.
- **A un inversor:** capa operativa y comercial para pequeños negocios en mercados con infraestructura limitada, empezando por Cuba. Cobra por implementación, suscripción y comisión sobre ventas de una red de revendedores.

## Problema

La verdad comercial del negocio (fotos, precios, stock, deudas, comisiones) vive en el teléfono del dueño, en libretas y en Excel, y se copia a mano a cada canal. Envejece, se contradice y el dueño se vuelve el cuello de botella. Las herramientas existentes asumen internet estable, tarjeta internacional y un técnico.

## Propuesta de valor

1. **Una sola verdad, muchos canales.** Cambias un precio una vez.
2. **Hecho para Cuba.** Funciona desde un teléfono, sin internet, sin pasarela de pago internacional, con ayuda humana para empezar.
3. **Una red de venta sin inventario.** Gestoras venden con enlaces y comisiones automáticas.
4. **IA que no inventa.** Responde solo con datos verificados.

## Arquitectura

```
Personas:     Comprador        Dueño / empleados        Gestora          (Implementación NEXO: servicio humano)
Puertas:      NEXO (tienda)    NEXO Business            NEXO Impulsa
                     \               |                    /
CORE:   identidad y roles · catálogo verificado · inventario · pedidos · pagos registrados ·
        atribución y comisiones · conocimiento · asistente · entregas · sync · eventos y auditoría
                     /               |                    \
Canales:      WhatsApp        Caja (Windows/Android)    Web / WooCommerce / Excel / AxisSoft
```

Ninguna puerta guarda datos propios. Todo se lee y se escribe en el Core.

## Productos

| Producto | Para quién | Estado real |
|---|---|---|
| NEXO Business | Dueños de comercios | Funcionando en Casa Viva (ver `ESTADO.md`) |
| NEXO Impulsa | Gestoras | Parte hecha en la web (oficina de gestoras) y en el panel de NEXO Business |
| NEXO (tienda para compradores) | Compradores | Existe la tienda web; el buscador general de varios comercios va **después** |
| Implementación NEXO | Dueños | Servicio; los kits de `kits/` son sus herramientas |

## Rueda de crecimiento (flywheel)

Comercio entra con NEXO Business → su catálogo queda verificado → gestoras lo venden sin comprar mercancía → más ventas atribuidas → el comercio y la gestora ganan y lo cuentan → entra otro comercio.
Cada comercio recibe valor **solo**, sin depender de la red. Los compradores entran en la rueda cuando haya suficientes catálogos reales.

## Roadmap por dependencias (no por fechas)

| Fase | Qué | Para pasar a la siguiente |
|---|---|---|
| **AHORA** | NEXO Business estable en Casa Viva (pruebas en tienda, uso diario de Lennys). Mudanza de dominios. Oferta escrita con método Hormozi. Sistema visual NEXO. | Casa Viva lo usa 30 días seguidos y los tres pilotos tienen oferta presentada |
| **SIGUIENTE** | Colo Shop (conector Axis) cuando pague. Mercado 23 y 28 como tercer piloto nativo. "Digitaliza tus productos" para cargar catálogos. Asistente WhatsApp leyendo de NEXO. Web `nexocuba.com`. | 3 comercios pagando |
| **DESPUÉS** | NEXO Impulsa abierto a gestoras de varios comercios. Entregas y mensajeros. Clientes y campañas. | Gestoras vendiendo cada semana en más de un comercio |
| **FUTURO** | NEXO para compradores (buscar en todos los comercios). Alta sin ayuda. Marca blanca. Otros mercados. | Demanda real |

## Web `nexocuba.com` v1

Una sola acción: pedir diagnóstico gratis por WhatsApp. Recorrido: portada → problema ("¿Hay? ¿Precio? ¿Foto?") → idea → cómo funciona en 3 pasos → 3 soluciones (Business, Impulsa, Implementación) → casos reales (Casa Viva, sin cifras inventadas) → "¿Qué necesitas?" → empezar.
El texto final de la oferta sale de `NEGOCIO.md`.
