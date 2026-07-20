import type { SdkworkIamService } from "@sdkwork/iam-service";

import type {
  IamOauthAccount,
  IamOauthAccountController,
  IamOauthAccountDraft,
  IamOauthAccountKind,
  IamOauthAccountWorkspaceState,
  IamOauthApplicationOption,
  IamOauthProviderOption,
} from "../oauth/oauthAccountTypes";

type UnknownRecord = Record<string, unknown>;

const LIST_QUERY = { page: 1, page_size: 200 } as const;

export function createIamOauthAccountController(input: {
  service: SdkworkIamService;
  tenantId: string;
}): IamOauthAccountController {
  let state: IamOauthAccountWorkspaceState = {
    accounts: [],
    applications: [],
    providers: [],
    status: "idle",
  };

  const setState = (patch: Partial<IamOauthAccountWorkspaceState>) => {
    state = { ...state, ...patch };
  };

  const load = async () => {
    setState({ lastError: undefined, status: "loading" });
    try {
      const [providerResponse, integrationResponse, clientResponse, secretResponse, surfaceResponse, applicationResponse] = await Promise.all([
        input.service.iam.oauth.providerCatalog.list(LIST_QUERY),
        input.service.iam.oauth.integrations.list(LIST_QUERY),
        input.service.iam.oauth.clients.list(LIST_QUERY),
        input.service.iam.oauth.secrets.list(LIST_QUERY),
        input.service.iam.oauth.surfaces.list(LIST_QUERY),
        input.tenantId
          ? input.service.iam.tenantApplications.list(input.tenantId, LIST_QUERY)
          : Promise.resolve({ items: [] }),
      ]);
      const providers = toProviderOptions(listItems(providerResponse));
      const applications = toApplicationOptions(listItems(applicationResponse));
      const accounts = toAccounts({
        applications,
        clients: listItems(clientResponse),
        integrations: listItems(integrationResponse),
        providers,
        secrets: listItems(secretResponse),
        surfaces: listItems(surfaceResponse),
      });
      setState({ accounts, applications, providers, status: "ready" });
      return state;
    } catch (error) {
      setState({
        lastError: error instanceof Error ? error.message : "OAuth account data could not be loaded",
        status: "error",
      });
      throw error;
    }
  };

  return {
    getState: () => state,
    load,
    async saveAccount(draft) {
      validateDraft(draft);
      setState({ lastError: undefined, status: "saving" });
      try {
        const existing = draft.integrationId
          ? state.accounts.find((account) => account.integrationId === draft.integrationId)
          : undefined;
        if (existing) {
          await updateAccount(input.service, existing, draft);
        } else {
          await createAccount(input.service, draft);
        }
        return await load();
      } catch (error) {
        setState({
          lastError: error instanceof Error ? error.message : "OAuth account could not be saved",
          status: "error",
        });
        throw error;
      }
    },
    async setAccountEnabled(account, enabled) {
      setState({ lastError: undefined, status: "saving" });
      try {
        await Promise.all([
          input.service.iam.oauth.integrations.update(account.integrationId, { enabled }),
          account.clientRecordId
            ? input.service.iam.oauth.clients.update(account.clientRecordId, { enabled })
            : Promise.resolve(),
          account.surfaceId
            ? input.service.iam.oauth.surfaces.update(account.surfaceId, { enabled })
            : Promise.resolve(),
        ]);
        return await load();
      } catch (error) {
        setState({
          lastError: error instanceof Error ? error.message : "OAuth account status could not be updated",
          status: "error",
        });
        throw error;
      }
    },
  };
}

async function createAccount(service: SdkworkIamService, draft: IamOauthAccountDraft) {
  const code = createAccountCode(draft);
  let integrationId = "";
  let clientRecordId = "";
  try {
    const integration = await service.iam.oauth.integrations.create({
      appId: draft.appId,
      deploymentMode: "saas",
      displayName: draft.displayName.trim(),
      enabled: draft.enabled,
      environment: draft.environment,
      integrationCode: code,
      providerCatalogId: draft.providerCatalogId,
      providerCode: draft.providerCode,
    });
    integrationId = readId(integration, ["integrationId"]);
    if (!integrationId) throw new Error("IAM did not return the new OAuth account id");

    const client = await service.iam.oauth.clients.create({
      clientCode: `${code}-client`,
      displayName: draft.displayName.trim(),
      enabled: draft.enabled,
      integrationId,
      providerAppId: draft.clientId.trim(),
      providerClientId: draft.clientId.trim(),
      providerCode: draft.providerCode,
      ...(draft.providerTenantId.trim() ? { providerTenantId: draft.providerTenantId.trim() } : {}),
    });
    clientRecordId = readId(client, ["oauthClientId"]);
    if (!clientRecordId) throw new Error("IAM did not return the new OAuth client id");

    await service.iam.oauth.surfaces.create(surfacePayload(draft, integrationId, clientRecordId, `${code}-surface`));
    if (draft.secretValue.trim()) {
      await createClientSecret(service, clientRecordId, draft.secretValue);
    }
  } catch (error) {
    if (clientRecordId) {
      await service.iam.oauth.clients.delete(clientRecordId).catch(() => undefined);
    }
    if (integrationId) {
      await service.iam.oauth.integrations.delete(integrationId).catch(() => undefined);
    }
    throw error;
  }
}

async function updateAccount(
  service: SdkworkIamService,
  account: IamOauthAccount,
  draft: IamOauthAccountDraft,
) {
  await service.iam.oauth.integrations.update(account.integrationId, {
    appId: draft.appId,
    deploymentMode: "saas",
    displayName: draft.displayName.trim(),
    enabled: draft.enabled,
    environment: draft.environment,
  });
  if (account.clientRecordId) {
    await service.iam.oauth.clients.update(account.clientRecordId, {
      displayName: draft.displayName.trim(),
      enabled: draft.enabled,
      providerAppId: draft.clientId.trim(),
      providerClientId: draft.clientId.trim(),
      providerTenantId: draft.providerTenantId.trim(),
    });
  }
  if (account.surfaceId) {
    await service.iam.oauth.surfaces.update(
      account.surfaceId,
      surfacePayload(draft, account.integrationId, account.clientRecordId, ""),
    );
  }
  if (draft.secretValue.trim() && account.clientRecordId) {
    await createClientSecret(service, account.clientRecordId, draft.secretValue);
  }
}

function createClientSecret(service: SdkworkIamService, clientRecordId: string, secretValue: string) {
  return service.iam.oauth.secrets.create({
    secretKind: "client_secret",
    secretOwnerId: clientRecordId,
    secretOwnerKind: "oauth_client",
    secretValue: secretValue.trim(),
  });
}

function surfacePayload(
  draft: IamOauthAccountDraft,
  integrationId: string,
  oauthClientId: string,
  surfaceCode: string,
) {
  return {
    displayName: draft.displayName.trim(),
    enabled: draft.enabled,
    integrationId,
    miniProgramAppId: draft.kind === "mini_program" ? draft.clientId.trim() : undefined,
    miniProgramEnvironment: draft.kind === "mini_program" ? draft.miniProgramEnvironment : undefined,
    miniProgramOriginalId: draft.kind === "mini_program" ? draft.miniProgramOriginalId.trim() : undefined,
    miniProgramReleaseChannel: draft.kind === "mini_program" ? draft.miniProgramEnvironment : undefined,
    oauthClientId,
    redirectUri: draft.kind === "mini_program" ? undefined : draft.redirectUri.trim(),
    surfaceCode: surfaceCode || undefined,
    surfaceKind: draft.kind === "mini_program" ? "mini_program" : "web",
  };
}

function validateDraft(draft: IamOauthAccountDraft) {
  if (!draft.displayName.trim() || !draft.providerCode || !draft.providerCatalogId) {
    throw new Error("OAuth provider and account name are required");
  }
  if (!draft.appId || !draft.clientId.trim()) {
    throw new Error("Application and provider AppID/Client ID are required");
  }
  if (!draft.integrationId && !draft.secretValue.trim()) {
    throw new Error("Client secret is required when creating an OAuth account");
  }
  if (draft.kind !== "mini_program" && !draft.redirectUri.trim()) {
    throw new Error("Callback URL is required for OAuth web accounts");
  }
}

function createAccountCode(draft: IamOauthAccountDraft) {
  const stem = `${draft.providerCode}-${draft.appId}-${draft.displayName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${stem || draft.providerCode}-${Date.now().toString(36)}`;
}

function toProviderOptions(items: unknown[]): IamOauthProviderOption[] {
  return items.map((item) => {
    const record = asRecord(item);
    const code = readString(record, ["providerCode", "provider_code"]);
    return {
      catalogId: readString(record, ["providerCatalogId", "id"]),
      code,
      displayName: readString(record, ["providerDisplayName", "providerName", "provider_display_name", "provider_name"]) || code,
      kind: providerKind(code),
      protocolFamily: readString(record, ["protocolFamily", "protocol_family"]),
    };
  }).filter((provider) => provider.catalogId && provider.code);
}

function toApplicationOptions(items: unknown[]): IamOauthApplicationOption[] {
  return items.map((item) => {
    const record = asRecord(item);
    return {
      appId: readString(record, ["appId", "app_id"]),
      displayName: readString(record, ["displayName", "display_name", "name"]),
      environment: readString(record, ["environment"]),
      status: readString(record, ["status"]),
      tenantApplicationId: readString(record, ["tenantApplicationId", "tenant_application_id", "id"]),
    };
  }).filter((application) => application.appId);
}

function toAccounts(input: {
  applications: readonly IamOauthApplicationOption[];
  clients: unknown[];
  integrations: unknown[];
  providers: readonly IamOauthProviderOption[];
  secrets: unknown[];
  surfaces: unknown[];
}): IamOauthAccount[] {
  return input.integrations.map((item) => {
    const integration = asRecord(item);
    const integrationId = readId(integration, ["integrationId"]);
    const client = asRecord(input.clients.find((candidate) =>
      readString(asRecord(candidate), ["integrationId", "integration_id"]) === integrationId));
    const clientRecordId = readId(client, ["oauthClientId"]);
    const surface = asRecord(input.surfaces.find((candidate) =>
      readString(asRecord(candidate), ["integrationId", "integration_id"]) === integrationId));
    const providerCode = readString(integration, ["providerCode", "provider_code"]);
    const appId = readString(integration, ["appId", "app_id"]);
    const application = input.applications.find((candidate) => candidate.appId === appId);
    const secretConfigured = input.secrets.some((candidate) => {
      const secret = asRecord(candidate);
      return readString(secret, ["oauthClientId", "oauth_client_id", "secretOwnerId", "secret_owner_id"]) === clientRecordId;
    }) || readString(client, ["secretConfigStatus", "secret_config_status"]) === "configured";
    return {
      appId,
      applicationName: application?.displayName || appId,
      clientId: readString(client, ["providerClientId", "provider_client_id"]),
      clientRecordId,
      displayName: readString(integration, ["displayName", "display_name"]),
      enabled: readBoolean(integration, ["enabled"]),
      environment: readString(integration, ["environment"]),
      healthStatus: readString(integration, ["healthStatus", "health_status"]),
      integrationId,
      kind: providerKind(providerCode),
      miniProgramEnvironment: readString(surface, ["miniProgramEnvironment", "mini_program_environment"]) || "release",
      miniProgramOriginalId: readString(surface, ["miniProgramOriginalId", "mini_program_original_id"]),
      providerCatalogId: readString(integration, ["providerCatalogId", "provider_catalog_id"])
        || input.providers.find((provider) => provider.code === providerCode)?.catalogId
        || "",
      providerCode,
      providerTenantId: readString(client, ["providerTenantId", "provider_tenant_id"]),
      redirectUri: readString(surface, ["redirectUri", "redirect_uri"]),
      secretConfigured,
      surfaceId: readId(surface, ["surfaceId"]),
    };
  }).filter((account) => account.integrationId);
}

function providerKind(providerCode: string): IamOauthAccountKind {
  if (providerCode === "wechat_mini_program") return "mini_program";
  if (providerCode === "wechat") return "official_account";
  return "oauth";
}

function listItems(value: unknown): unknown[] {
  const record = asRecord(value);
  const data = asRecord(record.data);
  const candidates = [record.items, data.items, asRecord(data.item).items];
  return candidates.find(Array.isArray) as unknown[] | undefined ?? [];
}

function readId(value: unknown, aliases: string[]): string {
  const record = asRecord(asRecord(value).item ?? asRecord(value).data ?? value);
  const nested = asRecord(record.item);
  return readString(nested, [...aliases, "id"]) || readString(record, [...aliases, "id"]);
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function readString(record: UnknownRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readBoolean(record: UnknownRecord, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
  }
  return false;
}
