# Vallorium infrastructure

Terraform is split by responsibility:

- `bootstrap/`: shared project setup: APIs, GitHub WIF, frontend/backend CI identities, Artifact Registry, Cloud Run runtime identity, and Secret Manager containers.
- `frontend/`: Firebase project enablement and Firebase Hosting site.
- root stack + `modules/cloud_run/`: backend VPC, Memorystore Redis, and Cloud Run service revision from an already-built Artifact Registry image.

The Terraform state bucket `vallorium-online-prod-01-tfstate` is a prerequisite and is intentionally not managed by the stacks that store state inside it.

## 1. Apply the updated bootstrap stack

The bootstrap stack keeps the existing frontend/backend identities and adds the APIs and backend CI permissions needed to provision networking and Memorystore:

- Compute Engine API;
- Memorystore for Redis API;
- `roles/compute.networkAdmin` for `github-backend-deployer`;
- `roles/redis.admin` for `github-backend-deployer`.

`DATABASE_URL` remains in Secret Manager. Redis no longer needs a Secret Manager URL because the root Terraform stack creates Memorystore and builds `REDIS_URL` from its private endpoint.

Because an earlier bootstrap version created `vallorium-redis-url`, the next bootstrap plan should remove that unused secret and its runtime IAM binding. Review the plan before applying.

Run:

```bash
cd iac/bootstrap
terraform init -reconfigure
terraform plan -var-file=../envs/prod.bootstrap.tfvars
terraform apply -var-file=../envs/prod.bootstrap.tfvars
terraform output
```

Keep these GitHub Repository Variables:

```text
GCP_WIF_PROVIDER
GCP_FRONTEND_SERVICE_ACCOUNT
GCP_BACKEND_SERVICE_ACCOUNT
```

## 2. Production database secret

Terraform creates the `vallorium-database-url` Secret Manager container but deliberately does not put its secret value in Terraform state.

Add at least one enabled version before the first Cloud Run deployment:

```bash
printf '%s' "$DATABASE_URL" | \
  gcloud secrets versions add vallorium-database-url --data-file=- \
  --project=vallorium-online-prod-01
```

Do not commit the database URL to `prod.tfvars`.

## 3. Memorystore Redis and networking

The root backend stack now creates:

```text
vallorium-backend VPC
  -> vallorium-backend-europe-west9 subnet (10.20.0.0/24)
  -> Memorystore Redis (BASIC, 1 GiB)

Cloud Run api
  -> Direct VPC egress (PRIVATE_RANGES_ONLY)
  -> REDIS_URL=redis://<private-memorystore-ip>:6379/0
```

No Serverless VPC Access connector and no manually managed production Redis URL are required.

`BASIC` Memorystore is appropriate for development/early production but is not highly available. Change `redis_tier` to `STANDARD_HA` when HA is required.

## 4. Backend source must read `REDIS_URL`

The backend Redis client and Celery broker must read the `REDIS_URL` environment variable instead of the Docker Compose hostname `redis://redis:6379/0`.

`DATABASE_URL` should continue to come from the environment/Secret Manager.

For production HTTPS, make the session cookie `secure=True` or environment-driven rather than localhost-only.

## 5. Install the backend GitHub Actions workflow

Copy:

```text
iac/examples/deploy-backend.yml
```

to:

```text
.github/workflows/deploy-backend.yml
```

The workflow authenticates with WIF, builds the backend container, pushes the immutable `${GITHUB_SHA}` tag to Artifact Registry, then runs Terraform plan/apply against the backend state.

The first root-stack deployment can take several minutes because Memorystore must be provisioned before Cloud Run receives its private Redis endpoint.

## 6. Backend Terraform state

The root backend stack uses:

```hcl
bucket = "vallorium-online-prod-01-state"
prefix = "tfstate/backend"
```

from `envs/prod.backend.hcl`.

## 7. Route Firebase `/api/**` to Cloud Run

After Cloud Run service `api` exists, copy:

```text
iac/examples/firebase.json
```

to:

```text
vallorium/frontend/firebase.json
```

The rewrite order is important:

```text
/api/** -> Cloud Run service api
**      -> /index.html
```

The frontend can then use relative API calls such as:

```text
/api/v1/auth/login
/api/v1/villages
```

instead of embedding the generated `*.run.app` URL in the Vite build.

## Custom domain: vallorium.online

The frontend stack manages the domain association using `custom_domains` in
`envs/prod.frontend.tfvars`. DNS records remain with your authoritative DNS provider.

From the repository root:

```bash
terraform -chdir=iac/frontend init -reconfigure
terraform -chdir=iac/frontend plan -var-file=../envs/prod.frontend.tfvars
terraform -chdir=iac/frontend apply -var-file=../envs/prod.frontend.tfvars
terraform -chdir=iac/frontend output -json hosting_custom_domains
```

Apply the DNS changes returned under `required_dns_updates` at your DNS provider,
respecting each record's `required_action`. Firebase Hosting's custom domain panel
also displays the required records and verification progress. Keep the ownership
TXT record after verification, and preserve unrelated records such as email MX records.

Terraform does not wait for DNS verification, so a successful apply means the domain
association was created, not that HTTPS is ready. Firebase provisions the certificate
after verification; this can take up to 24 hours after DNS points to Hosting.
No `firebase.json` or application deployment changes are required for the domain.
This configuration connects only `vallorium.online`, not `www.vallorium.online`.

## 8. Recommended deployment order

```text
bootstrap plan/apply
  -> frontend Terraform plan/apply (Hosting site and custom domain)
  -> confirm DATABASE_URL Secret Manager version exists
  -> update backend code to read REDIS_URL
  -> commit deploy-backend.yml + Terraform changes
  -> run backend CI
  -> Terraform creates VPC + subnet + Memorystore + Cloud Run api
  -> update frontend firebase.json with /api/** rewrite
  -> deploy frontend again
```

Database migrations are intentionally not run automatically by this workflow yet. Add a dedicated migration step/job once the production migration strategy is decided.
