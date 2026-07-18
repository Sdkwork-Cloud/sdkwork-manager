# Manager Source Configuration

`sdkwork.deployment.config.json` indexes the supported deployment profiles. The profile files under
`deployments/` are the checked-in source for public origins, bind addresses, and SDK Base URLs.

Local `.env` files and process environment variables may override these values. Secrets and access
tokens must not be committed under `etc/`. Validate the topology with `pnpm topology:validate`.
