export function createCajaRecoveryHandler(options: {
  businessId: string;
  authorizeCurrentDevice: (token: string) => Promise<{ current: boolean; businessId: string; canReadOrders: boolean } | null>;
  readCoreOrders: () => Promise<unknown>;
}): (request: Request) => Promise<Response>;
