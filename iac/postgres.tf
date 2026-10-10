module "postgres" {
  source = "./modules/postgres_vm"

  project = var.project
  region  = var.region
  zone    = var.postgres_zone

  name         = var.postgres_name
  machine_type = var.postgres_machine_type

  subnetwork = google_compute_subnetwork.backend.id
  network    = google_compute_network.backend.id

  data_disk_size_gb = var.postgres_data_disk_size_gb

  database_name = var.postgres_database_name
  database_user = var.postgres_database_user
  service_account_email = var.postgres_runtime_service_account_email
}