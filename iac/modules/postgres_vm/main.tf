resource "google_compute_disk" "data" {
  project = var.project
  name    = "${var.name}-data"
  zone    = var.zone

  type = "pd-ssd"
  size = var.data_disk_size_gb

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_instance" "postgres" {
  project      = var.project
  name         = var.name
  zone         = var.zone
  machine_type = var.machine_type

  tags = ["postgres"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      type  = "pd-balanced"
      size  = 20
    }
  }

  attached_disk {
    source      = google_compute_disk.data.id
    device_name = "postgres-data"
  }

  network_interface {
    subnetwork = var.subnetwork

    # Intentionally no access_config:
    # PostgreSQL receives no public IP.
  }

  metadata_startup_script = templatefile(
    "${path.module}/startup.sh",
    {
      database_name = var.database_name
      database_user = var.database_user
    }
  )

  service_account {
    email  = var.service_account_email
    scopes = ["cloud-platform"]
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_compute_firewall" "postgres" {
  project = var.project
  name    = "${var.name}-allow-postgres"
  network = var.network

  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["5432"]
  }

  source_ranges = [
    "10.20.0.0/24"
  ]

  target_tags = ["postgres"]
}

resource "google_compute_firewall" "postgres_iap_ssh" {
  project = var.project
  name    = "${var.name}-allow-iap-ssh"
  network = var.network

  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [
    "35.235.240.0/20"
  ]

  target_tags = ["postgres"]
}