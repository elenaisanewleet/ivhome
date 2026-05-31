# Nadom PR review checklist

## Scope and delivery

- [ ] PR is draft unless explicitly requested otherwise.
- [ ] PR is not merged.
- [ ] Changed files match the requested scope.
- [ ] No application code changed for docs-only tasks.
- [ ] No Prisma schema changes unless explicitly requested.
- [ ] No package-script changes unless explicitly requested.
- [ ] Validation results are shown.
- [ ] README and SECURITY documentation consistency was checked when relevant.

## Privacy and security

- [ ] No env files, secrets, or tokens are committed.
- [ ] No personal data, phone numbers, addresses, or medical details are committed.
- [ ] Telegram `initData` validation and privacy constraints were considered when relevant.

## Public copy and visuals

- [ ] Public copy follows the Nadom wording rules.
- [ ] No forbidden medical claims are introduced.
- [ ] No absolute anonymity claims are introduced.
- [ ] Public copy does not use `врач Надом`, `наш врач`, or `наш партнёр`.
- [ ] `служба` is not used as the default public term.
- [ ] UI changes match the available visual references.
