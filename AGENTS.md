# AGENTS.md — IVhome / Nadom

You are working in the IVhome repository.

Internal repo/project name: IVhome.
Public user-facing brand: Nadom / Надом.

Before any task, follow these rules:

1. Read the relevant Nadom docs:

   * Product/legal/safety: `docs/nadom/project-rules.md`
   * Public copy: `docs/nadom/public-wording.md`
   * UI/visual/frontend: `docs/nadom/visual-system.md`
   * Privacy/security: `docs/nadom/privacy-security.md`
   * PR review: `docs/nadom/pr-review-checklist.md`

2. Source priority:

   * Main source of truth: `docs/nadom/references/Выполнение промта по проекту - Claude.html`, if present
   * Visual references: `docs/nadom/references/saved_resource*.html`, if present
   * PNG visual references: `docs/nadom/references/visual/`, if present
   * Supporting docs: `docs/nadom/references/ivhome-strategy.md.pdf` and `docs/nadom/references/Бизнес-план сервиса конфиденциального вызова капельницы на дому в Москве.pdf`, if present
   * If original source files are missing, use `docs/nadom/*.md` as the persistent repo rules.

3. Public brand is Nadom / Надом. IVhome is internal only.

4. Nadom is an aggregator / marketplace / matching service, not a clinic. It does not provide medical services, diagnose, prescribe, recommend IV composition, or promise medical results.

5. Medical feasibility, details, composition, price, and the visit are confirmed by the selected licensed medical organization.

6. Do not use `служба` as the default public term. Prefer:

   * `медицинская организация`
   * `выбранная организация`
   * `специалист выбранной организации`
   * `медицинский специалист`
   * `выездная бригада`
   * `предложение`
   * `вариант`

7. Do not use forbidden medical or anonymity claims.

8. For UI/frontend/visual work, inspect Claude HTML, saved_resource references, and PNG visual references first when available. Do not introduce a new visual style.

9. Keep PRs small. Do not merge. Open PRs as draft unless explicitly told otherwise.

10. Never commit `.env`, tokens, secrets, personal data, phone numbers, addresses, or medical details.
