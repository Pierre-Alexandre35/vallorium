project       = "travian-prod-1234"
region        = "europe-west9"
service_name  = "api"
repository_id = "api"            # must match Artifact Registry repo in CI
image_name    = "backend"        # must match image name built in CI
image_tag     = "auto-set by GitHub Action" # <- comes from CI via `-var="image_tag=${{ github.sha }}"`

min_instances = 1
max_instances = 2

allow_unauth  = true
create_repo   = true


database_url      = "postgresql+psycopg://pierre:password@postgres:5432/pierre"
celery_broker_url = "redis://redis:6379/0"
secret_key        = "dev-secret"
debug             = "true"