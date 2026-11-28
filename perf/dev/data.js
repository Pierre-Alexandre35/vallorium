window.BENCHMARK_DATA = {
  "lastUpdate": 1795887441833,
  "repoUrl": "https://github.com/Pierre-Alexandre35/vallorium",
  "entries": {
    "API latency (dev)": [
      {
        "commit": {
          "author": {
            "email": "46579114+Pierre-Alexandre35@users.noreply.github.com",
            "name": "Pierre-Alexandre35",
            "username": "Pierre-Alexandre35"
          },
          "committer": {
            "email": "46579114+Pierre-Alexandre35@users.noreply.github.com",
            "name": "Pierre-Alexandre35",
            "username": "Pierre-Alexandre35"
          },
          "distinct": true,
          "id": "3e595e8a6a09579ec819416f247914b56c8ee2ea",
          "message": "ci(perf): create gh-pages without switching branches\n\ngit switch - fails on the Actions checkout (no previous branch in the\nreflog). Push an empty root commit built with commit-tree instead, which\nleaves the working tree untouched.",
          "timestamp": "2026-11-28T18:31:04+01:00",
          "tree_id": "58f04bb6e80acccff6f8cfb3bf606cb18a87922a",
          "url": "https://github.com/Pierre-Alexandre35/vallorium/commit/3e595e8a6a09579ec819416f247914b56c8ee2ea"
        },
        "date": 1795887441280,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "GET /auth/me",
            "value": 2.248,
            "unit": "ms"
          },
          {
            "name": "GET /dashboard/current",
            "value": 5.331,
            "unit": "ms"
          },
          {
            "name": "GET /tribes",
            "value": 3.535,
            "unit": "ms"
          },
          {
            "name": "GET /users/me",
            "value": 3.935,
            "unit": "ms"
          },
          {
            "name": "GET /villages/",
            "value": 6.195,
            "unit": "ms"
          },
          {
            "name": "GET /villages/name/{village_name}",
            "value": 6.19,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}",
            "value": 6.135,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/farms",
            "value": 7.031,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/production",
            "value": 5.061,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/resources",
            "value": 5.414,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}