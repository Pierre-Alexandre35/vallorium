resource "google_compute_network" "backend" {
  project                 = var.project
  name                    = var.vpc_network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "backend" {
  project                  = var.project
  name                     = var.vpc_subnet_name
  region                   = var.region
  network                  = google_compute_network.backend.id
  ip_cidr_range            = var.vpc_subnet_cidr
  private_ip_google_access = true
}

# Memorystore for Redis is reachable only through the backend VPC. The endpoint
# is a private IP, so the application URL can be assembled by Terraform rather
# than stored as a secret.
resource "google_redis_instance" "backend" {
  project            = var.project
  name               = var.redis_name
  region             = var.region
  tier               = var.redis_tier
  memory_size_gb     = var.redis_memory_size_gb
  authorized_network = google_compute_network.backend.id
  connect_mode       = "DIRECT_PEERING"
  auth_enabled       = false
}

output "redis_host" {
  description = "Private Memorystore Redis IP address"
  value       = google_redis_instance.backend.host
}

output "redis_port" {
  description = "Memorystore Redis port"
  value       = google_redis_instance.backend.port
}
