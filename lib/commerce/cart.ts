export type CommercePhase =
  | "empty"
  | "idle"
  | "restoring"
  | "validating"
  | "ready"
  | "updating"
  | "submitting"
  | "error"
  | "success";

export type MoneyShape = {
  currency_code?: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

export type CartItem = {
  key: string;
  id: number;
  name: string;
  quantity: number;
  images: Array<{ src: string; alt: string }>;
  prices: MoneyShape & { price: string };
  totals: MoneyShape & { line_total: string };
  quantity_limits?: { minimum: number; maximum: number; multiple_of: number; editable?: boolean };
};

export type Cart = {
  items: CartItem[];
  items_count?: number;
  errors?: Array<{ code?: string; message?: string }>;
  payment_methods?: string[];
  totals: MoneyShape & { total_items: string; total_price: string; total_shipping?: string | null };
};

export function minorAmount(value: string, minorUnit: number) {
  return Number(value) / 10 ** minorUnit;
}

export function formatMoney(value: string, money: MoneyShape) {
  const amount = minorAmount(value, money.currency_minor_unit);
  const code = money.currency_code || (money.currency_symbol === "$" ? "USD" : money.currency_symbol);
  return `${amount.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${code}`;
}

export function itemCount(cart: Cart) {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

export function productCountLabel(count: number) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

export function optimisticQuantity(cart: Cart, key: string, quantity: number): Cart {
  const item = cart.items.find((entry) => entry.key === key);
  if (!item) return cart;
  const unit = Number(item.prices.price);
  const previousLine = Number(item.totals.line_total);
  const nextLine = unit * quantity;
  const delta = nextLine - previousLine;
  return {
    ...cart,
    items: cart.items.map((entry) => entry.key === key
      ? { ...entry, quantity, totals: { ...entry.totals, line_total: String(nextLine) } }
      : entry),
    totals: {
      ...cart.totals,
      total_items: String(Number(cart.totals.total_items) + delta),
      total_price: String(Number(cart.totals.total_price) + delta),
    },
  };
}

export function optimisticRemove(cart: Cart, key: string): Cart {
  const item = cart.items.find((entry) => entry.key === key);
  if (!item) return cart;
  const delta = Number(item.totals.line_total);
  return {
    ...cart,
    items: cart.items.filter((entry) => entry.key !== key),
    totals: {
      ...cart.totals,
      total_items: String(Math.max(0, Number(cart.totals.total_items) - delta)),
      total_price: String(Math.max(0, Number(cart.totals.total_price) - delta)),
    },
  };
}
