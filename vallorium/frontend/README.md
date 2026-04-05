# Travian frontend starter

A React + TypeScript + Vite starter using:

- React Router with `createBrowserRouter`
- Material UI for styling
- Axios for API calls
- a feature-first folder structure

## Install

```bash
npm install
cp .env.example .env
npm run dev
```

## API expectation

The login form posts to `/token` as `application/x-www-form-urlencoded`, which matches FastAPI's `OAuth2PasswordRequestForm`.

Example `.env`:

```bash
VITE_API_URL=http://localhost:8000
```

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
