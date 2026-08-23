terraform {
  required_version = ">= 1.6"

  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.40"
    }
  }
}

provider "google-beta" {
  project = var.project
  region  = var.region
}

# Adds Firebase services to the existing Google Cloud project.
# This does not create a second GCP project.
resource "google_firebase_project" "frontend" {
  provider = google-beta
  project  = var.project
}

# Use the project ID as the default Hosting site ID.
resource "google_firebase_hosting_site" "frontend" {
  provider = google-beta
  project  = var.project
  site_id  = var.site_id

  depends_on = [google_firebase_project.frontend]
}
