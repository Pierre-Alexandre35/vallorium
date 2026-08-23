project       = "travian-prod-1234"
region        = "europe-west9"
service_name  = "api"
repository_id = "api"
image_name    = "backend"

# GitHub Actions supplies image_tag from the immutable commit SHA:
#   -var="image_tag=${GITHUB_SHA}"

min_instances = 1
max_instances = 2
allow_unauth  = true

runtime_service_account_email = "vallorium-backend-runtime@travian-prod-1234.iam.gserviceaccount.com"
database_url_secret_id        = "vallorium-database-url"

vpc_network_name = "vallorium-backend"
vpc_subnet_name  = "vallorium-backend-europe-west9"
vpc_subnet_cidr  = "10.20.0.0/24"

redis_name           = "vallorium-redis"
redis_tier           = "BASIC"
redis_memory_size_gb = 1
