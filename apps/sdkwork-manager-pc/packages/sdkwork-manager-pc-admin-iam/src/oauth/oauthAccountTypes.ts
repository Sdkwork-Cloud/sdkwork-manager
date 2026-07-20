export type IamOauthAccountKind = "oauth" | "official_account" | "mini_program";

export interface IamOauthProviderOption {
  catalogId: string;
  code: string;
  displayName: string;
  kind: IamOauthAccountKind;
  protocolFamily?: string;
}

export interface IamOauthApplicationOption {
  appId: string;
  displayName: string;
  environment: string;
  status: string;
  tenantApplicationId: string;
}

export interface IamOauthAccount {
  appId: string;
  applicationName: string;
  clientId: string;
  clientRecordId: string;
  displayName: string;
  enabled: boolean;
  environment: string;
  healthStatus: string;
  integrationId: string;
  kind: IamOauthAccountKind;
  miniProgramEnvironment: string;
  miniProgramOriginalId: string;
  providerCatalogId: string;
  providerCode: string;
  providerTenantId: string;
  redirectUri: string;
  secretConfigured: boolean;
  surfaceId: string;
}

export interface IamOauthAccountDraft {
  appId: string;
  clientId: string;
  displayName: string;
  enabled: boolean;
  environment: string;
  integrationId?: string;
  kind: IamOauthAccountKind;
  miniProgramEnvironment: string;
  miniProgramOriginalId: string;
  providerCatalogId: string;
  providerCode: string;
  providerTenantId: string;
  redirectUri: string;
  secretValue: string;
}

export interface IamOauthAccountWorkspaceState {
  accounts: readonly IamOauthAccount[];
  applications: readonly IamOauthApplicationOption[];
  lastError?: string;
  providers: readonly IamOauthProviderOption[];
  status: "idle" | "loading" | "ready" | "saving" | "error";
}

export interface IamOauthAccountController {
  getState(): IamOauthAccountWorkspaceState;
  load(): Promise<IamOauthAccountWorkspaceState>;
  saveAccount(draft: IamOauthAccountDraft): Promise<IamOauthAccountWorkspaceState>;
  setAccountEnabled(account: IamOauthAccount, enabled: boolean): Promise<IamOauthAccountWorkspaceState>;
}
