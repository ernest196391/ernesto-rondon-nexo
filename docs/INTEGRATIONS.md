# Integraciones y límites

| Integración | Contrato actual | Riesgo | Dirección |
|---|---|---|---|
| NEXO | rutas/API internas + Postgres + Woo | branding/schema runtime mezclados | adaptador, no importación directa de UI |
| WooCommerce | REST con URL/consumer credentials; SKU/remote ID | duplicados, side effects, secretos | publicación idempotente en borrador y reconciliación |
| Cuyana | Next.js + Supabase; catálogo ecommerce ausente | acoplar remesas a productos | consumidor autorizado del catálogo central |
| Casa Viva | plugin Woo/PHP y estados operativos | metadatos específicos e historia compleja | reutilizar contratos/fixtures, no copiar implementación |
| IA | OpenAI/Google server-side | costo, alucinación, timeout | router registrable; IA propone, reglas deciden |
| imágenes | Sharp/local en NEXO | persistencia y fidelidad | storage por tenant, hashes y revisión |
| WhatsApp | enlace público y APIs opcionales | no es fuente de verdad | persistir pedido antes de abrir canal |
| Revolico | sin API permitida validada | anti-bot | solo paquete exportable |

Variables requeridas conocidas (solo nombres): `DATABASE_URL`, `CONTENT_WORKER_URL`, `CONTENT_WORKER_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`, `WORDPRESS_URL`, `WORDPRESS_USERNAME`, `WORDPRESS_APPLICATION_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WHATSAPP_NUMBER` y variables `NEXO_*`/`WHATSAPP_*` enumeradas por el código. Los valores no se registran.
