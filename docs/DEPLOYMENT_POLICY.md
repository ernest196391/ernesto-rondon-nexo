# NEXO — Deployment & Operations Policy

## Default policy

NEXO and new projects must not depend on Hostinger Connector, ChatGPT Work credits, or any single interactive connector in order to develop or deploy.

The preferred operating path is:

**ChatGPT/GitHub → CI → reproducible release → SSH → deployment script on Hostinger → runtime-native tooling → smoke tests → automatic rollback on critical failure.**

Hostinger Connector may be used when available for inspection or administration, but it is an auxiliary capability, never a critical deployment dependency.

## Principles

1. **GitHub is the source of truth.** Production must be traceable to a commit/release.
2. **CI is a release gate.** A failing release is not deployed.
3. **Deployments are scripted.** Avoid undocumented click-only production procedures when the platform permits automation.
4. **Secrets stay outside Git.** SSH credentials, API keys and production environment values live in approved secret stores/runtime configuration.
5. **Production changes are auditable.** Record release SHA, CI evidence, deployment time and smoke-test result.
6. **Deployments are reversible.** Identify a known-good release before changing production and automate rollback where practical.
7. **Least privilege.** Deployment credentials receive only the access required for the target application.
8. **Project isolation.** Deploying NEXO must not modify Casa Viva, WordPress, unrelated DNS, or other applications.
9. **Human escalation is exceptional.** Request Ernesto only for genuinely required authorization, unavailable credentials/permissions, or product/business decisions.
10. **Connector outages do not stop development.** Continue safe GitHub, CI, testing, release and documentation work when Work/Codex/Hostinger Connector is unavailable or exhausted.

## WordPress projects

Preferred path:

**GitHub Actions → SSH → remote deployment script → WP-CLI → smoke tests → rollback.**

Use WP-CLI for repeatable WordPress operations where supported. Back up affected state before destructive or schema-affecting operations.

## Node.js / Next.js projects

Preferred path:

**GitHub Actions → SSH → versioned release directory → dependency install → production build → runtime/process-manager restart or switch → health/smoke tests → rollback to previous release.**

Use the hosting platform's native Node.js tooling when it provides a clearly safer and more reliable deployment mechanism. Do not convert a server-rendered/API application to a static site merely to fit a connector or hosting limitation.

## NEXO production target

Current intended hostname: `nexo.casavivadecuba.com`.

NEXO requires a server runtime because it exposes `/api/analyze` and `/api/health`. The deployment mechanism must support the Node.js/Next.js runtime and server-side environment variables.

## Deployment automation acceptance criteria

Before enabling unattended production deployment, confirm:

- SSH or an equivalent deployment channel is available for the target hosting account;
- Node.js runtime compatibility is verified;
- the NEXO application has an isolated target path/process;
- production secrets can be configured without committing them;
- the deployment identity has least-privilege access;
- a release script is idempotent or safely repeatable;
- health and smoke tests can fail the deployment;
- a known-good release can be restored automatically;
- deployment logs do not expose secrets;
- Casa Viva remains untouched.

## Platform exception

A platform-native deployment mechanism may replace SSH when it is demonstrably superior in security, reproducibility, observability and rollback. The same release gates and audit requirements still apply.
