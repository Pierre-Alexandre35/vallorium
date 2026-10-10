variable "project" {
  type = string
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}

variable "name" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "network" {
  type = string
}

variable "subnetwork" {
  type = string
}

variable "data_disk_size_gb" {
  type = number
}

variable "database_name" {
  type = string
}

variable "database_user" {
  type = string
}

variable "service_account_email" {
  description = "Runtime service account attached to the PostgreSQL VM"
  type        = string
}