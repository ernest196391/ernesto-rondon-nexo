# Cierre FINAL de octubre 2026 para Lennys (4-nov, reglas de Ernesto en D135).
# Base: la cuenta de Arbelio (el económico) sobre el Excel de Maryta + mitad de ELIO − IA − impuestos; bajo pedido aparte;
# página con la cuenta de Ernesto. Uso: python -I hacer_final.py <carpeta> → cierre-octubre-2026-final.html
import html, os, sys

D = sys.argv[1]
TASA = 875
r2 = lambda x: round(x + 0.0, 2)

# Tienda (Arbelio, foto del 4-nov + Excel «OCTUBRE 2026 REGISTRO DIARIO…»)
ventas = 18268.00            # 20.131 − 2.228 de ELIO + 365 de consignación
ganancia_excel = 3279.68     # hoja G sin ELIO + 64 de consignación
dep, ern = r2(ventas * 0.005), r2(ventas * 0.015)
fijos_devueltos = 183.91     # 952,61 cargados a los productos − 768,70 reales
fluct, repar = 283.51, 37.28
elio = 253.41                # mitad de la ganancia de ELIO (hoja CONJUNTO)
ia = 282.38
impuestos = r2(38353.45 / TASA)
tienda = r2(ganancia_excel - dep - ern + fijos_devueltos - fluct - repar + elio - ia - impuestos)
inversores = r2(tienda * 0.40)
cv_resto = r2(tienda - inversores)

# Bajo pedido (9 pedidos de la web + 1 venta fuera de la web del 11-oct; #3845 con el 15 % de la Clásica)
bp_pedidos = [
    ('3693', 'Lámpara de piso Art Decó', 'Nadielys', 45, 28, 5.20, 790, 1000, 500, 2500),
    ('3845', 'Patines talla M (Clásica)', 'Nadielys', 120.75, 84, 8.40, 795, 1200, 500, 2500),
    ('4201', 'Bolso laptop gris', 'Thalia', 40, 25, 9.00, 810, 1000, 500, 1500),
    ('4244', '2× paraguas', 'Dayisel', 28, 16.40, 4.64, 815, 1000, 1000, 1500),
    ('4253', 'Tablet 10.1', 'Nadielys', 140, 119, 8.40, 815, 1200, 500, 3000),
    ('4963', 'Bolso laptop negro', 'Maria Caridad', 35, 25, 4.00, 827, 1200, 500, 3000),
    ('4974', '2× lámpara Art Decó', 'Nadielys', 90, 64, 10.40, 830, 2500, 1000, 3000),
    ('5452', 'Árbol inflable 2,1 m', 'Lena', 170, 140, 18.00, 835, 1000, 500, 3000),
    ('5666', '2× paraguas', 'Maria Caridad', 28, 16.40, 4.64, 860, 1000, 1000, 3000),
    ('fuera', 'Split Parker (TRD 42 y 23, fuera de la web)', 'Harley', 380, 351, 10.00, 875, 0, 0, 0),
]
bp = {'ing': 0, 'prov': 0, 'gest': 0, 'msg': 0, 'dep': 0, 'tie': 0}
filas_bp = []
for n, prod, g, v, p, gu, t, mc, dc, tc in bp_pedidos:
    e_usd = v - p - gu - (mc + dc + tc) / t
    bp['ing'] += v; bp['prov'] += p; bp['gest'] += gu; bp['msg'] += mc / t; bp['dep'] += dc / t; bp['tie'] += tc / t
    filas_bp.append((n, prod, g, float(v), float(p), float(gu), r2(e_usd)))
bp = {k: r2(v) for k, v in bp.items()}
bp['margen'] = r2(bp['ing'] - bp['prov'])
bp['ern'] = r2(bp['margen'] - bp['gest'] - bp['msg'] - bp['dep'] - bp['tie'])

# Cuenta de Ernesto con Lennys: el split vendido fuera de la web ya lo cobraron Ernesto y la gestora (4-nov) → no entra.
split_ern = 19.00
ern_gana = r2(ern + bp['ern'] - split_ern)
debe = [('Olla de presión del pedido #4988 (la repone Ernesto)', 45.00), ('20.000 CUP por transferencia', r2(20000 / TASA)),
        ('8.000 CUP de recargas de Maryta', r2(8000 / TASA)), ('100 USD en efectivo', 100.00)]
ern_saldo = r2(ern_gana - sum(v for _, v in debe))

gestoras = [('Nadielys Martinez Aguilera', 44, 70, 2023, 437.05, 790), ('Daymee Aguilera Varona', 17, 23, 1014, 231.44, 603),
            ('Maria Caridad Dinza Real', 20, 38, 910, 256.02, 305), ('Neisy', 17, 30, 889, 212.43, 628),
            ('Katia Kia', 20, 29, 714, 194.73, 165), ('Daniela Moreno Sánchez', 16, 19, 591, 153.29, 568)]


def m(x, d=2):
    s = f"{abs(x):,.{d}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    return ('−' if x < 0 else '') + s


e = html.escape


def table(head, rows, nums, totals=()):
    h = ''.join(f'<th class="{"r" if i in nums else ""}">{e(x)}</th>' for i, x in enumerate(head))
    b = ''
    for r in rows:
        cells = ''.join(f'<td class="{"r" if i in nums else ""}{" neg" if i in nums and isinstance(c, float) and c < 0 else ""}">{e(m(c) if isinstance(c, float) else str(c))}</td>' for i, c in enumerate(r))
        b += f'<tr{" class=t" if r[0] in totals else ""}>{cells}</tr>'
    return f'<table><tr>{h}</tr>{b}</table>'


cuenta = [
    ('Ganancia de los productos (Excel de Maryta, sin ELIO)', ganancia_excel, 'Venta − costo − comisión − gastos fijos de cada producto'),
    ('Dependientas (0,5 %)', -dep, f'Sobre {m(ventas, 0)} USD'),
    ('Ernesto (1,5 %)', -ern, 'Sobre la misma base'),
    ('Gastos fijos cargados de más', fijos_devueltos, '952,61 cargados a los productos − 768,70 reales'),
    ('Fluctuación del cambio', -fluct, 'CUP cobrado a una tasa y valorado a 875'),
    ('Reparación de junio (1 de 12 meses)', -repar, ''),
    ('Mitad de la ganancia de ELIO', elio, 'Hoja CONJUNTO: su ganancia se reparte a la mitad'),
    ('IA y herramientas', -ia, 'Lo pagado del 4-oct al 1-nov'),
    ('Impuestos de octubre', -impuestos, f'38.353,45 CUP a {TASA}'),
    ('Ganancia de la tienda', tienda, ''),
    ('40 % para inversores', -inversores, ''),
    ('Queda para Casa Viva', cv_resto, ''),
]
cbp = [('Ingresos', bp['ing'], '9 pedidos de la web + el split vendido fuera de la web (#3845 con el 15 % de la Clásica)'),
       ('Pagado a proveedores', -bp['prov'], ''), ('Margen', bp['margen'], ''),
       ('Gestoras', -bp['gest'], 'Pagadas, menos el #5452 (Lena, 18 USD); la del split la cobró Harley aparte'), ('Mensajeros', -bp['msg'], '11.100 CUP · ya cobraron'),
       ('Dependientas', -bp['dep'], '6.000 CUP: 3.000 para Nana y 3.000 para Zaymi'),
       ('Tienda Casa Viva', -bp['tie'], '23.000 CUP; ya está dentro de la tienda'), ('Ernesto (gestor especial)', bp['ern'], 'De ellos, 19 USD del split ya los cobró él')]

CSS = """@page{size:A4;margin:16mm 14mm}:root{--ink:#1d2321;--mut:#5d6b66;--line:#d9e1dd;--ok:#1f7a4d;--bad:#b3362c;--pan:#f4f7f5}
body{font-family:"Segoe UI",Arial,sans-serif;color:var(--ink);font-size:10pt;margin:0}section{page-break-after:always}section:last-child{page-break-after:auto}
.eye{text-transform:uppercase;letter-spacing:.08em;color:var(--mut);font-size:8pt;margin:0 0 4pt}h1{font-family:Georgia,serif;font-weight:400;font-size:24pt;margin:0 0 6pt}
h2{font-family:Georgia,serif;font-weight:400;font-size:16pt;margin:12pt 0 6pt}p{line-height:1.5;margin:0 0 8pt}.three{display:flex;gap:8pt;margin:10pt 0}
.big{flex:1;background:var(--pan);border:1px solid var(--line);border-radius:6pt;padding:10pt}.big .k{color:var(--mut);font-size:8.5pt}.big .v{font-family:Georgia,serif;font-size:22pt;margin:4pt 0}
.big .n{color:var(--mut);font-size:8pt}.big.ok{border-color:var(--ok)}.big.ok .v{color:var(--ok)}.big.bad .v{color:var(--bad)}
table{width:100%;border-collapse:collapse;margin:4pt 0 10pt;font-size:9pt}th,td{text-align:left;padding:3.5pt 5pt;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--mut);font-weight:600;font-size:8pt}.r{text-align:right;white-space:nowrap}tr.t td{font-weight:700}td.neg{color:var(--bad)}.foot{color:var(--mut);font-size:8pt}ul{line-height:1.6;margin-top:0}"""

doc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Cierre final de octubre · Casa Viva</title><style>{CSS}</style></head><body>
<section><p class="eye">Casa Viva · cierre final · octubre de 2026</p><h1>Cierre final de octubre</h1>
<p>Hecho sobre la cuenta de Arbelio y el Excel de Maryta, con las reglas de Ernesto del 4-nov: la mitad de ELIO es de Casa Viva, la IA sale de la ganancia de la tienda y bajo pedido va aparte.</p>
<div class="three"><div class="big"><div class="k">Vendió la tienda</div><div class="v">{m(ventas, 0)}</div><div class="n">USD · sin ELIO</div></div>
<div class="big ok"><div class="k">Ganancia de la tienda</div><div class="v">{m(tienda, 0)}</div><div class="n">USD · {m(tienda / ventas * 100, 1)} % de lo vendido</div></div>
<div class="big ok"><div class="k">Queda para Casa Viva</div><div class="v">{m(cv_resto, 0)}</div><div class="n">USD · después del 40 % a inversores</div></div></div>
<h2>La cuenta de la tienda</h2>{table(['Partida', 'USD', 'De dónde sale'], cuenta, {1}, ('Ganancia de la tienda', 'Queda para Casa Viva'))}</section>
<section><p class="eye">Bajo pedido, aparte</p><h2>Productos de proveedores</h2>
{table(['Partida', 'USD', 'Nota'], cbp, {1}, ('Margen', 'Ernesto (gestor especial)'))}
{table(['Pedido', 'Producto', 'Gestora', 'Venta', 'Proveedor', 'Gestora USD', 'Ernesto USD'], filas_bp, {3, 4, 5, 6})}
<h2>Pagos que faltan</h2><ul><li>Nana: 3.000 CUP y Zaymi: 3.000 CUP, de los pedidos de bajo pedido de octubre.</li><li>Lena: 18 USD de comisión del pedido #5452.</li>
<li>Desde noviembre: la tienda se queda 2.500 CUP de cada pedido de bajo pedido y la dependienta que lo recibe, 500 CUP por artículo (hay que apuntar quién lo recibió).</li></ul></section>
<section><p class="eye">Cuentas de personas</p><h2>Cuenta de Ernesto con Lennys</h2>
{table(['Concepto', 'USD'], [('1,5 % de la tienda', ern), ('Gestor especial de bajo pedido (pedidos de la web)', r2(bp['ern'] - split_ern)), ('Le toca a Ernesto', ern_gana)] + [(k, -v) for k, v in debe] + [('Saldo a favor de Ernesto', ern_saldo)], {1}, ('Le toca a Ernesto', 'Saldo a favor de Ernesto'))}
<p class="foot">El split vendido fuera de la web (19 USD) no entra: Ernesto y la gestora ya lo cobraron. Lennys se queda con lo que le toca a Ernesto y lo resta de lo que él debe. Lo de Adonys va aparte: Lennys le presta 140 USD y él los devuelve en USD.</p>
<h2>Mejor gestora de octubre</h2>
{table(['Gestora', 'Pedidos web', 'Unidades web', 'Vendido web', 'Ganancia que dejó', 'BizneCubano 1–11 oct'], [(a, b, c, float(d), f, float(g)) for a, b, c, d, f, g in gestoras], {1, 2, 3, 4, 5})}
<p><b>Nadielys Martinez Aguilera</b> gana en todo: más dinero, más pedidos, más productos y más ganancia para Casa Viva (2.813 USD sumando BizneCubano).</p>
<p class="foot">Web: pedidos completados creados del 11 al 31 de octubre. BizneCubano: lo entregado del 1 al 11 (solo importe). Hecho el 4-nov-2026.</p></section></body></html>"""
open(os.path.join(D, 'cierre-octubre-2026-final.html'), 'w', encoding='utf-8').write(doc)
print('tienda', tienda, 'inversores', inversores, 'CV', cv_resto, 'bp', bp, 'ernesto', ern_gana, ern_saldo)
