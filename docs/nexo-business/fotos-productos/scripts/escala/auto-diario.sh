#!/bin/bash
# «Bajo pedido» automático de Digital Store, una vez al día (13-oct-2026).
# Procesa lo «nuevo» de la bolsa con fotos-bolsa.mjs, aplica la regla de marca de Ernesto, verifica (2.ª opinión) y publica
# SOLO lo que pasa todo (auto-bolsa.mjs auto). Lo demás queda en auto/dudosos-AAAA-MM-DD/ para la hoja de Claude.
# Topes: 1 USD de OpenAI al día (AUTO_TOPE_DIA) y 100 publicados al día (AUTO_MAX_DIA).
# APAGAR: touch /root/archivos/fotos-bolsa/auto/APAGADO   (volver a encender: rm ese archivo)
# Aviso a Ernesto: solo si AVISO_DEST tiene su número (cv enviar). Sin AVISO_DEST no se manda nada.
set -u
B=/root/archivos/fotos-bolsa
S=/root/vivabot/scripts/fotos-bolsa
mkdir -p "$B/auto"
LOG="$B/auto/diario-$(date +%F).log"
exec >>"$LOG" 2>&1
echo "== $(date '+%F %T') inicio"
if [ -f "$B/auto/APAGADO" ]; then echo "apagado (existe $B/auto/APAGADO)"; exit 0; fi
if [ -f "$B/auto/.corriendo" ] && kill -0 "$(cat "$B/auto/.corriendo")" 2>/dev/null; then echo "ya está corriendo"; exit 0; fi
echo $$ > "$B/auto/.corriendo"; trap 'rm -f "$B/auto/.corriendo"' EXIT
export AUTO_TOPE_DIA="${AUTO_TOPE_DIA:-1}" AUTO_MAX_DIA="${AUTO_MAX_DIA:-100}"
CAT=$(ls -t /root/archivos/digital-store-catalogo-*.json 2>/dev/null | head -1)
[ -n "$CAT" ] && export FB_CATALOGO="$CAT"
cd /root/vivabot || exit 1
fb() { local P; P=$(node "$S/auto-bolsa.mjs" presupuesto); echo "-- fotos-bolsa $* (FB_BUDGET=$P)"; FB_BUDGET="$P" node "$S/fotos-bolsa.mjs" "$@" 2>&1 | grep -v '^error audit' | tail -2; }
ab() { echo "-- auto-bolsa $*"; node "$S/auto-bolsa.mjs" "$@" 2>&1 | tail -4; }
# 1) lo nuevo: fotos del proveedor → revisión → arreglo → textos → fila (sin publicar)
fb preparar; fb bajar; fb auditar; fb auditar --v2; fb normalizar; fb textos; fb subir; fb bloquear
# 2) regla de Ernesto (13-oct): los de marca y modelo sin foto buena, con las fotos de Kevin aunque lleven texto del fabricante
ab marca; ab verificar --marca; ab promover
fb textos; fb subir; ab etiquetar
# 3) decisión: publica lo que pasa todo (máx. 100) y deja los dudosos para Claude
ab auto --publicar --avisar
echo "== $(date '+%F %T') fin"
