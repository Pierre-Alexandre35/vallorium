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

# gcloud storage rsync needs object read/write/delete/list permissions and
# storage.buckets.get on the destination bucket. Keep the role scoped to the
# frontend bucket instead of granting project-wide Storage Admin.
resource "google_storage_bucket_iam_member" "frontend_deployer" {
  bucket = var.frontend_bucket
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.frontend_deployer.email}"
}
