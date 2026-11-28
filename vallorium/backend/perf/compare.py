"""Compare latency results of a base branch and a PR, as a Markdown report.

Each side can have several result files (one per round, from perf/latency.py).
For each endpoint the fastest median across rounds is kept: noise on a shared
CI runner only ever adds time, so the minimum is the most stable estimate.

    python perf/compare.py --base base-*.json --head head-*.json --output report.md

With --json-output, the merged head results are also written in the
github-action-benchmark format, for the history chart.

Exits 0 unless --fail is given and an endpoint is slower than --alert.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

MARKER = "<!-- vallorium-perf-report -->"


def load(paths: list[Path]) -> dict[str, float]:
    best: dict[str, float] = {}
    for path in paths:
        for entry in json.loads(path.read_text()):
            name, value = entry["name"], float(entry["value"])
            best[name] = min(value, best.get(name, value))
    return best


def status(ratio: float, alert: float) -> str:
    if ratio >= alert:
        return "⚠️ slower"
    if ratio <= 1 / alert:
        return "🚀 faster"
    return ""


def build_report(
    base: dict[str, float], head: dict[str, float], alert: float, context: str
) -> tuple[str, list[str]]:
    lines = [
        MARKER,
        "### ⏱ API latency vs base branch",
        "",
        f"Server-side median per request, in-process, best of several rounds. "
        f"Flagged when at least {alert:g}× slower or faster. {context}".strip(),
        "",
    ]
    if not base:
        lines.append(
            "_Baseline unavailable (the base branch could not be measured with "
            "this harness). Head results only._"
        )
        lines.append("")

    lines += ["| Endpoint | Base | PR | Change | |", "|---|--:|--:|--:|---|"]
    regressions = []
    for name in sorted(base.keys() | head.keys()):
        old, new = base.get(name), head.get(name)
        if new is None:
            lines.append(f"| `{name}` | {old:.2f} ms | – | removed | |")
        elif old is None:
            lines.append(f"| `{name}` | – | {new:.2f} ms | new | |")
        else:
            ratio = new / old if old else 1.0
            flag = status(ratio, alert)
            if flag.startswith("⚠️"):
                regressions.append(name)
            lines.append(
                f"| `{name}` | {old:.2f} ms | {new:.2f} ms | {(ratio - 1) * 100:+.0f}% | {flag} |"
            )

    lines += [
        "",
        "<sub>Differences under ~10% are usually runner noise. Query counts and "
        "payload sizes are enforced separately by the performance budget tests.</sub>",
    ]
    return "\n".join(lines) + "\n", regressions


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--base", type=Path, nargs="*", default=[])
    parser.add_argument("--head", type=Path, nargs="+", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--alert", type=float, default=1.5, help="ratio that gets flagged"
    )
    parser.add_argument("--context", default="", help="extra text for the header")
    parser.add_argument("--fail", action="store_true", help="exit 1 on regression")
    parser.add_argument(
        "--json-output", type=Path, help="also write merged head results as JSON"
    )
    args = parser.parse_args()

    base = load([p for p in args.base if p.exists()])
    head = load(args.head)
    report, regressions = build_report(base, head, args.alert, args.context)
    args.output.write_text(report)
    if args.json_output:
        merged = [
            {"name": name, "unit": "ms", "value": value}
            for name, value in sorted(head.items())
        ]
        args.json_output.write_text(json.dumps(merged, indent=2) + "\n")
    print(report)

    if regressions and args.fail:
        print(f"Slower than {args.alert:g}×: {', '.join(regressions)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
