variable "project" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Cloud Run, Memorystore, and Artifact Registry region"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
}

variable "repository_id" {
  description = "Existing Artifact Registry repository ID created by the bootstrap stack"
  type        = string
}

variable "image_name" {
  description = "Docker image name in Artifact Registry"
  type        = string
}

variable "image_tag" {
  description = "Immutable Docker image tag. GitHub Actions passes the commit SHA."
  type        = string
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "allow_unauth" {
  description = "Allow public HTTP invocation. Application/session authentication still happens inside FastAPI."
  type        = bool
  default     = true
}

variable "runtime_service_account_email" {
  description = "Dedicated service account attached to Cloud Run revisions"
  type        = string
}

variable "database_url_secret_id" {
  description = "Secret Manager secret ID exposed to the container as DATABASE_URL"
  type        = string
}

variable "vpc_network_name" {
  description = "VPC used by Cloud Run Direct VPC egress and Memorystore"
  type        = string
  default     = "vallorium-backend"
}

variable "vpc_subnet_name" {
  description = "Subnet used by Cloud Run Direct VPC egress"
  type        = string
  default     = "vallorium-backend-europe-west9"
}

variable "vpc_subnet_cidr" {
  description = "CIDR range used by Cloud Run Direct VPC egress"
  type        = string
  default     = "10.20.0.0/24"
}

variable "redis_name" {
  description = "Memorystore Redis instance name"
  type        = string
  default     = "vallorium-redis"
}

variable "redis_tier" {
  description = "Memorystore Redis service tier"
  type        = string
  default     = "BASIC"

  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "redis_tier must be BASIC or STANDARD_HA."
  }
}

variable "redis_memory_size_gb" {
  description = "Memorystore Redis memory in GiB"
  type        = number
  default     = 1

  validation {
    condition     = var.redis_memory_size_gb >= 1
    error_message = "redis_memory_size_gb must be at least 1 GiB."
  }
}
