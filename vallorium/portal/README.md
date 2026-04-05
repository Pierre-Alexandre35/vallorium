<p align="center">
  <h3 align="center">Web Client React HUMS</h3>
</p>
<br />
<br />

![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)

---

# Usage

## Configure DIT resources

A dedicated python script in `docker/scripts` can help you configure resources for your app to run.

If you want to avoid setting-up python, you can use the small Helm Chart, which is a small wrapper around the python script using `values.yml` instead of CLI arguments. Simply run `helm install -n [your namespace DIT is installing additional resources to] hums-product helm/ -f helm/values.yml`

If you prefer running the script locally (more flexible), do the following :

```bash
# [optional] Create a virtual env (using python3 from your local machine)
python -m venv .venv

# [optional] enable/enter you virtual env
. ./.venv/bin/activate

# [optional] Check venv is activated, should output path to local venv.
which python

# install dependencies (kubectl python client)
pip install -r docker/resource-configurator/requirements.txt

# Get help on available option flags
python docker/resource-configurator --help

# Run script with defaults (dit-demo)
python docker/resource-configurator
```

Whether through a Helm deployment, or locally using python, you will use various options (or their default values). Make sure you take note of those, as they will need to correspond to whatever you configure in your local `.env` file.

> Use `--help` or look at the `values.yml` to see defaults.

## Prepare your local environment

Currently, the web client is not packaged through any all-in-one chart or image. You will have to run the web client outside of the cluster.

To do this, simply make a copy of the `.env.example` and `.env.build.example` file, and rename (respectively) to `.env` and `.env.build`.

Depending on the CLI options you entered when running the python script in [#Configure DIT resources](#configure-dit-resources), you should be able to fill these variables without any further documentation.

Next, either configure Node and run `npm i && npm run dev`, or simply run `docker compose up`.

App will be available at [http://localhost:3000](http://localhost:300) (if your `SERVER_PORT` is `3000`)

# Install HUMS frontend manually :

## 1. Have a kubernetes cluster ready.

Example using kind from the development-environment repo:

```bash
# Delete previous cluster
kind delete cluster --name datahub-local

# Remove persisted volumes
sudo rm -rf volume-k8s

# Create cluster using
kind create cluster --config kind.config

# Create nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for it to be available
kubectl wait --namespace ingress-nginx \
--for=condition=ready pod \
--selector=app.kubernetes.io/component=controller \
--timeout=90s

# Add portainer dashboard (optional)
helm repo add portainer https://portainer.github.io/k8s/
helm repo update
helm install --create-namespace -n portainer portainer portainer/portainer --set service.type=ClusterIP
kubectl apply -f portainer-ingress.yaml
```

## 2. Create a secret for fetching artifactory artefacts

Example using the ditctl repo :

```bash
# Expects .env variables, and should prompt for verifications before running
./create-thalesartifactory-secret.sh
```

## 3. Install DIT core components : keycloakx and it's postgresql database

Example using the ditctl repo :

```bash
./ditctl.sh -ci postgresql-bitnami,keycloakx -ca -dbdit -n hums
```

## 4. Edit the coredns config

The coredns is a cluster-wide resource responsible for DNS resolutions in the cluster. For some DIT resources to work properly, we need to point one of the pod's IP with it's ingress hostname.

Start by running the following :

```bash
kubectl edit configmap coredns -n kube-system
```

This should open an editor view (depending on your local setup) with the current config map for the coredns pod(s).

Edit the file so that it looks something like this :

```yaml
apiVersion: v1
data:
  Corefile: |
    dit-keycloakx.cluster.local {
      errors
      hosts {
         10.96.166.17 dit-keycloakx.cluster.local
         fallthrough
      }
      reload
      loadbalance
    }
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30
        loop
        reload
        loadbalance
    }
kind: ConfigMap
```

See that the following part has been added on top :

```yaml
data:
  Corefile: |
    dit-keycloakx.cluster.local {
      errors
      hosts {
         10.96.166.17 dit-keycloakx.cluster.local
         fallthrough
      }
      reload
      loadbalance
    }
```

... where `10.96.166.17` corresponds to the internal IP of your keycloak POD.

Next, for your new config to take effect, run :

```bash
kubectl delete pods -n kube-system -l k8s-app=kube-dns
```

To check your new config was parsed successfully, assert pods are running again :

```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

## 5. Install other DIT components

For the sake of this repo, we will only cover the installation of MinIO.

Run the following :

```bash
./ditctl.sh -ca -ai minio -dbdit -n hums
```

This should complete successfully and you will have a working DIT w/ MinIO environment.

## 6. Create a web client in Keycloak.

Navigate to your Keyclaok console at https://dit-keycloakx.cluster.local/auth/admin/

Here you will be prompted for credentials. Use admin credentials from :

```bash
# Username
kubectl get secret -n hums keycloak-admin-user-credentials --template={{.data.username}} | base64 --decode

# Password
kubectl get secret -n hums keycloak-admin-user-credentials --template={{.data.password}} | base64 --decode
```

Top left, select "hums" as your realm.

Go to "Clients" and "Create client"

Here, enter a "Client ID" (ex: `web-client`) and a "Name" (ex: `HUMS`), and click "Next".

On the "Capability config" step you should be on, leave everything as-is. Do not enable "Client authentication".

Click "Next"

On the "Login settings" step you should be on, specify `*` as a valid redirect URI and the wollowing "Web origins" :

- `+`
- `*`

Click "Save".

> TODO rewrite docs for proper deployment where origins shoudl point to react-app host

## 7. Configure the React App to authenticate against the new client

Create a .env file containing :

```
VITE_MINIO_HOST='https://dit-minio-api.cluster.local'
VITE_KEYCLOAK_HOST='https://dit-keycloakx.cluster.local/auth'
VITE_KEYCLOAK_REALM='hums'
VITE_KEYCLOAK_CLIENT_ID='web-client'
```

(adapt with your values)

... and run :

```bash
# For local dev
npm run dev
```

> TODO rewrite docs for proper deployment

## 8. (optional) Create a user in keycloak

Before you log-in, create a user

> Optional : you coul use the alread-created dit-minio user

Give him a username, email, verify it's email, and add him a password under "Credentials".

Once created, visit the "Role mapping" tab and "Assign role".

Filter the available roles by client, and find the "writeonly" role on the "minio" client, and "Assign"

## 9. Configure the client to talk to minio

Go to you client's config in the "Client scopes" tab, and "Add client scope".

You should have a single choice of "dit-authorization" to add - add it.

Next, on the same "Client scopes" tab, click on the clickable scope on top "web-client-dedicated".

Here, open the "Add mapper" dropdown and select "By configuration".

On the modal, find and click on the "Audience" configuration.

You should be on a form where "Mapper type" is prefilled with "Audience". Give a name of your choice (ex: "MinIO Audience"), and in the "Included Client Audience" searchbox select "minio". Next, add the mapping to your ID token by clicking "Add to ID token", and "Save"

## 10. Configure NGINX to stop caching uploads

By default (using KIND and nginx-ingress), our ingress controller caches upload request body with a very small size limitation (1mb).

Our app will want to upload larger chunks (5mb or more), and NGINX (as is) will repond "ERR_FAILED 413 (Payload Too Large)" to us.

To change this, you will need to modify your NGINX config and set the `proxy_body_size` to `0`.

If installed through a `kubernetes/ingress-nginx` deployment (like in #1), you should be able to change a single value in the deployements configmap for this parameter to change.

> see https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/#client-body-buffer-size

Run the following :

```bash
kubectl edit configmap -n ingress-nginx ingress-nginx-controller
```

And modify the configmap to add the following line :

```yaml
apiVersion: v1
data:
  allow-snippet-annotations: 'false'
  # Add the 3 lines below
  proxy-body-size: '0' # Default is '1m' - '0' disables caching
  proxy-buffer-numbers: '8' # Default is 4
  proxy-buffer-size: '128k' # Default is '4k' or '8k' (one memory page)
kind: ConfigMap
# ...
```

Close the file, and restart the ingress-controller pod with :

```bash
# Get pod exact name
kubectl get pods -n ingress-nginx

# Delete pod (should restart with deployement)
kubectl delete pods -n ingress-nginx ingress-nginx-controller-6b8cfc8d84-26t5l
```

## 11. Ignore invalid certificate error on minio server

When performing upload, react might complain about the certificate authority for dit-minio-api.cluster.local not being valid.

To avoid this, either configure properly your SSL certificate (ex: using cert-manager), or simply tell your browser to trust the certificate despite the invalid authority by visiting https://dit-minio-api.cluster.local.

> You need to visit this URL in the same browser your react-app will be running in

Next, process to bypass the certificate warning (ex in chrome: click "Advanced" and "proceed").

From now on, every request performed in this browser to dit-minio-api.cluster.local will be trusted on port 443 (https).

## 12. Create the bucket

For uploads to work, create a bucket named "`dit`" from the MinIO console panel. (or make sure it exists)

> TODO do not hardcode this, and include in env variable.

## 13. Configure grafana

- have a grafana deployment from the DIT
- Configure the `grafana.ini` config file from the corresponding configmap with : `[security]` -> `cookie_samesite = none`
- restart grafana pod (delete)
- Make sure your browser bypasses TLS errors for the grafana hostname

## 14. Use the react-app

Open the app on the port viteJs has selected for you (ex: localhost:5173 or localhost3000), log-in using the user you want (or don't if SSO kicked-in), and use the app.

The configs above should have allowed you to perform uploads to the `dit` bucket.

# Troubleshoot

## Upload fails

Open the network tab of your devtools, and look at the requests.

### GET minio/?Action=AssumeRoleWithWebIdentity... fails

This request is supposed to fetch temporary credentials for you from minio.

- `Role arn:minio:iam:::role/dummy-internal does not exist`
  - MinIO probably failed to configure your Keycloak deployment as an OIDC client provider. Check logs from both your minio pod and keycloak pod, and restart one or the other depending on which seem to malfunction.
