terraform {
  required_version = ">= 1.6"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.40"
    }
  }
}

provider "google" {
  project = var.project
  region  = var.region
}

module "api" {
  source = "./modules/cloud_run"

  project       = var.project
  region        = var.region
  service_name  = var.service_name
  repository_id = var.repository_id
  image_name    = var.image_name
  image_tag     = var.image_tag

  min_instances = var.min_instances
  max_instances = var.max_instances
  allow_unauth  = var.allow_unauth

  runtime_service_account_email = var.runtime_service_account_email
  database_url_secret_id        = var.database_url_secret_id

  vpc_network    = google_compute_network.backend.name
  vpc_subnetwork = google_compute_subnetwork.backend.name
  redis_url      = "redis://${google_redis_instance.backend.host}:${google_redis_instance.backend.port}/0"
}

output "api_endpoint" {
  description = "Native Cloud Run URL. The frontend should normally call /api through Firebase Hosting instead."
  value       = module.api.endpoint
}

output "api_service_name" {
  description = "Stable Cloud Run service name used by the Firebase Hosting rewrite"
  value       = module.api.service_name
}
