export {
  resolveManagerApiBaseUrl,
  resolveManagerApplicationBaseUrl,
  resolveManagerAppApiBaseUrl,
  resolveManagerBackendApiBaseUrl,
  resolveIamAppApiBaseUrl,
  resolvePlatformApiGatewayBaseUrl,
  shouldUseBrowserDevProxy,
  readSdkBaseUrlEnvValue,
  isSdkRuntimeDev,
  managerAppApiPathSegment,
  type ClientPlatform,
  type ClientRuntimeEnv,
} from "./config/sdkBaseUrls";
export { buildManagerViteDevProxy } from "./dev/viteDevProxy";
export {
  buildOperatorSdkHeaders,
  type OperatorSession,
} from "./session/operatorSdkHeaders";
export {
  DEFAULT_OPERATOR_SESSION_ENV_PREFIX,
  loadOperatorSessionFromStorage,
  normalizeOperatorSession,
  readOperatorSessionFromEnv,
  saveOperatorSessionToStorage,
} from "./session/operatorSessionStorage";
export { listAdminPreferences } from "./services/preferencesAdminService";
export { retrieveManagerPreferences, updateManagerPreferences } from "./services/preferencesAppService";
