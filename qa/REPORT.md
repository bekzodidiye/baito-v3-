# QA Report — Baito — 2026-09-02 — `00c34cc6693d`

Run under `QA.md` v1.0, all six phases. Branch `claude/qa-protokol`.

## 1. Verdict

**GO WITH CONDITIONS.**

One S2 was found and fixed during the pass: the hourly `auto_release_escrow`
task — the safety net that pays a worker whose finished job was never released
by hand — had never released anything, because the column it reads to decide
who to pay is written by nothing. Reproduced 3/3, root-caused, fixed, and
covered by a new regression test; the suite is green at 104/104.

The conditions are not about that defect. They are that three of the checks
this project appears to run do not run: the backend lint gate is `|| true`, a
five-spec Playwright suite is invoked by nothing, and there is no dependency
audit — while five high-severity advisories sit in the production frontend
bundle. A release can ship today; it should not ship again with those gates
still ornamental.

## 2. Scope

**Tested.** 94 API endpoints enumerated and swept for authentication,
authorisation, ownership, deep links and payload validation; 52 of 59 screens
visited across worker, employer and admin; the seven critical user journeys;
escrow, balance and withdrawal paths; three languages; mobile/desktop widths;
accessible names and focus order; concurrency and load on read paths.

**Not tested, and why.**
- **§7 AI/LLM quality and §8.1 OWASP LLM Top 10 — N/A.** The product has no
  model. Recorded as not applicable, not as passed (`security/llm-top10.md`).
- **Production.** Unreachable from this session (SSH blocked), and destructive
  testing against it is forbidden by §2 regardless. Nothing here is confirmed
  against production.
- **Payment and SMS providers.** No sandbox credentials; contract shape only.
- **7 of 59 screens** — named individually in `ui-sweep.md`.
- **Cross-browser and real devices.** Chromium only.
- **Colour contrast, and a real screen reader.** Accessible names and tab order
  were checked programmatically; that is roughly a third of what an audit needs.

**Blocked.** Nothing. Every §19 precondition was met: the app runs, credentials
exist for all three roles, the browser tooling reads console and network.

## 3. Findings

| ID | Sev | Pri | Type | Component | Summary | Status |
|---|---|---|---|---|---|---|
| BUG-001 | S2 | P1 | functional | `tasks.py::auto_release_escrow` | Releases nothing, ever — `jobs.hiredWorkerId` is never written | **Fixed + test** |
| BUG-002 | S3 | P2 | functional | `schemas/job.py` | NUL byte in any text field answers 500, not 422 | Open |
| BUG-003 | S3 | P2 | security | frontend deps | 5 high-severity advisories in the production bundle | Open |
| BUG-004 | S3 | P2 | process | `ci.yml` | Lint gate cannot fail; E2E suite never runs; no frontend unit tests | Open |
| OBS-01 | S4 | P4 | data | `transportRate` | Accepts `-50000`; traced — free-text display field, never parsed into money | Observation |
| OBS-02 | — | — | design | `POST /jobs` | Duplicate submits create two postings; an `Idempotency-Key` mechanism exists but only payments use it | Observation |

## 4. Results by area

| Area | Cases | Pass | Fail | Blocked | Coverage / score |
|---|---|---|---|---|---|
| Functional (backend suite) | 104 | 104 | 0 | 0 | 69% line coverage |
| API | 94 endpoints enumerated | see below | 1 | 0 | auth/authz swept across all; per-endpoint happy paths partial |
| Data | escrow, balances, applications | pass | 0 | 0 | escrow_service 93% |
| **UI sweep** | 52 screens · 1,423 elements | 52 | 0 | 0 | 88.1% of screens; breadth crawl, not per-element clicks |
| AI eval | — | — | — | — | **N/A — no model** |
| Security | 12 systematic checks | 11 | 1 | 0 | BUG-003 open |
| Performance | 3 load profiles | 3 | 0 | 0 | 1,000 req @200 concurrent, all 200 OK |
| E2E | 5 specs exist | 0 | 0 | **5** | nothing invokes them (BUG-004) |
| A11y | names + focus order, 14 routes | partial | — | — | 2 unnamed controls remain; contrast unmeasured |

## 4b. UI sweep coverage

Screens in inventory: **59** · visited: **52 (88.1%)**
Interactive elements observed: **1,423** · crashes 0 · console errors 0 ·
failed requests 0 · horizontal overflow 0
Roles swept: worker · employer · admin · guest (via login/register)
Mode: **automated crawl at 100% of reachable routes + targeted deep pass** on
money, permission, deep-link and destructive paths. A hand-click of all 1,423
controls was **not** performed and is not claimed.

Not visited, each with a reason: `/jobs/:id`, `/chats/:id`, `/payments/success`,
`/payments/error`, `*`, and the two auth screens swept only as far as
authenticating. Full list in `ui-sweep.md`.

## 5. AI quality scorecard

**N/A.** No LLM, no embeddings, no vector store, no model provider. The two
modules named "AI" are deterministic scoring and keyword rules. Basis recorded
in `security/llm-top10.md`.

## 6. Risk register (open)

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| R-15 test-suite trust | 4 | 2 | BUG-004 — fix the gates | owner |
| R-05 PII at rest | 5 | 3 | passport scans and card refs stored; retention obligation still `UNKNOWN` | owner |
| R-03 rate limiting trusts `X-Forwarded-For` | 5 | 3 | cannot be fixed at nginx; depends on the Funnel rewriting the header | owner |
| R-10 background jobs | 3 | 3 | `tasks.py` at 19%; `expire_stale_jobs`, `send_telegram_digest` untested | owner |
| R-16 data retention/deletion | 3 | 2 | no deletion path reviewed; obligation unknown | owner |

Full register: `risk-register.md`.

## 7. Coverage & traceability

22 requirements traced in `rtm.csv`. Every P0/P1 has at least one test.
Not passing: CUJ-1 (PARTIAL — SMS code path needs a provider sandbox),
input validation (FAIL — BUG-002), dependency hygiene (FAIL — BUG-003),
CI gates (FAIL — BUG-004), a11y (PARTIAL).
Backend line coverage **69%**, measured this pass; no prior value exists and no
threshold is configured in CI.

## 8. Conditions for GO

1. Remove `|| true` from the lint step, after clearing or explicitly ignoring
   the 110 findings in `app/` (49 are auto-fixable). — *owner*
2. Run `npm audit fix` for the five production advisories and smoke-test
   routing, then add `npm audit --omit=dev --audit-level=high` to CI. — *owner*
3. Wire the five existing Playwright specs to a `test:e2e` script and a CI job.
   — *owner*
4. Fix BUG-002 with a test: reject control characters in the shared string
   validators. — *owner*
5. Answer the four open questions in `project-facts.md` — compliance regime,
   the critical-failure definition, release sign-off, and whether an age gate is
   intended. Two of them gate what "done" means for PII. — *owner*

## 9. Recommendations (beyond this release)

- **Treat `app/tasks.py` as a P0 coverage area.** It is 19% covered and holds
  the only money movement that happens without a human. BUG-001 lived there.
- **Add a frontend test layer.** There are zero unit tests. Every frontend
  defect in this session was found by hand, which does not scale and does not
  survive this session ending.
- **Stand up a staging environment.** `RUNBOOK.md` states every change is proven
  in production. That is the single largest structural risk to quality here.
- **Decide on idempotency for writes** (OBS-02). The mechanism exists and is
  used by one endpoint.
- **Record production defects somewhere this process can read**, so escape rate
  and DDP become computable from run 2.

## 10. Artefacts

- `project-facts.md` — §0, filled, with four open questions
- `test-plan.md` · `risk-register.md` · `rtm.csv`
- `ui-inventory.md` (59 screens) · `ui-sweep.md` (52 visited, 1,423 elements)
- `api-checklist.md` (94 endpoints)
- `findings/BUG-001…BUG-004`
- `sessions/SES-01-ugly-data.md` · `sessions/SES-02-permissions-and-interruption.md`
- `perf/results.md`
- `security/llm-top10.md` (N/A, with basis) · `security/scans/` (ruff, pip-audit,
  npm-audit, secret sweeps — raw output)
- `evidence/baseline-pytest.txt` · `evidence/coverage.txt` ·
  `evidence/regression-after-fix.txt`
- `rca.md` · `metrics.md`
- `history/` — empty; this is run 1.

## 11. Reproduction appendix

```
# Dependencies
docker network create baito-qa-net
docker run -d --name baito-qa-db    --network baito-qa-net \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=testpw -e POSTGRES_DB=baito postgres:15
docker run -d --name baito-qa-redis --network baito-qa-net redis:7-alpine
docker run -d --name baito-qa-minio --network baito-qa-net \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio:latest server /data

# API (four uvicorn workers, as production)
docker run -d --name baito-qa-api --network baito-qa-net -p 18190:8000 \
  -e DATABASE_URL="postgresql://user:testpw@baito-qa-db:5432/baito" \
  -e REDIS_URL="redis://baito-qa-redis:6379/0" \
  -e SECRET_KEY=... -e ENVIRONMENT=development \
  -v "$PWD/backend:/app" baito-backend-upgraded
docker exec baito-qa-api sh -c "cd /app && alembic upgrade head"
docker exec baito-qa-api sh -c "cd /app && python scripts/create_accounts.py \
  'admin:+998900001004:QA Admin' 'employer:+998900001001:QA Ish beruvchi' \
  'worker:+998900001002:QA Ishchi' 'worker:+998900001003:QA Ishchi 2'"
# generated passwords are printed once and are deliberately not recorded here

# Backend suite with coverage
docker exec baito-qa-db psql -U user -d baito -c "CREATE DATABASE baito_test"
docker run --rm --network baito-qa-net -v <snapshot>:/snap -w /snap/backend \
  -e DATABASE_URL="postgresql://user:testpw@baito-qa-db:5432/baito_test" \
  -e REDIS_URL="redis://baito-qa-redis:6379/9" -e COVERAGE_FILE=/tmp/.coverage \
  --entrypoint sh baito-backend-upgraded -c \
  "pip install -q pytest pytest-timeout httpx pytest-cov; \
   python -m pytest tests/ -q -p no:cacheprovider --no-header --cov=app --cov-report=term"

# Frontend
socat TCP-LISTEN:8000,reuseaddr,fork TCP:127.0.0.1:18190   # dev server proxies /api to :8000
npm run dev:frontend                                        # Vite :5173

# Static analysis
docker run --rm -v "$PWD/backend:/src:ro" -w /work python:3.11-slim sh -c \
  "pip install -q ruff==0.5.0; cp -r /src /work/backend; cd /work/backend; ruff check ."
docker run --rm -v "$PWD/backend:/src:ro" python:3.11-slim sh -c \
  "pip install -q pip-audit; pip-audit -r /src/requirements.txt"
npm audit --prefix frontend --omit=dev
```

Browser: Chromium via the in-app pane, viewport 1440×900 (and 375×812 for the
mobile pass earlier today). No seeds or model versions apply — the system is
deterministic and contains no model.
