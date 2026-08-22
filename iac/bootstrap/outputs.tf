output "github_workload_identity_provider" {
  description = "Set this as the GitHub repository variable GCP_WIF_PROVIDER"
  value       = module.github_wif.github_provider_resource
}

output "github_frontend_service_account" {
  description = "Set this as the GitHub repository variable GCP_FRONTEND_SERVICE_ACCOUNT"
  value       = google_service_account.frontend_deployer.email
}

output "frontend_bucket" {
  description = "Frontend deployment bucket"
  value       = var.frontend_bucket
}
