import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));

async function withClient(mode, baseURL, check) {
  const previous = process.env.VITE_API_BASE_URL;
  if (baseURL === undefined) {
    delete process.env.VITE_API_BASE_URL;
  } else {
    process.env.VITE_API_BASE_URL = baseURL;
  }

  let server;
  try {
    server = await createServer({
      root,
      mode,
      server: { middlewareMode: true, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    const { api } = await server.ssrLoadModule("/src/api/client.ts");
    await check(api);
  } finally {
    await server?.close();
    if (previous === undefined) {
      delete process.env.VITE_API_BASE_URL;
    } else {
      process.env.VITE_API_BASE_URL = previous;
    }
  }
}

test("development calls the backend directly", async () => {
  await withClient("development", undefined, (api) => {
    assert.equal(
      api.getUri({ url: "/auth/signup" }),
      "http://localhost:8080/api/v1/auth/signup",
    );
    assert.equal(api.defaults.withCredentials, true);
  });
});

test("production uses the same-origin Firebase API path", async () => {
  await withClient("production", undefined, (api) => {
    assert.equal(api.getUri({ url: "/auth/signup" }), "/api/v1/auth/signup");
    assert.equal(api.defaults.withCredentials, true);
  });
});

test("an environment override creates a credentialed signup request", async () => {
  let request;
  let body;
  const baseURL = "http://localhost:8081/api/v1";
  const payload = { email: "signup@example.com" };
  await withClient("development", baseURL, async (api) => {
    await assert.rejects(
      api.post("/auth/signup", payload, {
        adapter: "fetch",
        headers: { "Idempotency-Key": "signup-test" },
        env: {
          fetch: async (outgoing) => {
            request = outgoing;
            body = await outgoing.json();
            return new Response(JSON.stringify({ detail: "Invalid signup" }), {
              status: 422,
              headers: { "Content-Type": "application/json" },
            });
          },
        },
      }),
      (error) => {
        assert.equal(error.response.status, 422);
        assert.equal(error.response.data.detail, "Invalid signup");
        return true;
      },
    );
    assert.equal(request.url, `${baseURL}/auth/signup`);
    assert.equal(request.method, "POST");
    assert.equal(request.credentials, "include");
    assert.equal(request.headers.get("Idempotency-Key"), "signup-test");
    assert.equal(request.headers.get("Content-Type"), "application/json");
    assert.deepEqual(body, payload);
  });
});
