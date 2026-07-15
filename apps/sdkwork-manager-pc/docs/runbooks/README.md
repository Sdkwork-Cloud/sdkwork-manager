# SDKWork Manager PC Runbook

The canonical release checklist is
`../../../../docs/runbooks/LAUNCH_READINESS.md`. This PC-specific entry records
the operational boundary for the browser host.

## Operator smoke

1. Start the manager API ingress and run `pnpm --dir apps/sdkwork-manager-pc dev`.
2. Sign in through `/auth/login`; do not use a bootstrap access token in Vite.
3. Confirm the global Header switches only to modules allowed by the IAM session.
4. Confirm the Identity & Access module renders its own Sidebar and permitted
   child page. Test an unauthorized `/admin/iam/...` deep link separately.
5. Sign out and confirm protected routes return to login.

## Browser rollback

Record the current static asset version, public runtime endpoint configuration,
and enabled module package versions before publication. Restore the previous
asset version and configuration as a unit if the release must be rolled back.
Do not bypass a failed entitlement check in the browser; disable the module in
the explicit assembly or restore its last approved package version.
