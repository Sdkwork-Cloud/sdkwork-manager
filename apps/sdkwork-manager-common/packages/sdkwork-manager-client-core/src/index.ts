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
  normalizeOperatorSession,
  type OperatorSession,
} from "./session/operatorSessionStorage";
export { listAdminPreferences } from "./services/preferencesAdminService";
export { retrieveManagerPreferences, updateManagerPreferences } from "./services/preferencesAppService";
