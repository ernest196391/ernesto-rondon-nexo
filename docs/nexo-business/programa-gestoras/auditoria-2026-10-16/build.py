# Construye los escenarios del multinivel (datos reales de octubre + simulados). Sin datos personales.
import json, random, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
oct_ = json.load(open(os.path.join(HERE, '..', 'oct.json'), encoding='utf-8'))
random.seed(1016)
P = '2026-11'
AT = P + '-10 12:00:00'
JOIN = '2026-10-01 10:00:00'
RATE = 800

def member(name, inviter=0, joined=JOIN):
    return {'name': name, 'inviter': inviter, 'joined': joined, 'approved': True, 'title': ''}

class B:
    def __init__(s): s.order = 1000; s.sales = []; s.real = {}
    def sale(s, owner, lines, buyer=None, at=AT):
        s.order += 1
        L = []
        for (base, cost, com, qty, other, real_cost, bp) in lines:
            L.append({'product_id': 1, 'name': 'p', 'qty': qty, 'base': base, 'cost_unit': cost, 'commission': com, 'other': other, 'bajo_pedido': bp})
            s.real.setdefault(s.order, []).append({'base': base, 'cost': (real_cost if real_cost is not None else (cost or 0)) * qty, 'com': com, 'other': other, 'bp': bp})
        x = {'order_id': s.order, 'owner': owner, 'at': at, 'status': 'approved', 'self_order': False, 'test': False, 'lines': L}
        if buyer: x['buyer_names'] = buyer
        s.sales.append(x); return s.order
    def normal(s, owner, usd, margin=0.20, com=0.10, at=AT):
        """Ventas típicas de octubre: costo 70 %, comisión 10 %, ganancia 20 % del precio. Pedidos de ~35 USD."""
        ids = []; left = usd
        while left > 0.5:
            b = min(left, random.choice([15, 22, 28, 35, 42, 48, 60]))
            if left - b < 7: b = left
            c = round(b * (1 - margin - com), 2)
            ids.append(s.sale(owner, [(round(b, 2), c, round(b * com, 2), 1, 0, None, False)], at=at)); left -= b
        return ids

def team(members, leader_id, leader_name, l1, l2_each, start):
    """Equipo: líder + l1 invitadas + l2_each invitadas por cada invitada. Devuelve ids."""
    members[leader_id] = member(leader_name)
    ids = {'leader': leader_id, 'l1': [], 'l2': []}; n = start
    for i in range(l1):
        members[n] = member(f'{leader_name}-inv{i+1}', leader_id); ids['l1'].append(n); a = n; n += 1
        for j in range(l2_each):
            members[n] = member(f'{leader_name}-inv{i+1}-{j+1}', a); ids['l2'].append(n); n += 1
    return ids, n

sc = []
def add(id_, title, members, b, month2=None, note=''):
    sc.append({'id': id_, 'title': title, 'note': note, 'period': P, 'members': members, 'sales': b.sales, 'real': b.real, 'month2': month2})

# ---------- R1: octubre real 1–16 (tal cual) ----------
alias = {k: i + 1 for i, k in enumerate(oct_['members'].keys())}
def real_members(inv_override=None):
    m = {}
    for k, v in oct_['members'].items():
        inv = alias.get(v['inviter'], 0) if v['inviter'] else 0
        if inv_override is not None: inv = inv_override.get(k, 0)
        m[alias[k]] = {'name': k, 'inviter': inv, 'joined': '2026-09-01 00:00:00', 'approved': v['approved'] and not v['test'], 'title': ''}
    return m
def real_sales(b, period='2026-10', dup=1):
    for d in range(dup):
        for s in oct_['sales']:
            if s['status'] not in ('approved', 'paid') or s['test'] or s['self']: continue
            lines = [(l['base'], l['cost'], l['com'], l['q'], l['other'], None, l['bp']) for l in s['lines']]
            at = s['at'] if d == 0 else s['at'][:8] + '%02d' % min(31, int(s['at'][8:10]) + 15) + s['at'][10:]
            b.sale(alias[s['owner']], lines, at=at)
b = B(); real_sales(b)
sc.append({'id': 'R1', 'title': 'Octubre real (1–16), tal cual', 'period': '2026-10', 'members': real_members(), 'sales': b.sales, 'real': b.real, 'month2': None, 'note': 'Ventas de gestoras entregadas y cobradas. Solo 2 gestoras tienen madrina y no vendieron: red 0.'})

# ---------- R2: mismas ventas reales, con equipos simulados ----------
# Las 27 que vendieron, en 3 equipos de 3 niveles (como si se hubieran invitado entre ellas).
tree = {  # invitada: madrina (alias de oct.json)
 'G9': 'G43', 'G39': 'G43', 'G46': 'G43',
 'G13': 'G9', 'G15': 'G9', 'G54': 'G39', 'G55': 'G39', 'G23': 'G46', 'G61': 'G46',
 'G19': 'G13', 'G20': 'G13', 'G69': 'G15', 'G35': 'G54',
 'G70': 'G2', 'G8': 'G2', 'G12': 'G70', 'G53': 'G70', 'G50': 'G8', 'G57': 'G8',
 'G17': 'G25', 'G30': 'G25', 'G52': 'G17', 'G68': 'G30', 'G71': 'G17',
}
inv = {k: alias[v] for k, v in tree.items()}
b = B(); real_sales(b)
sc.append({'id': 'R2', 'title': 'Octubre real (1–16) con equipos simulados', 'period': '2026-10', 'members': real_members(inv), 'sales': b.sales, 'real': b.real, 'month2': None, 'note': 'Mismas 73 ventas reales; las 27 vendedoras puestas en 3 equipos inventados (hasta 4 niveles).'})
b = B(); real_sales(b, dup=2)
sc.append({'id': 'R3', 'title': 'Octubre completo estimado (×2) con equipos simulados', 'period': '2026-10', 'members': real_members(inv), 'sales': b.sales, 'real': b.real, 'month2': None, 'note': 'Las ventas del 1 al 16 repetidas en la segunda quincena.'})

# ---------- S1: mes flojo ----------
m = {}; b = B()
t1, n = team(m, 1, 'A', 2, 1, 2); t2, n = team(m, n, 'B', 2, 0, n + 1)
for i, uid in enumerate(sorted(m)): b.normal(uid, [180, 150, 90, 60, 220, 110, 140, 70, 120, 90, 160, 110][i % 12])
add('S1', 'Mes flojo (≈1.000 USD, 2 equipos pequeños)', m, b)

# ---------- S2: mes muy bueno ----------
m = {}; b = B(); n = 1
for t in range(8):
    ids, n2 = team(m, n, 'L%d' % (t + 1), 3, 2, n + 1); n = n2
for uid in sorted(m):
    b.normal(uid, random.choice([150, 220, 300, 380, 450, 520, 650, 800]))
add('S2', 'Mes muy bueno (8 equipos de 10, ≈30.000 USD)', m, b)

# ---------- S3: gestora estrella ----------
m = {1: member('Estrella')}; b = B(); b.normal(1, 4000)
for i in range(2, 12): m[i] = member('O%d' % i); b.normal(i, 100)
add('S3', 'Gestora estrella (vende 4.000 USD sola)', m, b)

# ---------- S4: red grande que vende poco ----------
m = {1: member('Madrina')}; b = B(); b.normal(1, 60)
for i in range(2, 42): m[i] = member('I%d' % i, 1); b.normal(i, 35)
add('S4', 'Red grande que vende poco (40 invitadas × 35 USD)', m, b)

# ---------- S5a: devoluciones después de pagar, mes siguiente normal ----------
m = {}; b = B(); n = 1
for t in range(3):
    ids, n2 = team(m, n, 'D%d' % (t + 1), 3, 1, n + 1); n = n2
for uid in sorted(m): b.normal(uid, random.choice([250, 300, 400, 500]))
ret = [s['order_id'] for s in b.sales][::5]  # 1 de cada 5 pedidos se devuelve el mes siguiente
b2 = B(); b2.order = 5000
for uid in sorted(m): b2.normal(uid, random.choice([250, 300, 400, 500]), at='2026-12-10 12:00:00')
add('S5a', 'Devoluciones después de pagar: 20 % de los pedidos vuelven y el mes siguiente es normal', m, b,
    month2={'period': '2026-12', 'returned': ret, 'sales': b2.sales, 'real': b2.real})

# ---------- S5b: devolución grande y mes siguiente casi vacío ----------
m = {}; b = B(); ids, n = team(m, 1, 'E', 3, 1, 2)
for uid in sorted(m): b.normal(uid, 400)
ret = [s['order_id'] for s in b.sales if s['owner'] in (1, ids['l1'][0], ids['l1'][1])]
b2 = B(); b2.order = 5000; b2.normal(ids['l1'][2], 60, at='2026-12-10 12:00:00')
add('S5b', 'Devolución grande (3 de 7 gestoras, todo devuelto) y el mes siguiente casi no se vende', m, b,
    month2={'period': '2026-12', 'returned': ret, 'sales': b2.sales, 'real': b2.real})

# ---------- S5c: todo el mes devuelto y el siguiente vacío (caso extremo) ----------
m = {}; b = B(); ids, n = team(m, 1, 'F', 3, 1, 2)
for uid in sorted(m): b.normal(uid, 400)
ret = [s['order_id'] for s in b.sales]
b2 = B(); b2.order = 5000
b3 = B(); b3.order = 7000
for uid in sorted(m): b3.normal(uid, 400, at='2027-01-10 12:00:00')
add('S5c', 'Caso extremo: TODO el mes se devuelve después de pagar, el siguiente no se vende nada y el tercero es normal', m, b,
    month2={'period': '2026-12', 'returned': ret, 'sales': b2.sales, 'real': b2.real, 'month3': {'period': '2027-01', 'sales': b3.sales, 'real': b3.real}})

# ---------- S6: productos de proveedor con poco margen ----------
m = {}; b = B(); n = 1
for t in range(3):
    ids, n2 = team(m, n, 'P%d' % (t + 1), 2, 2, n + 1); n = n2
fund = round(3000 / RATE, 4)
for uid in sorted(m):
    for k in range(random.choice([2, 3, 4, 5])):
        b.sale(uid, [(45, 32, 5.2, 1, fund, None, True)])  # lámpara MK- real: 45 − 32 − 5,20 − 3,75 = 4,05
add('S6', 'Solo productos de proveedor (bajo pedido) con poco margen', m, b)

# ---------- S7: liquidaciones que pierden ----------
m = {}; b = B(); n = 1
for t in range(2):
    ids, n2 = team(m, n, 'Q%d' % (t + 1), 3, 1, n + 1); n = n2
for uid in sorted(m):
    b.normal(uid, 300)
    for k in range(4):  # cada una vende 4 de liquidación a 30 que costaron 36 (pierden 6 + comisión 3)
        b.sale(uid, [(30, 36, 3, 1, 0, None, False)])
add('S7', 'Liquidaciones que se venden perdiendo (35 % de las líneas)', m, b)

# ---------- S8a: costos provisionales demasiado bajos ----------
m = {}; b = B(); n = 1
for t in range(2):
    ids, n2 = team(m, n, 'C%d' % (t + 1), 3, 1, n + 1); n = n2
for uid in sorted(m):
    left = 400
    while left > 0:
        p = random.choice([20, 30, 45])
        if random.random() < 0.5:  # costo «fórmula» = precio ÷ 1,5, pero el real es el 82 % del precio
            b.sale(uid, [(p, round(p / 1.5, 2), p * 0.1, 1, 0, round(p * 0.82, 2), False)])
        else:
            b.sale(uid, [(p, round(p * 0.7, 2), p * 0.1, 1, 0, None, False)])
        left -= p
add('S8a', 'Costos provisionales demasiado bajos (la mitad de las líneas: real 82 %, cargado 67 %)', m, b)

# ---------- S8b: costo mal tecleado en un producto que se vende mucho ----------
m = {}; b = B(); ids, n = team(m, 1, 'T', 4, 1, 2)
for uid in sorted(m):
    for k in range(5): b.sale(uid, [(32, 3.2, 3, 1, 0, 22, False)])  # costo 22 tecleado como 3,20
add('S8b', 'Costo mal tecleado (3,20 en vez de 22) en un producto que vende todo el equipo', m, b)
m = {}; b = B(); ids, n = team(m, 1, 'T', 4, 1, 2)
for uid in sorted(m):
    for k in range(5): b.sale(uid, [(32, 3.2, 3, 1, 0, 28, False)])  # costo real 28 (casi sin margen) tecleado como 3,20
add('S8c', 'Costo mal tecleado (3,20 en vez de 28) en un producto casi sin margen', m, b)

# ---------- S9: muchas en la misma piedra (cadena de 6) ----------
m = {1: member('N1')}; b = B()
for i in range(2, 7): m[i] = member('N%d' % i, i - 1)
for i in range(1, 7): b.normal(i, 400)
add('S9', 'Muchas en la misma piedra: cadena de 6 que venden 400 USD cada una', m, b)

# ---------- S10: cuenta falsa de madrina ----------
m = {1: member('Honrada')}; b = B(); b.normal(1, 650)
add('S10a', 'Honrada: vende 650 USD sola', m, b)
m = {1: member('Lista'), 2: member('Cuenta falsa', 1)}; b = B(); b.normal(1, 325); b.normal(2, 325)
add('S10b', 'Tramposa: las mismas 650 USD repartidas con una «invitada» falsa', m, b)
m = {1: member('Marta López'), 2: member('Ana Pérez', 1)}; b = B(); b.normal(1, 60)
for k in range(6): b.sale(2, [(50, 35, 5, 1, 0, None, False)], buyer=['Marta López', ''])
add('S10c', 'La madrina compra 300 USD para ella a través de su invitada', m, b)

# ---------- S11: red grande y profunda (árbol de 7 niveles, cada una invita a 2) ----------
m = {}; b = B()
for i in range(1, 128):
    m[i] = member('H%d' % i, i // 2 if i > 1 else 0); b.normal(i, 100)
add('S11', 'Red grande y profunda: 127 gestoras, cada una invita a 2, todas venden 100 USD', m, b)

# ---------- Ejemplo de PLAN-DESPLIEGUE: María invita a Ana ----------
for sid, (mu, au) in (('MA', (300, 400)), ('MA2', (600, 800))):
    m = {1: member('María'), 2: member('Ana', 1)}; b = B()
    b.sale(1, [(mu, round(mu * 0.7, 2), mu * 0.1, 1, 0, None, False)]); b.sale(2, [(au, round(au * 0.7, 2), au * 0.1, 1, 0, None, False)])
    add(sid, f'Ejemplo: María vende {mu} y su invitada Ana {au}', m, b)

json.dump(sc, open(os.path.join(HERE, 'escenarios.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(sc), 'escenarios')
