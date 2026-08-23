variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "europe-west9"
}

variable "github_repository" {
  description = "GitHub repository allowed to authenticate through Workload Identity Federation"
  type        = string
}

variable "terraform_state_bucket" {
  description = "Existing GCS bucket used only for Terraform remote state"
  type        = string
  default     = "travian-prod-1234-tfstate"
}

variable "backend_repository_id" {
  description = "Artifact Registry repository used by the backend CI pipeline"
  type        = string
  default     = "api"
}

variable "backend_runtime_service_account_id" {
  description = "Service account ID used by Cloud Run at runtime"
  type        = string
  default     = "vallorium-backend-runtime"
}

variable "database_url_secret_id" {
  description = "Secret Manager secret ID containing the production DATABASE_URL"
  type        = string
  default     = "vallorium-database-url"
}

variable "apis" {
  description = "Google APIs required by Terraform, GitHub WIF, Firebase Hosting, Artifact Registry, Secret Manager, Cloud Run, VPC networking, and Memorystore"
  type        = set(string)

  default = [
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "redis.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
    "sts.googleapis.com",
  ]
}
