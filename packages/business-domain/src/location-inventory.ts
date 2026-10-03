export type LocationKind = "warehouse" | "store" | "branch" | "transit" | "consignment" | "damaged";

export type InventoryMovement = {
  productId: string;
  /** Undefined for legacy movements; they belong to the default location. */
  locationId?: string;
  quantityDelta: number;
};

/** Stock per "location|product", derived from movements (never stored). */
export function stockByLocation(
  movements: readonly InventoryMovement[],
  defaultLocationId: string,
): Map<string, number> {
  const stock = new Map<string, number>();
  for (const m of movements) {
    if (!Number.isInteger(m.quantityDelta) || m.quantityDelta === 0) {
      throw new Error("Inventory movement quantity must be a non-zero integer");
    }
    const key = `${m.locationId ?? defaultLocationId}|${m.productId}`;
    stock.set(key, (stock.get(key) ?? 0) + m.quantityDelta);
  }
  return stock;
}

/** A transfer is a paired decrease/increase that never exceeds source stock. */
export function transferMovements(args: {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  availableAtSource: number;
}): [InventoryMovement, InventoryMovement] {
  const { productId, fromLocationId, toLocationId, quantity, availableAtSource } = args;
  if (fromLocationId === toLocationId) throw new Error("Transfer source and destination must differ");
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Transfer quantity must be positive");
  if (quantity > availableAtSource) throw new Error("Transfer exceeds source stock");
  return [
    { productId, locationId: fromLocationId, quantityDelta: -quantity },
    { productId, locationId: toLocationId, quantityDelta: quantity },
  ];
}

/** A physical count reconciles with one adjustment equal to the difference. */
export function countAdjustment(expected: number, counted: number): number {
  if (!Number.isInteger(counted) || counted < 0) throw new Error("Counted quantity must be a non-negative integer");
  return counted - expected;
}
