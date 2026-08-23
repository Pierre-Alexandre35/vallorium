variable "project" {
  type = string
}

variable "region" {
  type = string
}

variable "service_name" {
  type = string
}

variable "repository_id" {
  type = string
}

variable "image_name" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  type    = number
  default = 10
}

variable "allow_unauth" {
  type    = bool
  default = true
}

variable "runtime_service_account_email" {
  description = "Service identity attached to the Cloud Run service"
  type        = string
}

variable "database_url_secret_id" {
  description = "Secret Manager secret ID exposed as DATABASE_URL"
  type        = string
}

variable "redis_url" {
  description = "Private Memorystore Redis URL exposed as REDIS_URL"
  type        = string
}

variable "vpc_network" {
  description = "VPC network used by Cloud Run Direct VPC egress"
  type        = string
}

variable "vpc_subnetwork" {
  description = "VPC subnet used by Cloud Run Direct VPC egress"
  type        = string
}
