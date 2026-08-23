output "github_workload_identity_provider" {
  description = "Set this as the GitHub repository variable GCP_WIF_PROVIDER"
  value       = module.github_wif.github_provider_resource
}

output "github_frontend_service_account" {
  description = "Set this as the GitHub repository variable GCP_FRONTEND_SERVICE_ACCOUNT"
  value       = google_service_account.frontend_deployer.email
}

output "github_backend_service_account" {
  description = "Set this as the GitHub repository variable GCP_BACKEND_SERVICE_ACCOUNT"
  value       = google_service_account.backend_deployer.email
}

output "backend_runtime_service_account" {
  description = "Cloud Run runtime service account"
  value       = google_service_account.backend_runtime.email
}

output "backend_artifact_repository" {
  description = "Artifact Registry repository used by backend CI"
  value       = google_artifact_registry_repository.backend.repository_id
}

output "backend_secret_ids" {
  description = "Secret Manager secret containers that must receive a secret version before the first backend deploy"
  value = {
    database_url = google_secret_manager_secret.backend["database_url"].secret_id
  }
}
