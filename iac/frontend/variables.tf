variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "europe-west9"
}

variable "site_id" {
  description = "Globally unique Firebase Hosting site ID"
  type        = string
}
