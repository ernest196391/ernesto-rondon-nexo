# Pendientes para el 17-oct-2026 (lo dejó Ernesto el 16-oct por la noche)

## Sale solo (crontab del VPS, una vez)
- 8:30 fotos comerciales de Dayra a Lennys · 8:35 lista de puntos a Dany · 9:00 abrir el Estudio de fotos + video en el General · 9:15 propuesta del programa a Lennys.
- Después: borrar esas líneas del crontab.

## Para Ernesto (decidir o dar)
1. **Encuesta anónima:** verla (`docs/nexo-business/encuesta/`) y decir SÍ para abrirla y mandarla al General, a Mensajerías y a la tienda. Plazo de 4 días. Luego se analiza y se publica «lo que nos dijeron y lo que haremos».
2. **El enlace de la comunidad** (Ernesto espera a que lo hagan administrador de la comunidad), para la bienvenida y para mandárselo a Damarys, Lena, Zulien, Daniela Piñero y Nayeli.
3. ~~Dispositivo vinculado nuevo~~: era el PC de Ernesto (16-oct). Resuelto.
4. **Leer `docs/nexo-business/mejoras/CUELLOS-DE-BOTELLA-2026-10-16.md`** y elegir qué se quita primero. Recomendado: productos de la web a la caja solos, aviso de chats en pausa sin respuesta, tarifa de mensajería en el bot.
5. **Video de las piedras:** verlo antes que Lennys.
6. **Reconectar el conector de Supabase** en Claude.

## Para Lennys (esperando su respuesta)
- Banqueta: ¿«24 con 3»? · El candado de Ely: ¿cuál es? · Unidades del protector Cisne Blanco · NO confirmar la entrada de Almacén 7 · Fotos de Dayra · Propuesta del programa (opción 2) · Alerta de la sombrilla.

## Multinivel
- Prueba con personas: Dany y 4 invitadas, hasta el 30-oct (`LANZAMIENTO.md`).
- Prueba técnica B6 (cierre de prueba con «Pedir mi pago»): de día y avisando a Lennys antes.
- La encuesta mide si se entiende (preguntas 12a y 12b).

## Sugerencias de Ernesto (16-oct, al cerrar) · EMPEZAR AQUÍ el 17-oct, comprobando paso a paso
**Créditos:** queda ~15 % hasta el martes 20-oct. Hasta entonces, solo arreglos y chat. Lo grande (todo lo de abajo) se diseña ahora y se construye cuando se renueve, salvo que Ernesto diga otra cosa.
1. **Resúmenes más representativos, que se vean «premium», escalables y que mejoran cada día:**
   - **Gestoras:** ranking con copa para la 1.ª, plata la 2.ª, bronce la 3.ª… y así en todo lo que se compare (mensajeros, productos).
   - **Panel de administración:** gráficas de crecimiento (día, semana, mes contra el anterior), y gráficas por producto (ventas, margen, tendencia).
   - Ese tipo de comparación en **cada cosa nueva** que se haga.
   - Mejorar también el prompt y la plantilla de los resúmenes con esa idea.
2. **Aprender de los errores todos los días, solo, a las 22:00, por áreas** (gestoras, mensajeros, tienda, administración, bot, web): «Hoy hay que mejorar esto, esto y esto, y lo que vamos a hacer es esto». Que lo genere el supervisor del VPS (Claude) y se lo mande a Ernesto. Aprovechar `crm_supervisor`, las escalaciones y los errores del bot.
3. **Quitar los cuellos de botella** de `docs/nexo-business/mejoras/CUELLOS-DE-BOTELLA-2026-10-16.md`.
4. Forma de trabajar mañana: Claude repasa los pendientes uno a uno y confirma cada cosa; Ernesto dice cuáles van primero.

## Multinivel: estar preparados (Ernesto, 16-oct al cerrar) · lanzar un agente el 17-oct
5. **Todas las preguntas posibles y cómo explicarlas fácil**, y metidas en el bot para que sepa contestarlas: respuestas aprobadas en la base de conocimiento, más la regla «si no sabe, te lo confirmo».
   - Base: `AUDITORIA-2026-10-16.md` §3 (preguntas de Lennys), las 15 preguntas de la presentación, el video de las piedras (`videos/tutorial-piedras/guion.txt`) y las dudas reales de Dany del 16-oct.
   - Una versión para gestoras (sin costos ni márgenes) y otra para administración. Ernesto también tiene que poder explicarlo: una hoja corta para él.
6. **Investigar la mejor forma de llevarlo** (buenas prácticas de programas de referidos y venta directa) y **alertas de riesgo de pérdida**:
   - el fondo se acerca al tope;
   - un mes con más bono que ganancia;
   - muchas devoluciones;
   - crecimiento raro de un equipo.
7. **Panel de administración del multinivel**, con gráficas y estadísticas:
   - quién entra cada semana;
   - cuánto aporta cada gestora y cada equipo;
   - fondo usado contra el tope;
   - lo que gana Casa Viva contra lo que paga el programa;
   - las piedras de cada mes;
   - la evolución.
   Hoy ya existe la pestaña «Programa» en el panel de Lennys (último cálculo, alertas y ficha de cada gestora): hay que ampliarla con las gráficas.
Nota: con los créditos justos hasta el martes, el 17-oct se empieza por el punto 5 (lo que más urge: las preguntas que llegarán), y los puntos 6 y 7 en cuanto haya créditos.

## Tutoriales organizados en «Aprende» (Ernesto, 16-oct al cerrar)
**Hoy NO está hecho.** «Aprende» (Core `class-cvd-aprende.php`) tiene una lista fija de 6 cosas: primera venta, cómo compra tu cliente, fotos para publicar, dudas del primer día, nota de voz y guías. Faltan los videos nuevos: NEXO Busca, Estudio de fotos y Piedras.
8. Añadir esos videos y **ordenar por secciones**: Empezar · Vender · Herramientas (NEXO Busca, Estudio de fotos, Fotos para publicar) · Cobrar (Pedir mi pago) · Programa (Piedras: solo quien ve el programa).
9. **Que lo aprobado se suba solo:** cuando Lennys diga «aprobado» de un tutorial, el supervisor lo sube a la web (medios + `cvd_aprende_media`) y aparece en su sección; avisa a Ernesto. La lista de tutoriales pasa a ser editable (una opción), sin tocar el código cada vez.
Es un cambio pequeño en Core: se puede hacer dentro del límite de créditos. El de NEXO Busca y el del Estudio (que sale el 17 a las 9:00 en el General) primero.

## Acceso de Ernesto a todo, desde el móvil (Ernesto, 16-oct al cerrar)
Hoy Ernesto solo tiene el usuario **1 (administrador)** en la web, con su teléfono 5354056173. Lennys es el usuario 14 (administradora). No tiene cuenta de gestor.
10. **Cuenta de gestor especial para Ernesto:** para ver sus ganancias de lo que vende y probar el onboarding de las gestoras en el móvil (registro, bienvenida, mi acceso, Aprende, Mi piedra).
    - Decidir: ¿con otro número de teléfono o con el mismo? El acceso por WhatsApp usa el teléfono y ya lo tiene el usuario 1.
    - ¿Sus ventas pasadas se le asignan?
    - Contraseña: la pone él con el enlace de un solo uso. Claude nunca la ve.
11. **«Ver como» para administradores:** desde su usuario, en el móvil, poder ver lo que ve Lennys (panel), una gestora (área y tienda con su enlace), un mensajero (área de mensajeros) y una dependienta (/ventas/ y la caja). Solo para mirar, sin entrar en la cuenta de nadie: es más seguro que compartir contraseñas.
    - Primero mirar qué existe ya en Core.
    - Es una construcción mediana: hacerla después del martes si los créditos no alcanzan. La cuenta del punto 10 sí cabe mañana.
    - **Decidido por Ernesto (16-oct):**
      - **El mismo número** (no tiene otro). Buscar la forma: (a) que el usuario 1 tenga también el papel de gestor (WordPress permite varios papeles en una cuenta), o (b) entrar con el correo. Comprobar primero qué hace Core con un administrador que también es gestor: «mi acceso», el área y las comisiones.
      - **Ventas que se le asignan:** la **mesita** que vendió con Nayelis (¿Nadielys? confirmar el pedido) y los **patines #3845** (16-oct).
      - **Las del split NO:** ya las cobró.
    - **Lo que se encontró (16-oct, noche):**
      - Nadielys es la usuaria 29.
      - Los **patines #3845** (105 USD, en espera) están **a nombre de Nadielys** como gestora.
      - La **mesita** no sale en ningún pedido de la web de octubre: ni en los de Nadielys ni buscando «mesit».
      - Ernesto dice que el vale de la mesita «está arriba» (el mensaje se cortó): seguramente en el chat de Nadielys o en el suyo.
    - **Preguntar a Ernesto:** las dos ventas son con Nadielys, ¿la comisión se reparte? ¿Cómo? ¿O es toda de Ernesto? No tocar la comisión de Nadielys sin su respuesta.
