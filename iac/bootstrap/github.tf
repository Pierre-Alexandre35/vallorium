resource "github_actions_variable" "wif_provider" {
  repository    = "vallorium"
  variable_name = "GCP_WIF_PROVIDER"
  value         = module.github_wif.github_provider_resource
}

resource "github_actions_variable" "frontend_sa" {
  repository    = "vallorium"
  variable_name = "GCP_FRONTEND_SERVICE_ACCOUNT"
  value         = google_service_account.frontend_deployer.email
}

resource "github_actions_variable" "backend_sa" {
  repository    = "vallorium"
  variable_name = "GCP_BACKEND_SERVICE_ACCOUNT"
  value         = google_service_account.backend_deployer.email
}
