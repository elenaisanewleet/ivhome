# IVhome Security Notes

This repository is an early technical prototype for an aggregator of licensed
at-home medical services. IVhome is not a clinic, does not diagnose, does not
prescribe treatment, and does not recommend medication or IV composition.

## Prototype Boundaries

PR 2 adds the Prisma data model and fake local-development seed data. It does
not contain authentication, personal data processing logic, clinical data,
partner matching, request submission workflows, or payments.

The MVP explicitly excludes:

- online payments and acquiring;
- automatic license verification;
- telemedicine;
- AI recommendations;
- CRM integrations.

## Staff Authentication Baseline

The first technical prototype will use staff login, RBAC, and secure sessions
for the shared internal dashboard:

- `/admin` for platform staff;
- `/clinic` for partner staff.

The partner-side role for reviewing a request is named
`CLINIC_AUTHORIZED_STAFF`. Product copy must describe this role as an
"уполномоченный сотрудник партнёра". The platform must not imply that it
verifies an individual staff member's medical qualification.

## MFA TODO

MFA is intentionally deferred from the first technical prototype.

Before production:

- add an MFA challenge interface to the staff login flow;
- require MFA for platform administrative roles;
- define whether partner accounts require MFA by role and risk level;
- add recovery, reset, and audit procedures;
- add session revocation and forced re-authentication for sensitive actions.

## Session TODO

When staff login is implemented:

- use server-side or cryptographically signed sessions;
- set `HttpOnly`, `Secure`, and appropriate `SameSite` cookie attributes;
- rotate session identifiers after login and privilege changes;
- enforce expiration and revocation;
- add CSRF protection for state-changing dashboard requests;
- log authentication and authorization events without storing secrets.

## Personal And Medical Data TODO

Before any real user data is accepted:

- approve consent texts and retention periods with legal counsel;
- minimize collected fields and avoid medical documents in the MVP;
- encrypt personal data fields at rest;
- keep sensitive payloads out of logs and Telegram messages;
- implement tenant isolation and deny-by-default RBAC;
- log access to sensitive records;
- complete a threat model and incident response runbook;
- validate Russian personal data localization requirements.

## Fake Seed Data

`prisma/seed.ts` contains fake local-development data only. Demo clinic names,
`DEMO-*` license numbers, masked contact values, and placeholder values such as
`fake-encrypted:*` are deliberately not real people, clinics, addresses,
licenses, or credentials.

Fields ending in `Encrypted` or `Hash` identify values that must not be stored
in clear text when application logic is implemented. The fake placeholders in
the seed are not a cryptographic implementation. Production code must use an
approved encryption and key-management design, and must keep plaintext
personal or medical data out of logs, audit metadata, and Telegram messages.

## Emergency Screening TODO

Emergency screening copy and hard-stop logic must be approved by a medical
expert and legal counsel before release. It is a routing safeguard, not a
diagnostic questionnaire.
