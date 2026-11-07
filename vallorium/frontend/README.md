# Travian frontend starter

A React + TypeScript + Vite starter using:

- React Router with `createBrowserRouter`
- Material UI for styling
- Axios for API calls
- a feature-first folder structure

## Install

```bash
npm install
npm run dev
```

## API routing

Axios reads `VITE_API_BASE_URL`, falling back to `/api/v1`.

| Environment    | API base URL                   | Configuration                                    |
| -------------- | ------------------------------ | ------------------------------------------------ |
| Local Vite     | `http://localhost:8080/api/v1` | `.env.development`                               |
| Docker Compose | `http://localhost:8080/api/v1` | Frontend service environment                     |
| Production     | `/api/v1`                      | Frontend deployment workflow and client fallback |

Locally, the browser calls the backend directly on port `8080`. The backend
already allows credentialed requests from `http://localhost:5173`. Use
`localhost` consistently when testing session cookies, rather than mixing it
with `127.0.0.1`.

To use another backend with host Vite, create `.env.development.local` and restart
Vite:

```bash
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

With Docker Compose, set `VITE_API_BASE_URL` in the shell or Compose's `.env` file.
The service environment takes precedence over Vite env files. Recreate the
frontend after changing it:

```bash
docker compose up -d --no-deps --force-recreate frontend
```

The local source is mounted, so these changes do not require an image rebuild.
`localhost` in this setting refers to the browser's machine, not a container.
Compose explicitly uses HTTP session cookies for local development.

Production builds set `VITE_API_BASE_URL=/api/v1`; Firebase Hosting forwards
`/api/**` to Cloud Run. Normal production builds do not load `.env.development`.
Vite embeds env values at build time, so production URL changes require a build.

`src/vite-env.d.ts` declares TypeScript types only. It does not set env values.
Login and signup post JSON to `/auth/login` and `/auth/signup` under the base URL.

Run `npm run test:api-config` to check local and production routing, plus signup
request URLs, JSON, and cookie credentials using a mocked Fetch transport.

## Project structure

```text
src/
├── app/
│   ├── providers.tsx
│   └── router.tsx
├── components/
│   └── layouts/
│       └── app-shell.tsx
├── features/
│   └── auth/
│       ├── api/
│       │   └── login.ts
│       ├── components/
│       │   └── login-form.tsx
│       ├── hooks/
│       │   └── use-login-form.ts
│       ├── pages/
│       │   └── login-page.tsx
│       └── types/
│           └── auth.ts
├── lib/
│   ├── api.ts
│   └── storage.ts
├── theme/
│   └── index.ts
├── main.tsx
└── vite-env.d.ts
```
