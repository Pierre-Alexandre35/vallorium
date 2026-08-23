resource "google_project_service" "enabled" {
  for_each                   = var.apis
  project                    = var.project
  service                    = each.value
  disable_on_destroy         = false
  disable_dependent_services = false
}