resource "google_compute_router" "backend" {
  project = var.project
  name    = "vallorium-backend-router"
  region  = var.region
  network = google_compute_network.backend.id
}

resource "google_compute_router_nat" "backend" {
  project = var.project
  name    = "vallorium-backend-nat"
  region  = var.region
  router  = google_compute_router.backend.name

  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}