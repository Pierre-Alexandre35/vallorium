
resource "google_cloud_run_v2_job" "db_migrate" {
  project  = var.project
  name     = "vallorium-db-migrate"
  location = var.region

  deletion_protection = true

  template {
    task_count  = 1
    parallelism = 1

    template {
      timeout               = "600s"
      max_retries           = 0
      execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

      service_account = var.runtime_service_account_email

      # Same private VPC as the FastAPI backend.
      vpc_access {
        egress = "PRIVATE_RANGES_ONLY"

        network_interfaces {
          network    = google_compute_network.backend.name
          subnetwork = google_compute_subnetwork.backend.name
        }
      }

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project}/${var.repository_id}/${var.image_name}:${var.image_tag}"

        command = ["alembic"]
        args    = ["upgrade", "head"]

        env {
          name = "DATABASE_URL"

          value_source {
            secret_key_ref {
              secret  = var.database_url_secret_id
              version = "latest"
            }
          }
        }

        env {
          name  = "PYTHONPATH"
          value = "/app"
        }
      }
    }
  }

  lifecycle {
    prevent_destroy = true

    # GitHub Actions updates the migration image
    # to match the release being deployed.
    ignore_changes = [
      template[0].template[0].containers[0].image
    ]
  }
}
