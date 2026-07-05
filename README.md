# Vallorium (Inspired by Travian)

**Vallorium** is a persistent, browser-based multiplayer strategy game inspired by [Travian](https://www.travian.com/).

<p align="center">
  <a href="https://vallorium.com/">
    <img src="docs/img/vallorium_gameplay_2.png" alt="Vallorium Gameplay" width="60%" />
  </a>
</p>

### 🌐 [Play Now at vallorium.com »](https://vallorium.com/)

Each player selects a tribe (Romans, Gauls, or Teutons) and starts with a single village.  
A village includes 16 resource fields of four types: **corn, iron, wood**, and **clay**. These fields can be upgraded at a cost to increase their production. The village center allows players to build, upgrade, or demolish structures as their economy and strategy evolve.

A major part of the game is expansion:  
You can either **conquer** other players’ villages or **found** new ones on unclaimed land.  
To conquer, you'll need to raise an army—each tribe has its own unique units and strengths.

---

## 🗄️ Running

⚠️ **Docker** and **Docker Compose** are required.

```
cd vallorium
docker compose run migrate # to run only once
docker compose up
```

This script will:

- **Create and populate master tables**  
  Static tables that never change (e.g., lookup/reference data).

- **Create transaction tables**  
  Dynamic tables such as users or villages.

- **Insert dummy data**  
  Seed the transaction tables with sample records.

---

Default API Credentials

- **Email:** `admin@example.com`
- **Password:** `admin123`

---

API Documentation

You can explore and test the API via Swagger UI:

`http://localhost:8080/api/docs`

---

Default PSQL Credentials (locally)

- **Host:** `localhost`
- **Post:** `5432`
- **Username:** `pierre`
- **Password:** `password`
- **Database:** `pierre`

---

Add, modify or remove a model (PSQL tables)

We are using Alembic, a lightweight tool for database migration, so all changes in our PSQL tables must be done via Alembic and never direct `ALTER TABLE` on PSQL.

1. Update, Add or Modify your table on the `backend/app/db/models.py`
2. Create Alembic migration using `docker-compose run --rm backend alembic revision --autogenerate -m "Add XXXX model"`
3. Once the migration file is created, apply it: `docker-compose run --rm backend alembic upgrade head`

You should see on your terminal and on the migrations folder a new version.

## 🛠️ Technologies

- **Backend**: FastAPI
- **Frontend**: Vue 3
- **Database**: PostgreSQL (with plans to add **PostGIS** for geospatial support)
- **Infrastructure as Code**: Terraform

I chose **FastAPI** because it's the backend framework I'm most familiar with.  
The project structure is based on the [Buutu FastAPI-React cookiecutter template](https://github.com/Buuntu/fastapi-react).

Since many mechanics are based on distance and location (e.g., villages, resource fields), I plan to integrate **PostGIS** in the future to better support geospatial features.

Though I’m not a frontend expert, I chose **Vue 3** for its approachability—even if its community is smaller compared to React.

---

## ☁️ Hosting

The project is deployed on **Google Cloud Platform**:

- The frontend (Vue 3 app) is hosted via a **GCS bucket** (static hosting)
- The backend (FastAPI API) runs on **Cloud Run** or **Compute Engine**
- The **PostgreSQL** database is also hosted on **Compute Engine**

---

## ☁️ Backend structure

```
.
├── alembic.ini
├── app
│ ├── **init**.py
│ ├── alembic
│ │ ├── **init**.py
│ │ ├── env.py
│ │ ├── README
│ │ ├── script.py.mako
│ │ └── versions
│ │ ├── 04cee76d7b4d_init_schema.py
│ ├── alembic.ini
│ ├── api
│ │ ├── **init**.py
│ │ ├── api_v1
│ │ │ ├── **init**.py
│ │ │ └── routers
│ │ │ ├── **init**.py
│ │ │ ├── auth.py
│ │ │ ├── health.py
│ │ │ ├── ressources.py
│ │ │ ├── tests
│ │ │ │ ├── **init**.py
│ │ │ │ ├── test_auth.py
│ │ │ │ └── test_users.py
│ │ │ ├── tribes.py
│ │ │ ├── users.py
│ │ │ └── village.py
│ │ └── dependencies
│ │ └── **init**.py
│ ├── core
│ │ ├── **init**.py
│ │ ├── auth.py
│ │ ├── celery_app.py
│ │ ├── config.py
│ │ ├── crypto.py
│ │ └── security.py
│ ├── db
│ │ ├── **init**.py
│ │ ├── models.py
│ │ └── session.py
│ ├── main.py
│ ├── repositories
│ │ ├── **init**.py
│ │ ├── building_repo.py
│ │ ├── resource_repo.py
│ │ ├── user_repo.py
│ │ └── village_repo.py
│ ├── sample_data.py
│ ├── schemas
│ │ ├── **init**.py
│ │ ├── auth.py
│ │ ├── base.py
│ │ ├── building.py
│ │ ├── map.py
│ │ ├── resource.py
│ │ ├── tribe.py
│ │ ├── user.py
│ │ └── village.py
│ ├── seed.py
│ ├── services
│ │ ├── resource_service.py
│ │ ├── user_service.py
│ │ └── village_service.py
│ ├── tasks.py
│ └── tests
│ ├── **init**.py
│ ├── test_main.py
│ └── test_tasks.py
├── cloudbuild-migrate.yaml
├── conftest.py
├── Dockerfile
├── Dockerfile.migrate
├── poetry.lock
├── pyproject.toml
├── requirements-migrate.txt
└── requirements.txt
```

## 🤝 Contributions

I'm currently working on this project solo, and I’d love to collaborate—especially on the frontend.  
The frontend is still in its early stages, so we can decide together whether to stick with **Vue** or switch to **React**.

Feel free to open an issue or submit a pull request if you're interested!

---

backend
GET: query parameters
POST: request body

## 🛠️ Bugs / Design Questions

- Not every tiles have a layout and they should (curl -X 'POST' \
  'http://localhost:8080/api/villages' )

```
404:
{
  "detail": "No resource layout found for map tile 7."
}
```

- Recalculate user ressources using a middleware?

gcloud auth application-default login

TODO:

1. Add a cloudbuild.yaml
   At the repo root, create a cloudbuild.yaml:

yaml
Copy
Edit
steps:

# 1) Build & push to Artifact Registry (AMD64)

- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'build'
  - '--platform=linux/amd64'
  - '-t'
  - 'europe-west9-docker.pkg.dev/${PROJECT}/backend-repo/backend:$SHORT_SHA'
  - './backend'
- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'push'
  - 'europe-west9-docker.pkg.dev/${PROJECT}/backend-repo/backend:$SHORT_SHA'

# 2) Deploy to Cloud Run

- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: 'bash'
  args: - '-c' - |
  gcloud run deploy ${SERVICE} \
        --image=europe-west9-docker.pkg.dev/${PROJECT}/backend-repo/backend:$SHORT_SHA \
        --region=${REGION} \
   --platform=managed \
   --allow-unauthenticated \
   --set-env-vars DATABASE_URL=${DATABASE_URL}
  substitutions:
  \_SERVICE: backend-service
  \_REGION: europe-west9
  \_DATABASE_URL: postgresql://pierre:password@34.163.113.47:5432/pierre?sslmode=require
  images:
  - 'europe-west9-docker.pkg.dev/${PROJECT}/backend-repo/backend:$SHORT_SHA'

2. Define a Cloud Build trigger in Terraform
   Add a new module or resource in your iac/:

hcl
Copy
Edit
resource "google_cloudbuild_trigger" "backend" {
project = var.project
name = "backend-deploy-trigger"

github {
owner = "YOUR_GITHUB_ORG"
name = "YOUR_REPO_NAME"
push {
branch = "main"
}
}

filename = "cloudbuild.yaml"
}

docker build --platform linux/amd64 -t europe-west9-docker.pkg.dev/vallorium-core-prod/backend-repo/backend:latest vallorium/backend/
gcloud auth configure-docker europe-west9-docker.pkg.dev \
 --project=vallorium-core-prod
docker push europe-west9-docker.pkg.dev/vallorium-core-prod/backend-repo/backend:latest
