terraform {
  backend "gcs" {
    bucket = "vallorium-online-prod-01-state"
    prefix = "tfstate/frontend"
  }
}
