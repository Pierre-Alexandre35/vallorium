"""Server-side latency of every GET endpoint, in-process (no network).

Builds the same isolated world as the budget tests (perf/world.py), times each
GET endpoint under /api/v1 and writes the results in github-action-benchmark's
"customSmallerIsBetter" JSON format.

Run it as a file, not with -m, so the app under test can come from another
checkout (CI times the base branch and the PR with this same harness):

    python perf/latency.py --output head.json
    python perf/latency.py --app-root ../base/vallorium/backend --output base.json

Needs TEST_DATABASE_URL (dedicated test database), plus DATABASE_URL and
REDIS_URL because the app reads them at import time.
"""

from __future__ import annotations

import argparse
import gc
import json
import os
import statistics
import sys
import time
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument(
        "--app-root",
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help="backend directory whose `app` package is timed (default: this one)",
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("-n", type=int, default=200, help="timed requests per endpoint")
    parser.add_argument("--warmup", type=int, default=20)
    parser.add_argument(
        "--database-url",
        default=os.getenv("TEST_DATABASE_URL"),
        help="dedicated test database (default: $TEST_DATABASE_URL)",
    )
    return parser.parse_args()


def percentile(values: list[float], pct: float) -> float:
    ordered = sorted(values)
    k = (len(ordered) - 1) * pct / 100
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (k - lo)


def time_endpoints(
    client, targets: dict[str, tuple[str, str]], n: int
) -> dict[str, list[float]]:
    """Time all endpoints round-robin: one request to each per pass.

    Interleaving spreads any slow period of the machine evenly over every
    endpoint instead of letting it land on whichever one was being timed.
    """
    durations: dict[str, list[float]] = {key: [] for key in targets}
    gc.collect()
    gc.disable()
    try:
        for _ in range(n):
            for key, (method, path) in targets.items():
                start = time.perf_counter_ns()
                client.request(method, path)
                durations[key].append((time.perf_counter_ns() - start) / 1e6)
    finally:
        gc.enable()
    return durations


def main() -> int:
    args = parse_args()
    if not args.database_url:
        print("❌ TEST_DATABASE_URL (or --database-url) is required.", file=sys.stderr)
        return 2

    # `world` is imported from this directory; `app` from --app-root.
    app_root = args.app_root.resolve()
    sys.path.insert(1, str(app_root))
    import app

    # Refuse to silently time another copy (e.g. an installed `app` package).
    if not Path(app.__file__).resolve().is_relative_to(app_root):
        print(f"❌ `app` loaded from {app.__file__}, not {app_root}.", file=sys.stderr)
        return 2

    from world import PerfWorld, get_route_keys

    targets: dict[str, tuple[str, str]] = {}
    skipped: list[str] = []
    # An endpoint that crashes is reported as skipped instead of aborting the run.
    with PerfWorld(args.database_url, raise_server_exceptions=False) as world:
        for key in sorted(get_route_keys()):
            try:
                method, path = world.path_for(key)
            except KeyError as exc:
                skipped.append(f"{key} (no value for path parameter {exc})")
                continue
            responses = [world.client.request(method, path) for _ in range(args.warmup)]
            if any(r.status_code != 200 for r in responses):
                skipped.append(f"{key} (HTTP {responses[-1].status_code})")
                continue
            targets[key] = (method, path)

        durations = time_endpoints(world.client, targets, args.n)

    results = []
    for key, values in durations.items():
        median = statistics.median(values)
        p95 = percentile(values, 95)
        results.append(
            {
                "name": key,
                "unit": "ms",
                "value": round(median, 3),
                "extra": f"p95 {p95:.3f} ms, {args.n} requests",
            }
        )
        print(f"  {key:<45} median {median:7.3f} ms   p95 {p95:7.3f} ms")

    for item in skipped:
        print(f"  skipped {item}")

    args.output.write_text(json.dumps(results, indent=2) + "\n")
    print(f"Wrote {len(results)} results to {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
