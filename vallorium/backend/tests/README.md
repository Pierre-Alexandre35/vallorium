Run the focused tests from `vallorium/backend`:

```sh
.venv/bin/python -m unittest discover -s tests -v
```

PostgreSQL concurrency tests are skipped unless `TEST_DATABASE_URL` names a
**dedicated PostgreSQL test database**. They create and drop only a randomly
named schema. They exercise worker/request races and simultaneous spending
using separate database sessions. They do not use the legacy pytest fixtures.

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
