window.BENCHMARK_DATA = {
  "lastUpdate": 1795887616099,
  "repoUrl": "https://github.com/Pierre-Alexandre35/vallorium",
  "entries": {
    "API latency (main)": [
      {
        "commit": {
          "author": {
            "email": "46579114+Pierre-Alexandre35@users.noreply.github.com",
            "name": "Pierre-Alexandre Mousset",
            "username": "Pierre-Alexandre35"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "dbdb175abce4074d2fabc5521e89eb79bcac4376",
          "message": "Merge pull request #126 from Pierre-Alexandre35/dev\n\nfeat: displaying farm upgrade cost",
          "timestamp": "2026-11-28T18:38:50+01:00",
          "tree_id": "58f04bb6e80acccff6f8cfb3bf606cb18a87922a",
          "url": "https://github.com/Pierre-Alexandre35/vallorium/commit/dbdb175abce4074d2fabc5521e89eb79bcac4376"
        },
        "date": 1795887615323,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "GET /auth/me",
            "value": 2.369,
            "unit": "ms"
          },
          {
            "name": "GET /dashboard/current",
            "value": 5.421,
            "unit": "ms"
          },
          {
            "name": "GET /tribes",
            "value": 3.745,
            "unit": "ms"
          },
          {
            "name": "GET /users/me",
            "value": 4.232,
            "unit": "ms"
          },
          {
            "name": "GET /villages/",
            "value": 6.822,
            "unit": "ms"
          },
          {
            "name": "GET /villages/name/{village_name}",
            "value": 7.028,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}",
            "value": 6.958,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/farms",
            "value": 7.286,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/production",
            "value": 5.169,
            "unit": "ms"
          },
          {
            "name": "GET /villages/{village_id}/resources",
            "value": 5.533,
            "unit": "ms"
          }
        ]
      }
    ]
  }
}