output "hosting_site_id" {
  value = google_firebase_hosting_site.frontend.site_id
}

output "hosting_default_url" {
  value = google_firebase_hosting_site.frontend.default_url
}

output "hosting_custom_domains" {
  description = "Custom domain URLs, verification status, and required DNS changes"
  value = {
    for domain, resource in google_firebase_hosting_custom_domain.frontend : domain => {
      url                  = "https://${domain}"
      ownership_state      = resource.ownership_state
      host_state           = resource.host_state
      required_dns_updates = resource.required_dns_updates
      issues               = resource.issues
    }
  }
}
