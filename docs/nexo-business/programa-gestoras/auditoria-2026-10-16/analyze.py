# Métricas de la tienda por escenario + simulación del «binario sano». Lee escenarios.json, main.json y nuevo.json.
import json, os, csv
HERE = os.path.dirname(os.path.abspath(__file__))
sc = {s['id']: s for s in json.load(open(os.path.join(HERE, 'escenarios.json'), encoding='utf-8'))}
main = {r['id']: r for r in json.load(open(os.path.join(HERE, 'main.json')))}
new = {r['id']: r for r in json.load(open(os.path.join(HERE, 'nuevo.json')))}
RATE = 800
FIXED_PCT_COST = 0.0787   # gastos fijos por producto (D74): 176,10 USD sobre 2.236,90 de costo en octubre
STAFF_PCT = 0.02          # dependienta 0,5 % + Nati 1,5 % (D76)

def real_money(real, returned=()):
    v = c = k = 0.0
    for o, lines in real.items():
        if int(o) in returned: continue
        for l in lines: v += l['base']; c += l['cost'] + l['other']; k += l['com']; fx[0] += 0 if l.get('bp') else l['cost']
    return v, c, k

rows = []
fx = [0.0]
for sid, s in sc.items():
    for ver, res in (('actual', main[sid]), ('arreglado', new[sid])):
        t = res['m1']['totals']
        fx[0] = 0.0; v, c, k = real_money(s['real'])
        paid = t['pay_usd']; red = t['red_usd']; bon = t['bonus_usd']
        if s.get('month2'):
            ret = set(s['month2']['returned'])
            fx[0] = 0.0; v1, c1, k1 = real_money(s['real'], ret)
            v2, c2, k2 = real_money(s['month2']['real'])
            v, c, k = v1 + v2, c1 + c2, k1 + k2
            t2 = res['m2']['totals']; paid += t2['pay_usd']; red += t2['red_usd']; bon += t2['bonus_usd']
        gross = v - c - k                       # ganancia real: precio − costo real − comisión (− fondo de proveedor)
        fixed = FIXED_PCT_COST * fx[0] + STAFF_PCT * v  # bajo pedido sin gastos fijos (D59)
        rows.append({
            'escenario': sid, 'calculo': ver, 'titulo': s['title'],
            'ventas_usd': round(v, 2), 'ganancia_real_usd': round(gross, 2), 'puntos': t['profit_usd'] + (res.get('m2', {}).get('totals', {}).get('profit_usd', 0) if s.get('month2') else 0),
            'fondo_usd': t['pool_usd'] + (res['m2']['totals']['pool_usd'] if s.get('month2') else 0),
            'red_usd': round(red, 2), 'bonos_usd': round(bon, 2), 'paga_programa_usd': round(paid, 2),
            'pct_de_ganancia_real': round(100 * paid / gross, 1) if gross > 0 else None,
            'cobertura_bonos_pct': round(100 * t['factor_bonus']),
            'con_piedra': t['people_with_stone'],
            'queda_tienda_usd': round(gross - paid, 2),
            'queda_limpio_tras_gastos_fijos_usd': round(gross - fixed - paid, 2),
            'paga_mas_de_lo_que_gana': paid > gross + 0.01,
            'paga_mas_del_15pct_real': paid > 0.15 * max(gross, 0) + 0.05,
        })

with open(os.path.join(HERE, 'escenarios-resultado.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
for r in rows:
    print(r['escenario'], r['calculo'], 'V', r['ventas_usd'], 'G', r['ganancia_real_usd'], 'pts', round(r['puntos'], 1), 'paga', r['paga_programa_usd'], '(red', r['red_usd'], 'bon', r['bonos_usd'], ')', r['pct_de_ganancia_real'], '% cov', r['cobertura_bonos_pct'], 'queda', r['queda_tienda_usd'], 'limpio', r['queda_limpio_tras_gastos_fijos_usd'], 'PIERDE' if r['paga_mas_de_lo_que_gana'] else '', '>15%' if r['paga_mas_del_15pct_real'] else '')

# ------------------- Binario sano -------------------
def binary(sid, pct=0.10, cap_usd=60.0, fund_pct=0.15, classic=False, on_sales=False):
    s = sc[sid]; res = main[sid]['m1']
    people = {int(k): v for k, v in res['people'].items()}
    mem = {int(k): v for k, v in s['members'].items()}
    own = {i: people.get(i, {}).get('sales' if on_sales else 'own', 0.0) for i in mem}
    orders = {i: people.get(i, {}).get('orders', 0) for i in mem}
    # Colocación: la madrina pone a su 1.ª invitada a la izquierda, la 2.ª a la derecha; las demás «se derraman»
    # al primer hueco libre (por niveles) de la pata con menos gente.
    left, right = {}, {}
    def size(n): return 0 if n is None else 1 + size(left.get(n)) + size(right.get(n))
    def first_free(root):
        q = [root]
        while q:
            n = q.pop(0)
            if left.get(n) is None: return n, 'L'
            if right.get(n) is None: return n, 'R'
            q += [left[n], right[n]]
    for i in sorted(mem):
        sp = mem[i]['inviter']
        if not sp or sp not in mem: continue
        if left.get(sp) is None: left[sp] = i
        elif right.get(sp) is None: right[sp] = i
        else:
            leg = left[sp] if size(left[sp]) <= size(right[sp]) else right[sp]
            n, side = first_free(leg)
            (left if side == 'L' else right)[n] = i
    def vol(n): return 0.0 if n is None else own[n] + vol(left.get(n)) + vol(right.get(n))
    raw = {}
    for i in mem:
        L, R = vol(left.get(i)), vol(right.get(i))
        if not classic and orders[i] < 1: continue
        b = pct * min(L, R)
        if not classic: b = min(b, cap_usd)
        if b > 0: raw[i] = b
    total_points = sum(own.values())
    demand = sum(raw.values())
    if classic:
        profit = sum(p['own'] for p in people.values())
        return {'demanda_usd': round(demand, 2), 'pct_de_ganancia': round(100 * demand / profit, 1) if profit else 0}
    pool = fund_pct * total_points
    f = min(1.0, pool / demand) if demand else 1.0
    paid_bin = {i: b * f for i, b in raw.items()}
    left_pool = pool - sum(paid_bin.values())
    bon_demand = sum(p['bonus_full_cup'] / RATE for p in people.values())
    fb = min(1.0, left_pool / bon_demand) if bon_demand else 1.0
    top = max(paid_bin.values()) if paid_bin else 0
    return {'binario_usd': round(sum(paid_bin.values()), 2), 'demanda_binario_usd': round(demand, 2), 'factor_binario': round(f, 3),
            'bonos_usd': round(bon_demand * fb, 2), 'cobertura_bonos_pct': round(100 * fb), 'total_usd': round(sum(paid_bin.values()) + bon_demand * fb, 2),
            'cobran_binario': len(paid_bin), 'la_que_mas_cobra_usd': round(top, 2), 'fondo_usd': round(pool, 2)}

def current_summary(sid):
    res = main[sid]['m1']; people = res['people']
    reds = [p['red'] for p in people.values() if p['red'] > 0]
    return {'red_usd': res['totals']['red_usd'], 'bonos_usd': res['totals']['bonus_usd'], 'cobertura_bonos_pct': round(100 * res['totals']['factor_bonus']),
            'total_usd': res['totals']['pay_usd'], 'cobran_red': len(reds), 'la_que_mas_cobra_red_usd': max(reds) if reds else 0, 'fondo_usd': res['totals']['pool_usd']}

comp = []
for sid in ('R1', 'R2', 'R3', 'S2', 'S4', 'S9', 'S11'):
    a = current_summary(sid); bsano = binary(sid); bcl = binary(sid, classic=True); bvol = binary(sid, classic=True, on_sales=True)
    comp.append({'escenario': sid, 'actual': a, 'binario_sano_10pct_tope60': bsano, 'binario_clasico_10pct_sin_tope': bcl, 'binario_clasico_10pct_de_ventas': bvol})
    print(sid, 'ACTUAL', a); print('   SANO', bsano); print('   CLASICO', bcl, 'sobre ventas', bvol)
json.dump(comp, open(os.path.join(HERE, 'binario-comparacion.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
