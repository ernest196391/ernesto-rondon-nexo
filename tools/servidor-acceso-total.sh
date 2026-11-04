#!/usr/bin/env bash
# Da al servidor (VPS del bot) acceso a GitHub (escritura) y a la caja (Supabase), para trabajar desde el móvil.
# Ernesto lo aprobó el 17-oct-2026. Se ejecuta desde el PC (Git Bash), con un clic. Se puede repetir sin romper nada.
set -e
VPS="ssh -i $HOME/.ssh/vivabot_vps root@179.236.242.212"

echo "1/4 · Llaves del servidor para GitHub (una por proyecto)…"
$VPS 'cd ~/.ssh && for r in vivabot casaviva nexo; do [ -f gh_${r}_rw ] || ssh-keygen -q -t ed25519 -N "" -C "vps-${r}-rw" -f gh_${r}_rw; done
grep -q "Host github-vivabot" config 2>/dev/null || cat >> config <<EOF

Host github-vivabot
  HostName github.com
  User git
  IdentityFile ~/.ssh/gh_vivabot_rw
  IdentitiesOnly yes
Host github-casaviva
  HostName github.com
  User git
  IdentityFile ~/.ssh/gh_casaviva_rw
  IdentitiesOnly yes
Host github-nexo
  HostName github.com
  User git
  IdentityFile ~/.ssh/gh_nexo_rw
  IdentitiesOnly yes
EOF'

echo "2/4 · Registrar las llaves en GitHub con permiso de escritura…"
for pair in vivabot:vivabot casaviva:Casa-Viva nexo:ernesto-rondon-nexo; do
  k=${pair%%:*}; repo=${pair#*:}
  $VPS "cat ~/.ssh/gh_${k}_rw.pub" > "/tmp/gh_${k}_rw.pub"
  gh repo deploy-key add "/tmp/gh_${k}_rw.pub" --repo "ernest196391/$repo" --allow-write --title "VPS servidor (escritura, 17-oct)" \
    || echo "   (la llave de $repo ya estaba registrada)"
done

echo "3/4 · Proyectos en el servidor (bot, web Core y documentos)…"
$VPS 'ssh -o StrictHostKeyChecking=accept-new -T git@github-vivabot 2>&1 | head -1
cd /root/vivabot && git remote set-url origin git@github-vivabot:ernest196391/vivabot.git && git fetch -q && echo "   bot: puede subir a GitHub"
[ -d /root/Casa-Viva ] || git clone -q git@github-casaviva:ernest196391/Casa-Viva.git /root/Casa-Viva
[ -d /root/ernesto-rondon-nexo ] || git clone -q git@github-nexo:ernest196391/ernesto-rondon-nexo.git /root/ernesto-rondon-nexo
for d in /root/Casa-Viva /root/ernesto-rondon-nexo; do git -C $d config user.name "Ernesto Rondon"; git -C $d config user.email "rondonernesto316@gmail.com"; done
git -C /root/vivabot config user.name "Ernesto Rondon"; git -C /root/vivabot config user.email "rondonernesto316@gmail.com"
echo "   web Core y documentos: copiados en /root/Casa-Viva y /root/ernesto-rondon-nexo"'

echo "4/4 · Acceso a la caja (Supabase)…"
$VPS 'cat > /root/supervisor/caja.mjs <<"EOF"
// Consultas a la CAJA (esquema nexo_business de Supabase) desde el servidor. 17-oct (Ernesto).
// Uso: node /root/supervisor/caja.mjs "select name, prices from nexo_business.catalog_products where name ilike '\''%banqueta%'\''"
// Token personal de Supabase en /root/supervisor/.supabase-token (chmod 600). Nunca lo muestres ni lo copies.
import { readFileSync } from "fs";
const sql = process.argv[2];
if (!sql) { console.error("Falta la consulta SQL"); process.exit(1); }
let token;
try { token = readFileSync("/root/supervisor/.supabase-token", "utf8").trim(); } catch { console.error("Falta /root/supervisor/.supabase-token"); process.exit(1); }
const res = await fetch("https://api.supabase.com/v1/projects/viwwlriwlwodrfukbgbj/database/query", {
  method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }),
});
const out = await res.text();
if (!res.ok) { console.error("ERROR", res.status, out.slice(0, 500)); process.exit(1); }
console.log(out);
EOF'
if $VPS 'test -s /root/supervisor/.supabase-token'; then
  echo "   el token ya estaba puesto"
else
  echo ""
  echo "   Abre https://supabase.com/dashboard/account/tokens → «Generate new token» (nombre: servidor-caja) → cópialo."
  read -r -s -p "   Pega aquí el token (no se ve al pegar) y pulsa Enter: " TOKEN; echo
  printf '%s' "$TOKEN" | $VPS 'umask 077; cat > /root/supervisor/.supabase-token'
  unset TOKEN
fi
$VPS 'node /root/supervisor/caja.mjs "select count(*) as productos_en_caja from nexo_business.catalog_products where business_id='\''casa-viva'\''"'

echo ""
echo "LISTO. El servidor ya puede subir código a GitHub y consultar y cambiar la caja."
