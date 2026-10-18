#!/bin/bash
# Resumen diario 20:00 (Hormozi desde el 18-oct): la de Ernesto y la de Lennys salen solas; las de los grupos
# (General = gestoras, Mensajerías = mensajeros) esperan el «SÍ N» de Ernesto (Ernesto 18-oct).
# 13-oct: si existe /root/archivos/resumenes/notas-AAAA-MM-DD.json (novedades, errores y arreglos escritos a mano), se añade.
D="$(date +%F)"; DIR="/root/archivos/resumenes/$D"; mkdir -p "$DIR"
NOTAS="/root/archivos/resumenes/notas-$D.json"
EXTRA=()
[ -s "$NOTAS" ] && EXTRA=(--notas "$NOTAS")
cd /root/vivabot || exit 1
/usr/bin/node scripts/resumen-diario.mjs --enviar=ernesto,lennys --ok "${EXTRA[@]}" --guardar-fuente "$DIR/fuente.json"; [ -s "$DIR/fuente.json" ] || exit 1  # 1 = algún envío falló; los grupos van igual
# Grupos: vista previa a «Tú» y pregunta del supervisor; al «SÍ N» se manda lo mismo con los datos guardados.
CMD="cd /root/vivabot && /usr/bin/node scripts/resumen-diario.mjs --datos $DIR/fuente.json --salida $DIR --enviar=equipo --ok ${EXTRA[*]}"
ID=$(node /root/supervisor/sb.mjs "const {data,error}=await db.from('crm_supervisor').insert({kind:'pregunta',status:'pendiente',body:'Resumen de hoy (estilo Hormozi) para los grupos General y Mensajerías: ¿lo mando? Vista previa arriba.',plan:'Al SÍ: ejecutar exactamente: $CMD — y luego apuntar el resultado. Al NO: no se manda. Si a las 21:45 no hay respuesta, no se manda.'}).select('id').single(); return error?error.message:data.id" | tr -dc '0-9')
for f in gestoras mensajeros; do
  [ -s "$DIR/resumen-$f.png" ] && cv enviar-archivo 5354056173 "$DIR/resumen-$f.png" "Vista previa · resumen para $f"
done
cv enviar 5354056173 "❓ *Pregunta ${ID}*: ¿Mando el resumen de hoy a los grupos General y Mensajerías (las dos tarjetas de arriba)? Responde *SÍ ${ID}* o *NO ${ID}*."
