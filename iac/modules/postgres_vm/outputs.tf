output "private_ip" {
  value = google_compute_instance.postgres.network_interface[0].network_ip
}

output "instance_name" {
  value = google_compute_instance.postgres.name
}

output "data_disk_name" {
  value = google_compute_disk.data.name
}