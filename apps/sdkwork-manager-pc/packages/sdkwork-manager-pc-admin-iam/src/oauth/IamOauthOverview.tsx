import { useEffect, useMemo, useState } from "react";
import type {
  SdkworkIamOauthAdminController,
  SdkworkIamOauthAdminResourceSnapshot,
  SdkworkIamOauthAdminState,
} from "@sdkwork/iam-pc-admin-oauth";

import type { ManagerIamAdminModuleMessages } from "../types/i18n";

const OVERVIEW_RESOURCE_KEYS = [
  "accountLinks",
  "callbackEvents",
  "claimMappings",
  "clients",
  "diagnosticRuns",
  "flowConfigs",
  "grants",
  "integrations",
  "operationalResources",
  "operatorPlatforms",
  "policies",
  "providerCatalog",
  "resourceAccounts",
  "resourceAuthorizations",
  "scopeProfiles",
  "secrets",
  "surfaces",
  "tenantBindings",
  "webhookConfigs",
] as const satisfies readonly (keyof SdkworkIamOauthAdminResourceSnapshot)[];

type IamOauthOverviewProps = {
  controller: SdkworkIamOauthAdminController;
  messages: ManagerIamAdminModuleMessages["oauthOverview"];
};

export function IamOauthOverview({ controller, messages }: IamOauthOverviewProps) {
  const [state, setState] = useState<SdkworkIamOauthAdminState>(() => controller.getState());

  useEffect(() => {
    let active = true;
    const request = controller.load(OVERVIEW_RESOURCE_KEYS);
    setState(controller.getState());
    void request.then(() => {
      if (active) setState(controller.getState());
    }).catch(() => {
      if (active) setState(controller.getState());
    });
    return () => {
      active = false;
    };
  }, [controller]);

  const readinessChecks = useMemo(() => [
    {
      complete: state.providerCatalog.length > 0 && state.integrations.length > 0,
      ...messages.checks.providers,
    },
    {
      complete: state.clients.length > 0,
      ...messages.checks.applications,
    },
    {
      complete: state.policies.length > 0 && state.scopeProfiles.length > 0,
      ...messages.checks.governance,
    },
    {
      complete: state.webhookConfigs.length > 0,
      ...messages.checks.observability,
    },
  ], [messages.checks, state]);

  const inventory = useMemo(() => [
    {
      count: state.providerCatalog.length + state.integrations.length,
      ...messages.inventory.providers,
    },
    {
      count: state.scopeProfiles.length + state.claimMappings.length + state.flowConfigs.length + state.surfaces.length,
      ...messages.inventory.loginConfiguration,
    },
    {
      count: state.policies.length + state.tenantBindings.length,
      ...messages.inventory.governance,
    },
    {
      count: state.accountLinks.length + state.grants.length,
      ...messages.inventory.authorizations,
    },
    {
      count: state.operatorPlatforms.length + state.resourceAccounts.length + state.resourceAuthorizations.length + state.operationalResources.length,
      ...messages.inventory.resources,
    },
    {
      count: state.webhookConfigs.length + state.diagnosticRuns.length + state.callbackEvents.length,
      ...messages.inventory.activity,
    },
  ], [messages.inventory, state]);

  const statusLabel = state.status === "error"
    ? messages.loadError
    : state.status === "loading"
      ? messages.loading
      : readinessChecks.every((check) => check.complete)
        ? messages.ready
        : messages.attention;
  const statusTone = state.status === "error"
    ? "danger"
    : readinessChecks.every((check) => check.complete)
      ? "success"
      : "warning";

  return (
    <section className="manager-oauth-overview" aria-labelledby="manager-oauth-overview-title">
      <header className="manager-oauth-overview__header">
        <div>
          <p className="manager-oauth-overview__eyebrow">{messages.eyebrow}</p>
          <h1 id="manager-oauth-overview-title">{messages.title}</h1>
          <p>{messages.description}</p>
        </div>
        <span
          aria-live="polite"
          className="manager-oauth-overview__status"
          data-tone={statusTone}
          role="status"
        >
          <span aria-hidden="true" />
          {statusLabel}
        </span>
      </header>

      <dl className="manager-oauth-overview__metrics">
        {[
          [messages.metrics.providers, state.providerCatalog.length],
          [messages.metrics.integrations, state.integrations.length],
          [messages.metrics.applications, state.clients.length],
          [messages.metrics.grants, state.grants.length],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <section className="manager-oauth-overview__section" aria-labelledby="manager-oauth-readiness-title">
        <div className="manager-oauth-overview__section-heading">
          <h2 id="manager-oauth-readiness-title">{messages.readinessTitle}</h2>
          <p>{messages.readinessDescription}</p>
        </div>
        <ul className="manager-oauth-overview__readiness">
          {readinessChecks.map((check) => (
            <li key={check.label}>
              <span className="manager-oauth-overview__check" data-complete={check.complete} aria-hidden="true" />
              <span>
                <strong>{check.label}</strong>
                <small>{check.description}</small>
              </span>
              <b>{check.complete ? messages.ready : messages.attention}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="manager-oauth-overview__section" aria-labelledby="manager-oauth-inventory-title">
        <div className="manager-oauth-overview__section-heading">
          <h2 id="manager-oauth-inventory-title">{messages.inventoryTitle}</h2>
          <p>{messages.inventoryDescription}</p>
        </div>
        <div className="manager-oauth-overview__table-wrap">
          <table className="manager-oauth-overview__table">
            <tbody>
              {inventory.map((item) => (
                <tr key={item.label}>
                  <th scope="row">{item.label}</th>
                  <td>{item.description}</td>
                  <td>{messages.countTemplate.replace("{count}", String(item.count))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
