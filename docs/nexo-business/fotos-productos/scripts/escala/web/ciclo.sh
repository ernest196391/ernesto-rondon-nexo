#!/bin/bash
# Una tanda de «fotos de internet»: buscar → bajar → revisar (IA) → arreglar → verificar (2.ª opinión) → hasta 2 vueltas más.
# No publica, no cambia status y no escribe en Supabase (eso lo hace después «subir», solo con los aprobados).
# Uso: bash ciclo.sh <ids separados por comas> <etiqueta> [--sin-buscar]
set -u
IDS="$1"; ETIQ="$2"; SIN_BUSCAR="${3:-}"
PW=/root/archivos/fotos-bolsa/piloto-web
FB=/root/archivos/fotos-bolsa
export PW_TOPE="${PW_TOPE:-15}"
cd "$PW"
presupuesto() { node "$PW/fb-budget.mjs"; }
fbs() { local B; B="$(presupuesto)"; (cd /root/vivabot && FB_BUDGET="$B" node scripts/fotos-bolsa/fotos-bolsa.mjs "$@" 2>&1 | grep -v '^error audit' | tail -3); }

# copia del estado de anoche y aparta las fotos de internet de la vuelta del 12-oct (si las había)
for i in ${IDS//,/ }; do
  [ -f "$FB/$i/norm-1012.json" ] || cp "$FB/$i/norm.json" "$FB/$i/norm-1012.json" 2>/dev/null
  if [ -d "$FB/$i/web" ] && [ ! -d "$FB/$i/web-1012" ] && [ ! -f "$FB/$i/busqueda-web.json" ]; then
    mv "$FB/$i/web" "$FB/$i/web-1012"; [ -f "$FB/$i/audit-web.json" ] && mv "$FB/$i/audit-web.json" "$FB/$i/audit-web-1012.json"
  fi
done

if [ "$SIN_BUSCAR" != "--sin-buscar" ]; then
  echo "== buscar ($ETIQ)"; node buscar.mjs --ids "$IDS" --modelo gpt-6-luna --max 10 | tail -2
  echo "== fuentes"; node fuentes.mjs --ids "$IDS" --salida "$PW/fuentes-$ETIQ.json" > /dev/null
  echo "== bajar"; (cd /root/vivabot && node scripts/fotos-bolsa/fotos-bolsa.mjs web-bajar "$PW/fuentes-$ETIQ.json" 2>&1 | tail -2)
fi
echo "== auditar --web"; fbs auditar --web --ids "$IDS" --conc 4
echo "== normalizar"; fbs normalizar --ids "$IDS" --otra
echo "== verificar"; node verificar.mjs --ids "$IDS" --modelo gpt-6-sol --marcar | tail -1
for vuelta in 1 2; do
  PEND=$(node resultado.mjs --ids "$IDS" --pendientes)
  [ -z "$PEND" ] && break
  echo "== otra vuelta $vuelta: $PEND"
  fbs auditar --web --ids "$PEND" --otra --conc 4
  fbs normalizar --ids "$PEND" --otra
  node verificar.mjs --ids "$PEND" --modelo gpt-6-sol --marcar | tail -1
done
echo "== resultado"; node resultado.mjs --ids "$IDS" --salida "$PW/resultado-$ETIQ.json" | head -1
node gasto.mjs | tr -d '\n '; echo
