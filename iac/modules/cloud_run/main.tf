resource "google_cloud_run_v2_service" "service" {
  project  = var.project
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account       = var.runtime_service_account_email
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    # Direct VPC egress avoids a Serverless VPC Access connector. Only private
    # ranges use the VPC; public traffic such as Neon continues through Cloud
    # Run's normal internet egress path.
    vpc_access {
      egress = "PRIVATE_RANGES_ONLY"

      network_interfaces {
        network    = var.vpc_network
        subnetwork = var.vpc_subnetwork
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project}/${var.repository_id}/${var.image_name}:${var.image_tag}"

      ports {
        container_port = 8080
      }

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
        name  = "REDIS_URL"
        value = var.redis_url
      }
      env {
        name  = "SESSION_COOKIE_SECURE"
        value = "true"
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count = var.allow_unauth ? 1 : 0

  project  = var.project
  location = var.region
  name     = google_cloud_run_v2_service.service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
