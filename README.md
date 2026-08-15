# Vallorium

**Vallorium** is a persistent, browser-based multiplayer strategy game inspired by [Travian](https://www.travian.com/).

<p align="center">
  <a href="https://vallorium.com/">
    <img src="docs/img/vallorium_gameplay_2.png" alt="Vallorium Gameplay" width="60%" />
  </a>
</p>

### 🌐 [Play Vallorium »](https://vallorium.com/)

Each player selects a tribe — **Romans, Gauls, or Teutons** — and starts with a single village.

A village contains 16 resource fields producing four resources:

* 🌾 Corn
* ⛓️ Iron
* 🪵 Wood
* 🧱 Clay

Resource fields can be upgraded to increase production. Players can also build, upgrade, and demolish structures in their village as their economy and strategy evolve.

Expansion is a major part of the game. Players can:

* Found new villages on unclaimed land
* Build armies with tribe-specific units
* Attack other players
* Conquer enemy villages

---

## 🗄️ Local Development

### Requirements

Make sure you have:

* Docker
* Docker Compose

From the repository:

```bash
cd vallorium
```

Run the initial database migration:

```bash
docker compose run migrate
```

Then start the application:

```bash
docker compose up
```

The initialization process creates the database schema and populates the required reference data.

---

## 🔐 Default Local Credentials

### Application

* **Email:** `admin@example.com`
* **Password:** `admin123`

### PostgreSQL

* **Host:** `localhost`
* **Port:** `5432`
* **Username:** `pierre`
* **Password:** `password`
* **Database:** `pierre`

---

## 📚 API Documentation

When the backend is running locally, Swagger UI is available at:

```text
http://localhost:8080/api/docs
```

---

# 🗃️ Database Migrations

Vallorium uses **Alembic** to manage PostgreSQL schema migrations.

Database schema changes should always be made through Alembic. Avoid modifying production tables directly with commands such as `ALTER TABLE`.

## Creating a migration

First, modify the SQLAlchemy models:

```text
vallorium/backend/app/db/models.py
```

Then generate an Alembic migration.

### Using Docker

From the `vallorium/` directory:

```bash
docker compose run --rm backend \
  alembic revision --autogenerate -m "add tribe metadata"
```

Review the generated migration file before applying it.

Then apply the migration:

```bash
docker compose run --rm backend \
  alembic upgrade head
```

---

## Running Alembic directly with Poetry

When working directly inside the backend environment:

```bash
cd vallorium/backend
```

```bash
poetry run alembic revision \
  --autogenerate \
  -m "add tribe metadata and advantages"
```

Apply all pending migrations:

```bash
poetry run alembic upgrade head
```

Check the currently applied migration:

```bash
poetry run alembic current
```

Check the latest available migration:

```bash
poetry run alembic heads
```

Seed the database:

```bash
poetry run python -m app.seed
```

---

## Typical Database Migration Workflow

```text
Modify SQLAlchemy model
        ↓
Generate Alembic migration
        ↓
Review migration file
        ↓
Apply migration locally
        ↓
Run tests
        ↓
Commit migration with the code change
        ↓
Deploy
        ↓
Apply migration in production
```

Migration files should always be committed to Git together with the code that depends on them.

---

# 🚀 Releases

Vallorium uses the following Git workflow:

```text
development
     ↓
    dev
     ↓
Pull Request
 dev → main
     ↓
    main
     ↓
 Git tag
     ↓
GitHub Release
```

## 1. Push changes to `dev`

After completing and testing a change:

```bash
git checkout dev
git pull origin dev
```

Stage the changes:

```bash
git add .
```

Review what will be committed:

```bash
git status
git diff --staged
```

Commit:

```bash
git commit -m "feat: describe the change"
```

Push:

```bash
git push origin dev
```

---

## 2. Create the release Pull Request

Create a Pull Request on GitHub:

```text
dev → main
```

For a release, use a title such as:

```text
Release v0.5.0
```

Make sure all CI checks pass before merging the Pull Request.

---

## 3. Merge into `main`

Once the release PR has been merged:

```bash
git checkout main
git pull origin main
```

The local `main` branch should now contain the release commit.

---

## 4. Create the Git tag

Create a version tag from `main`:

```bash
git tag v0.5.0
```

Push the tag to GitHub:

```bash
git push origin v0.5.0
```

You can verify the tag with:

```bash
git show v0.5.0 --no-patch --oneline
```

---

## 5. Generate GitHub Release Notes

Vallorium uses the GitHub CLI to generate release notes automatically from the changes included in the release.

Authenticate the GitHub CLI if necessary:

```bash
gh auth login
```

Then create the GitHub release:

```bash
gh release create v0.5.0 \
  --generate-notes \
  --title "v0.5.0"
```

For example, the `v0.4.0` release was created with:

```bash
gh release create v0.4.0 \
  --generate-notes \
  --title "v0.4.0"
```

The complete release workflow is therefore:

```bash
# After the dev → main PR has been merged

git checkout main
git pull origin main

git tag v0.5.0
git push origin v0.5.0

gh release create v0.5.0 \
  --generate-notes \
  --title "v0.5.0"
```

> Do not create the release tag before the `dev → main` Pull Request has been merged.
> The version tag should point to the release commit on `main`.

---

# 🛠️ Technologies

* **Backend:** FastAPI
* **Frontend:** Vue 3
* **Database:** PostgreSQL
* **Database migrations:** Alembic
* **Infrastructure as Code:** Terraform
* **Cloud:** Google Cloud Platform
* **Containers:** Docker / Docker Compose

FastAPI is used for the backend API and PostgreSQL for persistent game data.

Many Vallorium mechanics depend on distance and location — villages, map tiles, resource fields, and future expansion mechanics — so **PostGIS** may be introduced for more advanced geospatial functionality.

---

# ☁️ Hosting

Vallorium is deployed on **Google Cloud Platform**.

The infrastructure includes:

* **Frontend:** static hosting using Google Cloud Storage
* **Backend:** FastAPI deployed on Google Cloud
* **Database:** PostgreSQL
* **Container images:** Google Artifact Registry
* **Infrastructure:** Terraform
* **CI/CD:** Google Cloud Build / GitHub

---

# 📁 Project Structure

```text
📁 Project Structure

.
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── cloudbuild.yaml                 # CI/CD pipeline
│
├── docs/
│   └── img/                        # Documentation assets
│
├── iac/                            # Terraform infrastructure
│   ├── bootstrap/                  # Initial GCP / CI setup
│   ├── envs/                       # Environment configuration
│   └── modules/
│       ├── apis/
│       ├── cloud_run/
│       └── github_wif/
│
└── vallorium/                      # Application
    ├── docker-compose.yml          # Local development stack
    │
    ├── backend/                    # FastAPI backend
    │   ├── Dockerfile
    │   ├── alembic.ini             # Alembic configuration
    │   └── app/
    │       ├── common/             # Shared schemas and utilities
    │       ├── config/             # Application settings
    │       ├── core/               # Authentication and core services
    │       │
    │       ├── db/                 # Persistence layer
    │       │   ├── migrations/     # Alembic migrations
    │       │   ├── models.py       # SQLAlchemy models
    │       │   └── session.py      # Database sessions
    │       │
    │       ├── domains/            # Domain-oriented application logic
    │       │   ├── auth/
    │       │   ├── tribes/
    │       │   └── villages/
    │       │
    │       ├── game/               # Shared game rules and mechanics
    │       ├── tests/              # Backend tests
    │       ├── utils/              # General helpers
    │       ├── main.py             # FastAPI entrypoint
    │       └── seed.py             # Reference/world seed data
    │
    ├── frontend/                   # React frontend
    │   ├── Dockerfile
    │   └── src/
    │       ├── app/                # App providers and router
    │       ├── components/         # Shared UI and layouts
    │       │
    │       ├── features/           # Feature-oriented application code
    │       │   ├── auth/
    │       │   ├── villages/
    │       │   └── world-map/
    │       │
    │       ├── lib/                # API and shared client utilities
    │       ├── routes/             # Route guards
    │       ├── theme/              # MUI theme and design tokens
    │       └── main.tsx            # React entrypoint
    │
    └── nginx/
        └── nginx.conf              # Reverse proxy configuration
```

---

# 🤝 Contributing

Vallorium is currently primarily developed as a solo project, but contributions are welcome.

If you'd like to contribute:

1. Open an issue describing the change or bug.
2. Create a branch for your work.
3. Make and test your changes.
4. Submit a Pull Request.

Frontend contributions are particularly welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for additional contribution guidelines.

---

# 🐛 Development Notes

Useful API conventions:

```text
GET  → query parameters
POST → request body
```

For Google Cloud local authentication:

```bash
gcloud auth application-default login
```

For Artifact Registry authentication:

```bash
gcloud auth configure-docker europe-west9-docker.pkg.dev \
  --project=vallorium-core-prod
```
