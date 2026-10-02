# NEXO Business — Cuba Retail Platform Model

**Status:** product-direction decision  
**Date:** 2026-10-02  
**Applies to:** NEXO Business + Casa Viva + future Cuban retail deployments

## 1. Product thesis

NEXO Business is not a one-off POS for Casa Viva.

It is a reusable retail operating platform for small and medium Cuban businesses that can be configured per merchant and sold as a package combining:

- online store;
- in-store POS/cash;
- inventory;
- order operations;
- gestora/sales-agent app;
- messenger/delivery app;
- customer order tracking;
- management/admin;
- offline-first operation;
- synchronization between physical and digital channels.

Casa Viva is Pilot 01 and the reference implementation for operational complexity.

The platform must preserve a reusable core while allowing each business to keep its specific operating rules.

## 2. Commercial package

A merchant can receive one configurable system made of modules.

### Core merchant package
- branded online store;
- product catalog;
- prices and availability;
- cart and checkout;
- POS for Android and Windows;
- local offline database;
- cash shifts;
- inventory movements;
- orders;
- receipts;
- staff roles;
- basic reports.

### Gestora module
- approved-product catalog;
- attributed links/custom storefront;
- customer attribution;
- orders;
- configurable margin/commission rules;
- commission ledger;
- order follow-up;
- privacy by role.

### Messenger module
- available jobs;
- accepted/active delivery;
- pickup;
- customer contact;
- route/map links;
- delivery status;
- collection method and amount;
- money pending to return;
- incident reporting;
- settlement/closeout.

### Management module
- business dashboard;
- orders;
- users/roles;
- products;
- stock/reconciliation;
- cash;
- messenger closeout;
- gestora commissions;
- incidents;
- audit trail;
- configuration.

## 3. Core versus merchant-specific behavior

### NEXO shared core
The following should be common and reusable:
- identity and tenant model;
- users, roles and capabilities;
- product identities and external references;
- local POS/cart/receipt;
- cash-shift ledger;
- inventory movement ledger;
- order event model;
- outbox/inbox synchronization;
- idempotency;
- offline persistence;
- notifications;
- audit trail;
- configurable payment methods;
- configurable delivery/collection modes;
- gestora attribution primitives;
- messenger-job primitives;
- reporting contracts;
- device provisioning;
- white-label branding.

### Merchant configuration
Each business may configure:
- brand, logo, colors and domain;
- currencies used;
- payment methods;
- sales channels;
- branches;
- pickup points;
- delivery zones and prices;
- gestora rules;
- messenger rules;
- commissions;
- who can see exact stock;
- workflow labels;
- business hours;
- tax/fee behavior if applicable;
- catalog source;
- existing POS/ERP connector;
- WhatsApp/contact destinations.

### Merchant adapters / workflow extensions
Only true operational differences should require custom code.

Example: Casa Viva already has canonical WooCommerce order, delivery, cash-return, commission and messenger-closeout semantics. NEXO should map those contracts rather than replacing them.

## 4. Deployment modes

### Mode A — NEXO-native business
For a business without an existing operational system.

NEXO owns:
- POS;
- cash;
- local inventory ledger;
- operational orders;
- staff workflows;
- sync.

The online store connects directly to NEXO cloud.

### Mode B — Existing-system connector
For a business already using WooCommerce, AxisSoft or another system.

The existing system keeps explicitly agreed authority.

NEXO adds:
- online/digital channel;
- offline/mobile tools;
- gestora/messenger apps;
- normalized events;
- reconciliation;
- analytics;
- automation.

No undocumented database writes.

### Mode C — Transitional hybrid
For businesses migrating gradually.

Authority is defined entity-by-entity:
- orders;
- stock;
- prices;
- customers;
- cash;
- commissions;
- delivery.

Authority must never switch implicitly.

## 5. Casa Viva as reference operating model

Casa Viva already proves patterns that should be extracted into reusable contracts:

- one order, multiple role-specific projections;
- operation, delivery, payment/cash, incident and commission as separate dimensions;
- canonical transitions;
- immutable/auditable events;
- idempotent closeout;
- messenger custody;
- cash pending return -> returned -> verified;
- collection method and amounts by currency;
- gestora attribution/commission;
- WooCommerce as temporary web authority;
- inventory reconciliation without a competing hidden stock truth.

Do not copy Casa Viva internal WordPress metadata into the NEXO core. Map it through adapters and portable contracts.

## 6. Money and cash model

The reusable platform must not assume one currency or one payment type.

At minimum, the cash subsystem must support:
- multiple currencies per shift;
- physical cash versus transfer/non-cash;
- POS sale cash;
- pickup-order cash;
- messenger-returned cash;
- manual cash in;
- manual cash out;
- correction/adjustment with reason;
- source reference;
- actor;
- timestamp;
- expected versus counted;
- difference by currency.

A bank transfer contributes to sales/revenue but not physical drawer cash.

## 7. Inventory model

Inventory changes are movements, not blind overwrites.

Every movement should identify:
- product;
- business;
- location/branch;
- quantity delta or physical count;
- source type;
- source ID;
- actor;
- reason;
- timestamp;
- idempotency key when synchronized.

Businesses using WooCommerce/Axis can retain their external stock authority until reconciliation is proven.

## 8. Order model

The portable NEXO order should support:
- channel;
- customer;
- lines;
- prices/totals/currency;
- fulfillment type;
- pickup or delivery;
- operation stage;
- delivery stage;
- payment/cash state;
- incident state;
- gestora attribution;
- messenger assignment;
- external references;
- event timeline.

Business-specific labels can vary; core semantic dimensions should not.

## 9. UX principle

The platform is mobile-first and must work on modest Cuban hardware and unstable connectivity.

Minimum viable business setup:
- one Android phone;
- no dedicated scanner;
- no printer;
- no permanent Internet.

Progressive enhancements:
- Windows counter PC;
- USB/Bluetooth scanner;
- thermal printer;
- cash drawer;
- additional Android devices.

Checkout must never depend on optional hardware.

## 10. White-label goal

A new merchant should ideally be onboarded mostly through configuration:

1. create tenant;
2. brand/domain;
3. branches;
4. currencies/payment methods;
5. catalog source/import;
6. delivery rules;
7. staff roles;
8. gestora rules;
9. messenger rules;
10. deploy store + POS/apps.

Custom coding should be the exception, not the onboarding method.

## 11. Architecture rule

Do not split Casa Viva, Gestor and Messenger into disconnected products with duplicated truth.

They are role surfaces over shared contracts.

Suggested boundaries:
- `business-domain`
- `business-db`
- `business-sync`
- `business-connectors`
- `business-config`
- `business-pos`
- web/admin/storefront surfaces
- gestora surface
- messenger surface

## 12. Immediate design consequence

Before expanding the current generic cash-shift implementation, adapt the cash model to:
- multi-currency;
- source-aware movements;
- external order references;
- physical versus non-cash payments;
- Casa Viva messenger-return workflow;
- reusable configuration for other merchants.

Do not hardcode Casa Viva rules into the generic core. Put Casa Viva-specific mapping into an adapter/configuration layer.

## 13. Acceptance for a reusable merchant template

A future pilot merchant should be able to operate:
- online sales;
- counter sales;
- offline sales;
- cash shift;
- product lookup/scanning;
- gestora sales attribution;
- delivery/messenger flow;
- cash return/settlement;
- order tracking;
- inventory reconciliation;
- management view;

without duplicating business logic across apps.
