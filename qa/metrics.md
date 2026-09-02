# Metrics — Baito

One row per run. §24 requires a previous value beside every number; this is the
**first run under this protocol**, so the "previous" column reads `—` and the
trend is established from the next pass onward. Sample sizes are stated.

## Run history

| Run | Date | Commit | Backend tests | Coverage | Findings (S1/S2/S3/S4) | UI screens visited | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | 2026-09-02 | `00c34cc` | 104 passed / 104 | 69% | 0 / 1 / 3 / 1 | 52 of 59 | GO WITH CONDITIONS |

## This run in detail

| Metric | Previous | This run | Sample | Note |
|---|---|---|---|---|
| Backend suite | 103 passed | **104 passed, 0 failed** | 104 cases | +1: the preventive test for BUG-001 |
| Line coverage (backend) | — (never measured) | **69%** | 4,106 statements, 1,271 missed | measured with `pytest-cov`; no threshold exists in CI |
| Coverage, `app/tasks.py` | — | **19%** | 157 statements | the only unattended money movement in the product |
| Coverage, `app/services/escrow_service.py` | — | **93%** | — | |
| Coverage, `app/core/security.py` | — | **90%** | — | |
| Frontend unit tests | — | **0** | — | none exist |
| E2E specs that run in CI | — | **0 of 5** | 5 specs present | never invoked |
| Lint findings, `app/` | — | **110** | 109 F401, 1 E712 | gate is `\|\| true`, so none block |
| Dependency advisories (prod) | — | **5 high** | frontend runtime deps | `npm audit --omit=dev` |
| Dependency advisories (backend) | — | **1** | `ecdsa` via `python-jose` | unreachable: JWTs are HS256 |
| Secrets in worktree / git history | — | **0 / 0** | full tree, all refs | regex sweep |
| Requirements coverage (P0/P1) | — | **22 of 22 traced** | see `rtm.csv` | 2 PARTIAL, 3 FAIL, rest PASS |
| UI screens visited | — | **52 of 59 (88.1%)** | inventory in `ui-inventory.md` | 7 named as not visited |
| UI elements observed | — | **1,423** | across 52 screens | breadth crawl; not each individually clicked |
| Unnamed interactive controls | 6 (earlier today) | **2** | 14 routes | |
| Undersized touch targets @375px | 60+ (earlier today) | **11** | 9 routes | remaining are wide filter chips |
| Flake rate | — | **0%** observed | 104 cases, 3 full runs today | one ordering flake was found and fixed earlier today |
| Test case effectiveness | — | **1.0%** | 1 of 104 cases found a defect this pass | the new case; the suite is regression cover, not discovery |
| p50 / p99 latency, job board | — | **630ms / 1,432ms** | 1,000 req, 200 concurrent | local stack, production worker count |
| Throughput, job board | — | **282 req/s** | as above | |
| Defect escape rate | — | **not computable** | — | requires production defect data; none available from this session |
| DDP / DRE | — | **not computable** | — | same reason |
| MTTR | — | **not computable** | — | first run; no prior report-to-fix history under this protocol |
| Change failure rate (DORA) | — | **not computable** | — | needs release/incident history |

## Metrics deliberately left uncomputed

Escape rate, DDP, MTTR and change failure rate all need production data or a
prior run. Reporting them from a single local pass would be inventing them.
They become available from run 2 onward, and escape rate needs production
defect reports to be recorded somewhere this process can read.

## AI eval scores

**N/A** — no model in the product. See `security/llm-top10.md`.
