Run the focused tests from `vallorium/backend`:

```sh
poetry run python -m unittest discover -s tests -v
```

PostgreSQL concurrency tests are skipped unless `TEST_DATABASE_URL` names a
**dedicated PostgreSQL test database**. They create and drop only a randomly
named schema. They exercise worker/request races and simultaneous spending
using separate database sessions. They do not use the legacy pytest fixtures.

## Performance budgets

`test_performance_budgets.py` checks, for every GET endpoint under `/api/v1`,
how many SQL queries one request runs and how large the response is. It builds
a realistic world from the real seed reference data plus a real signup, in a
throwaway schema. It runs in CI on every push and PR.

It fails when:

- an endpoint runs more queries, or returns more KB, than its budget. The
  failure message lists every SQL statement, so an N+1 query is easy to spot;
- a new GET endpoint has no budget. Add it to `BUDGETS`, or to `EXEMPT` with a
  reason.

If the extra cost is intended, raise the budget in the same PR so it is visible
in review. The summary printed after the run shows `↓ budget can be lowered`
when an endpoint got cheaper; lower it to lock the gain in.

Run it locally against the docker-compose Postgres (one-time:
`docker compose exec postgres psql -U pierre -d pierre -c "CREATE DATABASE vallorium_test"`):

```sh
export TEST_DATABASE_URL=postgresql+psycopg://pierre:password@localhost:5432/vallorium_test
export DATABASE_URL=$TEST_DATABASE_URL REDIS_URL=redis://localhost:6379/0
poetry run python -m unittest discover -s tests -v
```

## Latency in CI

`.github/workflows/performance.yml` times every GET endpoint in-process
(`perf/latency.py`, same world as the budget tests, 200 requests per endpoint,
round-robin so machine noise hits all endpoints evenly).

- **Pull requests:** the base branch and the PR are timed alternately on the same
  runner, 3 rounds each; `perf/compare.py` keeps the best median per endpoint
  and posts a sticky PR comment (also in the job summary). Endpoints at least
  1.5× slower are flagged. It warns only and never blocks a merge. Same-code
  noise measured locally is under ~10%.
- **Pushes to `dev`/`main`:** results go to the `gh-pages` branch under
  `perf/<branch>/`, which renders a latency-over-time chart. Enable GitHub Pages
  once (Settings → Pages → Deploy from branch `gh-pages`); the chart is then at
  `https://<owner>.github.io/<repo>/perf/<branch>/`.

Compare two checkouts locally (e.g. a `git worktree` of `main`):

```sh
poetry run python perf/latency.py --app-root ../../main-worktree/vallorium/backend --output base.json
poetry run python perf/latency.py --output head.json
poetry run python perf/compare.py --base base.json --head head.json --output report.md
```

For wall-clock latency against a running backend (network included), use
`perf/bench.py` (`poetry run python -m perf.bench --help`).

## Deployment

Run `alembic upgrade head` before deploying the new API and worker. The new
`production_remainder` column defaults to zero for existing rows. Fractions
already lost before this migration cannot be recovered. Restart all old
API/worker processes together; old writers do not maintain the remainder.

`FARM_UPGRADE_SWEEP_SECONDS` defaults to 2 and accepts values greater than 0
and at most 60. Sweeps process at most 10 batches of 100 villages; later
sweeps pick up remaining work. Logs report completion count, remaining overdue
events, oldest overdue age, and sweep duration. Per-village failures include
tracebacks and leave events pending for retry. Alert on sustained overdue age,
not on a single overlapping sweep finding locked work.

## Rules for future event types

Keep domain-specific handlers. Commands and workers must acquire the village
lock before loading and applying due events, ordered by scheduled time then a
stable tie-breaker. Apply state changes and event completion in one transaction.
Settlement rejects timestamps older than the persisted resource timestamp.

Before introducing attacks/trades, coordinate earlier events across every
involved village; deterministic lock order alone does not establish causal
order. Never advance a village past an unresolved earlier event that affects
it. Specify same-timestamp gameplay ordering before implementing those events.
