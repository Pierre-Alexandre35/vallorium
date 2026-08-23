resource "google_service_account" "frontend_deployer" {
  project      = var.project
  account_id   = "github-frontend-deployer"
  display_name = "GitHub Frontend Deployer"
}

resource "google_service_account_iam_member" "github_can_impersonate_frontend_deployer" {
  service_account_id = google_service_account.frontend_deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${module.github_wif.github_pool_name}/attribute.repository/${var.github_repository}"
}

# Firebase Hosting uses project-level IAM roles. Keep the deployer limited to
# Hosting deployment and service usage instead of broad project roles.
resource "google_project_iam_member" "frontend_deployer" {
  for_each = toset([
    "roles/firebasehosting.admin",
    "roles/run.viewer",
    "roles/serviceusage.serviceUsageConsumer",
  ])

  project = var.project
  role    = each.value
  member  = "serviceAccount:${google_service_account.frontend_deployer.email}"
}
