project       = "vallorium-online-prod-01"
region        = "europe-west9"
service_name  = "api"
repository_id = "api"
image_name    = "backend"

# GitHub Actions supplies image_tag from the immutable commit SHA:
#   -var="image_tag=${GITHUB_SHA}"

min_instances = 1
max_instances = 2
allow_unauth  = true

runtime_service_account_email = "vallorium-backend-runtime@vallorium-online-prod-01.iam.gserviceaccount.com"
database_url_secret_id        = "vallorium-database-url"

vpc_network_name = "vallorium-backend"
vpc_subnet_name  = "vallorium-backend-europe-west9"
vpc_subnet_cidr  = "10.20.0.0/24"

redis_name           = "vallorium-redis"
redis_tier           = "BASIC"
redis_memory_size_gb = 1

postgres_name                          = "vallorium-postgres"
postgres_zone                          = "europe-west9-b"
postgres_machine_type                  = "e2-standard-2"
postgres_data_disk_size_gb             = 50
postgres_database_name                 = "vallorium"
postgres_database_user                 = "vallorium"
postgres_runtime_service_account_email = "vallorium-postgres-runtime@vallorium-online-prod-01.iam.gserviceaccount.com"