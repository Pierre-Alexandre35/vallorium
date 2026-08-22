# Vallorium infrastructure

Terraform is split into two concerns:

- `bootstrap/`: one-time CI identity setup for GitHub Actions.
- root stack + `modules/cloud_run/`: backend application infrastructure.

The frontend deployment bucket already exists, so Terraform does not recreate it. The bootstrap stack only grants the GitHub frontend deployer access to that bucket.

## Bootstrap GitHub frontend deployment

Run with credentials that are allowed to manage IAM, Workload Identity Federation, APIs, and the `vallorium.online` bucket:

```bash
cd bootstrap
terraform init
terraform plan -var-file=../envs/prod.bootstrap.tfvars
terraform apply -var-file=../envs/prod.bootstrap.tfvars
```

After apply:

```bash
terraform output github_workload_identity_provider
terraform output github_frontend_service_account
```

Create these GitHub repository **Variables** (not secrets):

- `GCP_WIF_PROVIDER` = `github_workload_identity_provider`
- `GCP_FRONTEND_SERVICE_ACCOUNT` = `github_frontend_service_account`

The frontend workflow should authenticate without a JSON service-account key:

```yaml
permissions:
  contents: read
  id-token: write

- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v3
  with:
    project_id: ${{ env.PROJECT_ID }}
    workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
    service_account: ${{ vars.GCP_FRONTEND_SERVICE_ACCOUNT }}
```

Once this works, the old `GCP_SA_KEY` GitHub secret is no longer needed and should be deleted.

## IAM scope

The frontend deployer receives `roles/storage.admin` only on `vallorium.online`, not at project level. This is intentionally bucket-scoped because `gcloud storage rsync --delete-unmatched-destination-objects` needs object list/read/create/delete plus `storage.buckets.get`.
