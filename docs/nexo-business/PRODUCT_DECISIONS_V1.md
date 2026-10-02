# NEXO Business — Product Decisions v1

**Date:** 2026-10-02  
**Status:** approved product direction from owner  
**Applies to:** reusable Cuban retail platform, Casa Viva, future pilots

## 1. Currency and payment rails
- Support must be multi-currency from the architecture level.
- Initial real-world currencies include CUP, USD and MLC.
- The model must be extensible to digital assets/crypto without redesigning the ledger.
- Transfers are a generic payment category at first; Transfermóvil/EnZona can later be represented as provider/channel metadata rather than separate accounting primitives.
- Physical cash and non-cash settlement are distinct. Transfers never increase drawer cash expected.

## 2. Gestora module
- Gestora functionality is optional per merchant.
- A gestora may work across multiple stores from one profile.
- A gestora may receive commissions configured:
  - by store;
  - by product;
  - by percentage;
  - by order where needed.
- A gestora may have an attributed personal storefront/URL with only approved products.
- Attribution, commissions and customer ownership/history must be auditable.

## 3. Messenger module
- A merchant may use its own messengers and optionally a future shared NEXO messenger network.
- One messenger can serve multiple stores from the same app/profile.
- Delivery pricing must support three configurable strategies:
  - fixed zone/municipality;
  - distance/km;
  - manual price.
- Admin chooses which strategy is active per merchant/branch/order context.
- Messenger workflow includes money pending to return, settlement and incidents.

## 4. Branches, locations and devices
- First commercial version may launch with one branch per merchant.
- Data model must support multiple branches from day one.
- Multiple simultaneous POS devices/cash shifts are allowed.
- A merchant may use Android only, Windows only, or both.
- Devices must sync later without duplicate sales/payments.

## 5. Inventory best practice
NEXO uses **location-based inventory**.

Recommended location types:
- warehouse;
- store;
- branch;
- transit/transfer;
- optional damaged/quarantine later.

Rules:
- stock is tracked per location;
- transfers are paired immutable movements: source decrease + destination increase;
- no silent stock overwrite;
- physical counts create reconciliation movements;
- each movement carries product, location, quantity, actor, source, reason and timestamp;
- an external system such as WooCommerce or Axis may temporarily remain authoritative for a configured location/channel.

This allows stock to move correctly between warehouse, store and future branches without creating unrelated inventories.

## 6. POS sale and employee attribution
A physical POS sale creates a real business transaction, not a disposable cash record.

It must:
- create sale/order identity;
- reduce inventory through movement(s);
- record device, branch and operator;
- optionally associate a customer;
- support commissions/incentives for the employee by product, order or percentage;
- remain visible to admin/reporting;
- sync idempotently.

Whether the POS sale appears in the same operational order center is a projection/UI choice; the underlying transaction must share common identity/event contracts.

## 7. Customer/CRM
NEXO must maintain a merchant customer database.

At minimum:
- name when available;
- phone(s);
- contact consent/preferences when implemented;
- orders/purchases;
- total/frequency/last purchase derived metrics;
- store/gestora attribution;
- notes with appropriate privacy controls.

POS may complete an anonymous sale for speed, but staff can attach/create a customer when useful.

The purpose is operational history and future retargeting/CRM. Marketing actions must respect applicable consent/privacy requirements.

## 8. Credit, partial payment and consignment
Businesses may sell:
- on credit/fiado;
- with partial payments;
- by consignment to wholesale warehouses/clients.

Therefore the accounting/operations design must include:
- receivables;
- balances due;
- due dates;
- partial payments;
- customer/account ledger;
- consignment stock ownership/location distinction;
- settlement/reconciliation.

Do not bolt this onto cash as free-text debt.

## 9. Returns and exchanges
POS/business core must eventually support:
- return;
- exchange;
- partial return;
- refund method;
- inventory restoration or damaged disposition;
- reason/actor/timestamp;
- reference to original sale.

No destructive edits to original sale.

## 10. Expenses and cash movements
Cash module must support structured daily expenses as well as generic cash in/out.

Examples:
- transport;
- messenger payment;
- supplier small expense;
- office/store expense;
- correction.

Each must have category, amount, currency, actor, reason/source and audit trail.

## 11. Owner and multi-business view
- Default management is per store/business.
- An owner may link multiple businesses and receive a consolidated portfolio view.
- Tenant isolation remains strict; portfolio aggregation is an authorized projection, not merged raw data.

## 12. Onboarding
Long-term target: self-service **Create your business** onboarding.

Initial commercial operation:
- guided setup by NEXO team;
- assisted import/configuration;
- one-month guarantee/support period;
- progressive move toward self-service onboarding.

## 13. Commercial model
Initial hypothesis:
- setup/first payment: USD 30;
- recurring: USD 10/month;
- installation/configuration included;
- one-month guarantee;
- customer only continues paying if the system solves the intended problem;
- support target: continuous/24x7 intake, with service level formalized later.

These are business assumptions, not hardcoded software rules. Pricing must remain configurable outside product code.

## 14. Offline requirement
A store may be offline for hours.

Required behavior:
- continue selling;
- continue cash operations;
- continue local inventory movements;
- queue sync events;
- show sync state;
- reconcile when Internet returns;
- never duplicate transactions on retry.

## 15. Channel strategy
Minimum commercial hardware remains one Android phone.

Progressively, the system should allow as much of the business as practical to be run from the app:
- sales;
- stock;
- cash;
- customers;
- orders;
- gestoras;
- messenger operations;
- reports;
- configuration appropriate to role.

WhatsApp remains useful during transition, but the strategic direction is to move critical workflows into NEXO while retaining WhatsApp as an optional communication/share channel.

## 16. Accounting scope
The platform should evolve beyond simple cash.

Target accounting/financial operations:
- cash and bank;
- sales and payments;
- expenses;
- receivables;
- payables;
- suppliers/purchases;
- credit/fiado;
- consignment;
- customer balances;
- messenger settlement;
- gestora commissions;
- inventory valuation/cost;
- gross margin;
- profit/loss reporting;
- audit trail;
- accountant exports;
- later formal chart of accounts/journal/trial balance.

Implementation order remains operational-first: do not build full accounting before sales, inventory, cash, receivables and sync invariants are stable.

## 17. Next full reusable pilot
After Casa Viva, the next intended full NEXO-native reusable-template pilot is **Estilo y Hogar**.

Colo Shop remains useful as the external-system/Axis connector pilot.

Estilo y Hogar should be used to prove that a second NEXO-native business can be onboarded primarily by configuration rather than a fork.
