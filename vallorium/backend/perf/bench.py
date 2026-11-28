"""API latency benchmark with history.

Logs in as a seed user, hits the endpoints the /app homepage uses, records
p50/p95/payload size, appends the run to perf/history.jsonl and compares it
with a baseline run.

Usage (backend must be running, e.g. `docker compose up`):

    poetry run python -m perf.bench                  # compare with previous run
    poetry run python -m perf.bench --baseline main  # compare with last run on main
    poetry run python -m perf.bench -n 100 --fail    # exit 1 on regression (CI)
    poetry run python -m perf.bench --label "before farm refactor"

Tip: start the backend with LOG_REQUEST_TIMINGS=true so the server-side time
(Server-Timing header) is recorded too. It separates "my code got slower"
from network/serialization noise.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

HISTORY_FILE = Path(__file__).parent / "history.jsonl"

# Endpoints to benchmark. "{village_id}" is filled from the login response.
# Add new endpoints here when you ship a feature that adds a request.
ENDPOINTS: list[tuple[str, str]] = [
    ("GET", "/auth/me"),
    ("GET", "/dashboard/current"),
    ("GET", "/villages/{village_id}/farms"),
    ("GET", "/villages/{village_id}"),
    ("GET", "/villages/{village_id}/resources"),
    ("GET", "/villages/{village_id}/production"),
]


def git(*args: str) -> str:
    try:
        return subprocess.check_output(
            ["git", *args], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def percentile(values: list[float], pct: float) -> float:
    ordered = sorted(values)
    k = (len(ordered) - 1) * pct / 100
    lo, hi = int(k), min(int(k) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (k - lo)


def server_time_ms(response: httpx.Response) -> float | None:
    # Parses "app;dur=12.34" set by the request_timing middleware.
    header = response.headers.get("server-timing", "")
    for part in header.split(";"):
        if part.strip().startswith("dur="):
            try:
                return float(part.strip()[4:])
            except ValueError:
                return None
    return None


def bench_endpoint(
    client: httpx.Client, method: str, path: str, n: int, warmup: int
) -> dict:
    for _ in range(warmup):
        client.request(method, path)

    totals: list[float] = []
    servers: list[float] = []
    size = 0
    status = 0
    for _ in range(n):
        start = time.perf_counter()
        response = client.request(method, path)
        totals.append((time.perf_counter() - start) * 1000)
        status = response.status_code
        size = len(response.content)
        if (server := server_time_ms(response)) is not None:
            servers.append(server)

    result = {
        "status": status,
        "bytes": size,
        "p50": round(statistics.median(totals), 2),
        "p95": round(percentile(totals, 95), 2),
        "min": round(min(totals), 2),
    }
    if servers:
        result["server_p50"] = round(statistics.median(servers), 2)
    return result


def load_history() -> list[dict]:
    if not HISTORY_FILE.exists():
        return []
    with HISTORY_FILE.open() as f:
        return [json.loads(line) for line in f if line.strip()]


def pick_baseline(history: list[dict], branch: str | None) -> dict | None:
    candidates = [r for r in history if branch is None or r.get("branch") == branch]
    return candidates[-1] if candidates else None


def fmt_delta(old: float | None, new: float, threshold: float) -> tuple[str, bool]:
    if not old:
        return f"{new:>8.1f}ms", False
    pct = (new - old) / old * 100
    regressed = pct > threshold
    flag = " ⚠️" if regressed else (" ✅" if pct < -threshold else "")
    return f"{old:>7.1f} → {new:>7.1f}ms ({pct:+5.0f}%){flag}", regressed


def fmt_bytes(old: int | None, new: int) -> str:
    if not old or old == new:
        return f"{new / 1024:.1f}KB"
    return f"{old / 1024:.1f} → {new / 1024:.1f}KB ({(new - old) / old * 100:+.0f}%)"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument(
        "--url", default=os.getenv("BENCH_URL", "http://localhost:8080/api/v1")
    )
    parser.add_argument(
        "--email", default=os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
    )
    parser.add_argument(
        "--password", default=os.getenv("SEED_ADMIN_PASSWORD", "admin123")
    )
    parser.add_argument("-n", type=int, default=50, help="requests per endpoint")
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument(
        "--baseline",
        metavar="BRANCH",
        help="compare with the last run on this branch (default: previous run)",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=20,
        help="%% slower that counts as a regression",
    )
    parser.add_argument("--fail", action="store_true", help="exit 1 on regression")
    parser.add_argument("--label", default="", help="free-text note for this run")
    parser.add_argument("--no-save", action="store_true", help="don't write history")
    args = parser.parse_args()

    with httpx.Client(base_url=args.url, timeout=30) as client:
        try:
            login = client.post(
                "/auth/login", json={"email": args.email, "password": args.password}
            )
        except httpx.ConnectError:
            print(f"❌ Cannot reach {args.url}. Is the backend running?")
            return 2
        if login.status_code != 200:
            print(f"❌ Login failed ({login.status_code}): {login.text}")
            return 2
        village_id = login.json()["user"].get("current_village_id")
        if village_id is None:
            print(
                f"⚠️  {args.email} has no village: village endpoints are skipped.\n"
                "   Use an account with a village: --email you@x --password ...\n"
            )

        results: dict[str, dict] = {}
        for method, template in ENDPOINTS:
            if "{village_id}" in template and village_id is None:
                continue
            path = template.format(village_id=village_id)
            key = f"{method} {template}"
            print(f"  benchmarking {key} ...", end="\r", flush=True)
            results[key] = bench_endpoint(client, method, path, args.n, args.warmup)
        print(" " * 70, end="\r")

    history = load_history()
    baseline = pick_baseline(history, args.baseline)

    run = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "commit": git("rev-parse", "--short", "HEAD"),
        "branch": git("rev-parse", "--abbrev-ref", "HEAD"),
        "dirty": bool(git("status", "--porcelain")),
        "label": args.label,
        "n": args.n,
        "results": results,
    }

    if results and not any("server_p50" in r for r in results.values()):
        print(
            "ℹ️  No Server-Timing header: start the backend with "
            "LOG_REQUEST_TIMINGS=true to also record server-side time.\n"
        )

    if baseline:
        ref = f"{baseline['commit']}{'*' if baseline.get('dirty') else ''}"
        print(f"Baseline: {ref} on {baseline['branch']} ({baseline['timestamp']})")
    else:
        print("No baseline yet. This run becomes the first one.")
    print(
        f"Current:  {run['commit']}{'*' if run['dirty'] else ''} on {run['branch']}\n"
    )

    any_regression = False
    old_results = baseline["results"] if baseline else {}
    for key, res in results.items():
        old = old_results.get(key, {})
        p50, reg50 = fmt_delta(old.get("p50"), res["p50"], args.threshold)
        p95, _ = fmt_delta(old.get("p95"), res["p95"], args.threshold)
        status = "" if res["status"] == 200 else f"  [HTTP {res['status']}]"
        print(f"{key}{status}")
        print(f"    p50 {p50}")
        print(f"    p95 {p95}")
        if "server_p50" in res:
            srv, _ = fmt_delta(old.get("server_p50"), res["server_p50"], args.threshold)
            print(f"    srv {srv}")
        print(f"    size {fmt_bytes(old.get('bytes'), res['bytes'])}")
        any_regression |= reg50

    if not args.no_save:
        HISTORY_FILE.parent.mkdir(exist_ok=True)
        with HISTORY_FILE.open("a") as f:
            f.write(json.dumps(run) + "\n")
        print(
            f"\nSaved to {HISTORY_FILE.relative_to(Path.cwd()) if HISTORY_FILE.is_relative_to(Path.cwd()) else HISTORY_FILE}"
        )

    if any_regression:
        print(f"\n⚠️  p50 regression above {args.threshold:.0f}% detected.")
        return 1 if args.fail else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
