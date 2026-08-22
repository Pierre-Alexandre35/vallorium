output "github_provider_resource" {
  description = "Full Workload Identity Provider resource name for google-github-actions/auth"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_pool_name" {
  description = "Full Workload Identity Pool resource name used in principalSet IAM bindings"
  value       = google_iam_workload_identity_pool.github.name
}
