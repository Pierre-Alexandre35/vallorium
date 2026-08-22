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

variable "frontend_bucket" {
  description = "Existing Cloud Storage bucket used to host the frontend"
  type        = string
}

variable "apis" {
  description = "Google APIs required by the GitHub Workload Identity Federation setup"
  type        = set(string)
  default = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "storage.googleapis.com",
  ]
}
