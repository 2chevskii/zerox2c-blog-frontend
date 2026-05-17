# Deployment

This repository deploys the public reader SPA for 0x2c.dev as a Docker image. The image builds the Vite static files with Node.js and serves them with lighttpd on container port `8080`.

The reader container does not terminate TLS and does not own public routing. Host-level external nginx should terminate SSL and proxy `/` traffic to the reader container.

Related repositories:

- `../blog-frontend`: public reader SPA lighttpd container.
- `../blog-admin-frontend`: admin SPA lighttpd container.
- `../blog-backend`: backend API Docker container.

## Branches And Environments

The same workflow handles CI and deployment:

| Git ref | GitHub Environment | Public URL | Deploys |
| --- | --- | --- | --- |
| Pull request to `develop` or `master` | none | none | No |
| Push to `develop` | `development` | `https://dev.0x2c.dev` | Yes |
| Push to `master` | `production` | `https://0x2c.dev` | Yes |
| Manual `workflow_dispatch` on another ref | `preview` context | none | No |

Production approval is configured in GitHub repository settings, not in YAML. Configure required reviewers for the `production` environment. Development normally has no required reviewers.

## External Infrastructure

The reader deployment assumes these already exist:

- A Linux host reachable by SSH.
- Docker with the Compose plugin on the host.
- External nginx or another routing server that terminates SSL.
- Backend API routing through the same public origin under `/api/`.

The frontend uses relative `/api` calls in public deployment, so no CORS setup is required when external nginx serves the SPA and proxies `/api/` on the same host.

Default internal bindings:

| Environment | Host binding |
| --- | --- |
| `production` | `127.0.0.1:5101 -> reader:8080` |
| `development` | `127.0.0.1:5201 -> reader:8080` |

Default deployment directories:

```text
/opt/0x2c-blog/production/reader
/opt/0x2c-blog/development/reader
```

Each directory contains a generated `compose.yaml`. Static files live inside the deployed image, not in a host `www` directory.

## GitHub Secrets

Define these in both the `development` and `production` GitHub Environments for this repository.

Required secrets:

- `VPS_HOST`: SSH hostname or IP address.
- `VPS_SSH_USER`: SSH user.
- `VPS_SSH_PRIVATE_KEY`: private key for `VPS_SSH_USER`.

Optional secrets:

- `VPS_SSH_PORT`: SSH port. Defaults to `22`.
- `DEPLOY_ROOT`: root deployment directory. Defaults to `/opt/0x2c-blog`.
- `APP_HOST`: host interface for the Docker port binding. Defaults to `127.0.0.1`.
- `APP_PORT`: host port for the Docker port binding. Defaults to `5101` in production and `5201` in development.
- `HEALTH_CHECK_HOST`: host used for the post-deploy curl check. Defaults to `APP_HOST`, except `0.0.0.0` maps to `127.0.0.1`.

The workflow pushes images to GHCR using `GITHUB_TOKEN`. The VPS must be able to pull `ghcr.io/{owner}/{repo}:{tag}`. Either make the package public or preconfigure Docker registry credentials on the VPS.

No API URL secret is needed for normal deployment. The app is built to call `/api` on the same public origin.

Workflow-provided variables used by `scripts/deploy.sh`:

- `DEPLOY_ENVIRONMENT`: `development` or `production`, from `scripts/resolve-deployment-context.sh`.
- `IMAGE`: full GHCR image reference to deploy.
- `DEFAULT_APP_PORT`: `5101` for production, `5201` for development.

## Scripts

- `scripts/resolve-deployment-context.sh`: maps the GitHub event/ref to deployment outputs such as environment name, environment URL, GHCR image, image tag, and default host port.
- `scripts/smoke-docker-image.sh`: runs the built image locally in CI and checks that lighttpd serves `/`.
- `scripts/deploy.sh`: validates deployment variables, writes a remote `compose.yaml`, runs `docker compose pull`, updates the reader container, and verifies the host binding with curl.

## Workflow Process

1. Checkout and resolve deployment context.
   The workflow runs `scripts/resolve-deployment-context.sh`. Pull requests build but set `deploy=false`. Pushes to `develop` and `master` set `deploy=true`.

2. Install dependencies and build static files.
   The workflow runs:

   ```bash
   npm ci
   npm run build
   ```

3. Build and smoke test the Docker image.
   The workflow builds the `runtime` image from `Dockerfile`, which uses lighttpd as the static file server. `scripts/smoke-docker-image.sh` starts the image and verifies `/`.

4. Push the image on deployable branches.
   Pushes to `develop` and `master` publish:

   ```text
   ghcr.io/{owner}/{repo}:sha-{commit}
   ghcr.io/{owner}/{repo}:{environment}-{commit}
   ```

5. Deploy over SSH on deployable branches.
   The deploy job runs in the selected GitHub Environment. For production, GitHub waits for required reviewers before exposing production environment secrets. The workflow runs `scripts/deploy.sh`.

6. Update the reader container on the VPS.
   The deploy script writes:

   ```text
   {DEPLOY_ROOT}/{environment}/reader/compose.yaml
   ```

   It then runs `docker compose pull && docker compose up -d --remove-orphans` and checks `http://{health_host}:{port}/`.

## External Routing Shape

Production routing should proxy:

```text
/ -> 127.0.0.1:5101
```

Development routing should proxy:

```text
/ -> 127.0.0.1:5201
```

The routing server should also proxy `/api/` to the backend API. Reader route refreshes require SPA fallback, which is handled by lighttpd inside the reader container.

## Operational Notes

- lighttpd only serves static frontend files.
- SSL termination and public host routing stay outside this repository.
- Rollback means redeploying a previous commit image tag or editing the generated compose file to reference that tag and running `docker compose up -d`.
- Post-deploy checks are `https://{host}/`, a refreshed reader route, and a representative `/api/` call through the public origin.
