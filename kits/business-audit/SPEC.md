# NEXO Business Audit — SPEC

Source methodology: `03-kit-auditoria-negocio`.

## Contract

Audit a business from two independent halves and never invent the missing half.

### Outside
Public presence scored 0–100 only when evidence is available. Eleven dimensions and weights:

1. Web & UX — 15
2. Offer & pricing — 15
3. Copy & communication — 12
4. Visible customer journey — 12
5. Social networks — 10
6. Meta Ads — 8
7. Google Business / Maps — 8
8. Reputation — 6
9. Brand consistency — 6
10. Basic SEO — 4
11. Content — 4

`not applicable` and `no data` do not receive zero; their weights are redistributed proportionally. Every scored dimension needs at least two concrete pieces of evidence.

Bands: 0–39 critical · 40–59 weak · 60–74 acceptable · 75–89 good · 90–100 reference.

### Inside
36-question owner form. Eight maturity areas, each 1–5 with a literal answer citation:

1. Lead capture & first contact — P7–P11
2. Scheduling — P12–P16
3. Payment & invoicing — P17–P21
4. Communication & follow-up — P15, P22, P23, P25
5. Data & measurement — P26, P27, P30
6. Retention & reactivation — P22, P24, P25
7. Security, backups & privacy — P8, P27–P29
8. AI & automation — P33, P34

Levels: 1 artisanal · 2 disconnected tools · 3 manually digitalized · 4 connected · 5 automated and measured.

Global maturity is the one-decimal mean of applicable areas with evidence. Digital score and maturity are never averaged together.

### Time and cost
Only calculate recoverable monthly hours from time explicitly declared by the business. Weekly → monthly uses ×4.3. Cost only exists when hourly cost is explicitly provided. Every derived number displays its operation.

### Cross-analysis
The most valuable findings require one outside citation and one inside citation. Actively test: unattended paid channel, impossible promise, review with internal cause, wrong public hours, requested reservation without system, acquisition goal vs ignored retention, ghost tool, and paid traffic without measurement.

### Outputs
One unified report, not two plans. Expected order:

1. Header and scope
2. Two headline scores + recoverable time/cost + critical risks + cross inconsistencies
3. Executive summary
4. What does not match
5. Current customer-journey map
6. Part A — outside
7. Part B — inside
8. Future customer-journey map
9. Unified action plan
10. 3–5 quick wins
11. Roadmap: 0–30 / 30–90 / 90+ days
12. What should not be automated yet
13. Competitor comparison when applicable
14. Methodology note

Final HTML must be self-contained, responsive, printable, evidence-first, and explicit about `no data` / `not applicable`.

## Safety
Never request access to business systems. Stop if client/customer lists, medical histories, invoices/exports containing third-party personal data, passwords, API keys or tokens are supplied. Do not reproduce them.

## Current implementation gate
Inside maturity, missing-answer handling, privacy stop, conservative recoverable-time calculations, stack inventory and operational risks are implemented. Full outside scoring, evidence-rich cross-analysis, process maps and unified printable HTML remain required before claiming full Kit 03 parity.
