locals {
  backend_deployer_member = "serviceAccount:${google_service_account.backend_deployer.email}"
  backend_runtime_member  = "serviceAccount:${google_service_account.backend_runtime.email}"

  # Only actual credentials belong in Secret Manager. Memorystore uses a private
  # VPC endpoint, so REDIS_URL is assembled by the backend Terraform stack.
  backend_secrets = {
    database_url = var.database_url_secret_id
  }
}

resource "google_service_account" "backend_deployer" {
  project      = var.project
  account_id   = "github-backend-deployer"
  display_name = "GitHub Backend Deployer"

  depends_on = [module.apis]
}

resource "google_service_account" "backend_runtime" {
  project      = var.project
  account_id   = var.backend_runtime_service_account_id
  display_name = "Vallorium Backend Runtime"

  depends_on = [module.apis]
}

resource "google_service_account_iam_member" "github_can_impersonate_backend_deployer" {
  service_account_id = google_service_account.backend_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${module.github_wif.github_pool_name}/attribute.repository/${var.github_repository}"
}

# Terraform needs to create/update the Cloud Run service and its IAM policy.
resource "google_project_iam_member" "backend_deployer_cloud_run_admin" {
  project = var.project
  role    = "roles/run.admin"
  member  = local.backend_deployer_member
}

resource "google_project_iam_member" "backend_deployer_service_usage" {
  project = var.project
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = local.backend_deployer_member
}

# The root backend stack owns its dedicated VPC/subnet and Memorystore instance.
resource "google_project_iam_member" "backend_deployer_compute_network_admin" {
  project = var.project
  role    = "roles/compute.networkAdmin"
  member  = local.backend_deployer_member
}

resource "google_project_iam_member" "backend_deployer_redis_admin" {
  project = var.project
  role    = "roles/redis.admin"
  member  = local.backend_deployer_member
}

# Cloud Run uses this runtime identity. The CI deployer may attach it to revisions,
# but does not receive the runtime identity's permissions itself.
resource "google_service_account_iam_member" "backend_deployer_can_use_runtime" {
  service_account_id = google_service_account.backend_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = local.backend_deployer_member
}

resource "google_artifact_registry_repository" "backend" {
  project       = var.project
  location      = var.region
  repository_id = var.backend_repository_id
  format        = "DOCKER"
  description   = "Docker images for the Vallorium backend"

  depends_on = [module.apis]
}

# GitHub Actions builds and pushes backend images directly to Artifact Registry.
resource "google_artifact_registry_repository_iam_member" "backend_deployer_writer" {
  project    = google_artifact_registry_repository.backend.project
  location   = google_artifact_registry_repository.backend.location
  repository = google_artifact_registry_repository.backend.repository_id
  role       = "roles/artifactregistry.writer"
  member     = local.backend_deployer_member
}

# The backend Terraform stack uses the shared GCS bucket for remote state.
resource "google_storage_bucket_iam_member" "backend_deployer_terraform_state" {
  bucket = var.terraform_state_bucket
  role   = "roles/storage.objectAdmin"
  member = local.backend_deployer_member
}

# Terraform creates only Secret Manager containers. Secret VALUES are added
# out-of-band so plaintext credentials never enter Git or Terraform state.
resource "google_secret_manager_secret" "backend" {
  for_each  = local.backend_secrets
  project   = var.project
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [module.apis]
}

resource "google_secret_manager_secret_iam_member" "backend_runtime_accessor" {
  for_each  = google_secret_manager_secret.backend
  project   = var.project
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = local.backend_runtime_member
}
