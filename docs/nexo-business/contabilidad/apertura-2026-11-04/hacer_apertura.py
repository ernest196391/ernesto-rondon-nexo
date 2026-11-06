# Apertura contable de Casa Viva (4-nov-2026, D135): foto del día 1 del sistema.
# Uso: python -I hacer_apertura.py <carpeta> → apertura-2026-11-04.html (luego Chrome --print-to-pdf).
# Datos leídos el 4-nov de la web casaviva.company (inventario, comisiones, pedidos abiertos) y del panel («A pagar»).
import csv, html, os, sys

D = sys.argv[1]
rows = list(csv.reader(open(os.path.join(D, 'inventario-2026-11-04.csv'), encoding='utf-8-sig'), delimiter=';'))[1:]
num = lambda x: float(x.replace(',', '.')) if x else None
inv = [(r[1], int(r[2]), num(r[3]), num(r[4])) for r in rows]
inv_costo = sum(q * c for _, q, c, _ in inv if c is not None)
inv_precio = sum(q * p for _, q, _, p in inv if p is not None)
unidades = sum(q for _, q, _, _ in inv)
sin_costo = [v for v in inv if v[2] is None]
top = sorted([v for v in inv if v[2] is not None], key=lambda v: -v[1] * v[2])[:12]

# Deudas y pendientes (4-nov 03:00): comisiones de pedidos completados desde el 1-oct sin pagar; % de «A pagar».
comisiones = 580.00
pct_oct = {'Dependientas (0,5 %)': 63.49, 'Ernesto (1,5 %)': 190.46}
pct_nov = {'Dependientas (0,5 %)': 4.17, 'Ernesto (1,5 %)': 12.50}
abiertos = (19, 638.00)
mensajeros = (5, 178.00)
paypal = 125.00
debe = comisiones + sum(pct_oct.values()) + sum(pct_nov.values())

def m(x, d=2):
    s = f"{abs(x):,.{d}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    return ('−' if x < 0 else '') + s

e = html.escape
CSS = """@page{size:A4;margin:16mm 14mm}:root{--ink:#1d2321;--mut:#5d6b66;--line:#d9e1dd;--ok:#1f7a4d;--bad:#b3362c;--pan:#f4f7f5;--warn:#9a6b00}
body{font-family:"Segoe UI",Arial,sans-serif;color:var(--ink);font-size:10pt;margin:0}section{page-break-after:always}section:last-child{page-break-after:auto}
.eye{text-transform:uppercase;letter-spacing:.08em;color:var(--mut);font-size:8pt;margin:0 0 4pt}h1{font-family:Georgia,serif;font-weight:400;font-size:24pt;margin:0 0 6pt}
h2{font-family:Georgia,serif;font-weight:400;font-size:16pt;margin:12pt 0 6pt}p{line-height:1.5;margin:0 0 8pt}.grid{display:flex;flex-wrap:wrap;gap:8pt;margin:10pt 0}
.big{flex:1 1 45%;background:var(--pan);border:1px solid var(--line);border-radius:6pt;padding:10pt}.big .k{color:var(--mut);font-size:8.5pt}.big .v{font-family:Georgia,serif;font-size:22pt;margin:4pt 0}
.big .n{color:var(--mut);font-size:8pt}.big.ok{border-color:var(--ok)}.big.ok .v{color:var(--ok)}.big.bad .v{color:var(--bad)}.big.warn{border-style:dashed;border-color:var(--warn)}.big.warn .v{color:var(--warn)}
table{width:100%;border-collapse:collapse;margin:4pt 0 10pt;font-size:9pt}th,td{text-align:left;padding:3.5pt 5pt;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mut);font-weight:600;font-size:8pt}.r{text-align:right;white-space:nowrap}tr.t td{font-weight:700}.foot{color:var(--mut);font-size:8pt}ul,ol{line-height:1.6;margin-top:0}
.blank{display:inline-block;min-width:38mm;border-bottom:1px solid var(--ink);height:14pt}"""

def table(head, body, nums, totals=()):
    h = ''.join(f'<th class="{"r" if i in nums else ""}">{e(x)}</th>' for i, x in enumerate(head))
    b = ''.join(f'<tr{" class=t" if r[0] in totals else ""}>' + ''.join(f'<td class="{"r" if i in nums else ""}">{e(m(c) if isinstance(c, float) else str(c))}</td>' for i, c in enumerate(r)) + '</tr>' for r in body)
    return f'<table><tr>{h}</tr>{b}</table>'

doc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Apertura · Casa Viva · 4-nov-2026</title><style>{CSS}</style></head><body>
<section><p class="eye">Casa Viva · día 1 del sistema · 4 de noviembre de 2026</p><h1>Apertura</h1>
<p>La foto de cómo empieza Casa Viva hoy: lo que tiene, lo que debe y lo que está por cobrar. Desde aquí, todo lo cuenta el sistema (D135).</p>
<div class="grid">
<div class="big ok"><div class="k">Lo que tiene · mercancía a costo</div><div class="v">{m(inv_costo, 0)} USD</div><div class="n">{unidades} unidades de {len(inv)} productos · a precio de venta {m(inv_precio, 0)} USD</div></div>
<div class="big bad"><div class="k">Lo que debe · comisiones y porcentajes</div><div class="v">{m(debe, 0)} USD</div><div class="n">Gestoras {m(comisiones, 0)} · dependientas y Ernesto {m(debe - comisiones, 0)}, si no se pagaron</div></div>
<div class="big"><div class="k">Por cobrar · pedidos abiertos de la web</div><div class="v">{m(abiertos[1], 0)} USD</div><div class="n">{abiertos[0]} pedidos sin entregar o sin cobrar</div></div>
<div class="big"><div class="k">En camino · entregados, dinero sin verificar</div><div class="v">{m(mensajeros[1], 0)} USD</div><div class="n">{mensajeros[0]} pedidos: el dinero está con el mensajero o en la tienda sin revisar</div></div>
<div class="big"><div class="k">Saldo para la IA · PayPal</div><div class="v">{m(paypal, 0)} USD</div><div class="n">Dato de Ernesto</div></div>
<div class="big warn"><div class="k">Efectivo en la caja · falta contarlo</div><div class="v">USD <span class="blank"></span></div><div class="n">CUP <span class="blank"></span> · Lo cuenta la dependienta y lo apunta en el cierre de turno de hoy</div></div>
</div>
<h2>Lo que más vale del inventario</h2>
{table(['Producto', 'Unidades', 'Costo USD', 'Valor USD'], [(n[:70], q, c, q * c) for n, q, c, _ in top], {1, 2, 3})}
<p class="foot">Lista completa en inventario-2026-11-04.csv (291 productos, con costo y precio). Existencias y costos de la web, que se igualan con la caja cada 2 minutos. Incluye la mercancía de las socias (consignación): no toda es de Casa Viva. Sin bajo pedido (los proveedores la guardan).</p>
</section>
<section><p class="eye">Lo que se debe</p><h2>Comisiones de gestoras por pagar</h2>
<p>Pedidos completados desde el 1 de octubre con la comisión aprobada y sin pagar.</p>
{table(['Gestora', 'USD'], [('Daniela Moreno Sánchez', 69.2), ('Nadielys Martinez Aguilera', 52.0), ('Oliuska García Terry', 49.8), ('Caridad Domínguez García', 46.0), ('Lena Caridad Martínez Pita', 46.0), ('Arle', 38.0), ('Niurka González de Armas', 28.0), ('Dayra Expósito Cedeño', 25.0), ('Gabriela Tellez Sarmiento', 24.0), ('Neisy', 23.0), ('Otras 33 gestoras', 179.0), ('Total', comisiones)], {1}, ('Total',))}
<h2>Porcentajes de dependientas y Ernesto</h2>
{table(['Concepto', 'Octubre', 'Noviembre (hasta hoy)'], [(k, pct_oct[k], pct_nov[k]) for k in pct_oct], {1, 2})}
<p class="foot">Del cuadro «A pagar este mes» del panel. Si los de octubre ya se pagaron, táchalos.</p>
<h2>Para que la apertura quede completa</h2>
<ul>
<li>Contar el efectivo de la caja hoy (USD y CUP) y apuntarlo en el cierre de turno. Todavía no hay ningún cierre de turno guardado en la web.</li>
<li>Confirmar si el 0,5 % y el 1,5 % de octubre ya se pagaron.</li>
<li>Poner costo a 2 productos que no lo tienen: luces navideñas Feluz (4 u.) y zapatera de 5 niveles (1 u.).</li>
<li>Proveedores de bajo pedido: se pagan al recibir, así que no hay deuda. El registro de deudas con proveedores tiene un solo apunte viejo (#3693), que hay que cerrar.</li>
<li>En «A pagar» salen dos «Zaymi»: decir si son la misma persona.</li>
</ul>
<p class="foot">Hecho el 4-nov-2026 con datos de la web casaviva.company y del panel NEXO. Desde hoy: resumen diario a las 21:30, hoja «Cierre» en el panel y PDF del mes el día 1.</p>
</section></body></html>"""
open(os.path.join(D, 'apertura-2026-11-04.html'), 'w', encoding='utf-8').write(doc)
print('inventario', round(inv_costo, 2), round(inv_precio, 2), unidades, 'debe', round(debe, 2))
