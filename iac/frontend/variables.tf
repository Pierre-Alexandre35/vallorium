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

variable "custom_domains" {
  description = "Custom domain names to connect to the Hosting site (without https://)"
  type        = set(string)
  default     = []
}
