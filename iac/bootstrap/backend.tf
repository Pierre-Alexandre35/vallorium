terraform {
  backend "gcs" {
    bucket = "travian-prod-1234-tfstate"
    prefix = "tfstate/bootstrap"
  }
}