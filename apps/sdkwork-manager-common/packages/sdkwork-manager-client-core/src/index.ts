export {
  resolveManagerApiBaseUrl,
  resolveManagerApplicationBaseUrl,
  resolveManagerAppApiBaseUrl,
  resolveManagerBackendApiBaseUrl,
  resolveIamAppApiBaseUrl,
  resolveIamBackendApiBaseUrl,
  resolvePlatformApiGatewayBaseUrl,
  resolveManagerDeploymentProfile,
  resolveManagerEnvironment,
  readSdkBaseUrlEnvValue,
  managerAppApiPathSegment,
  type ClientPlatform,
  type ClientRuntimeEnv,
  type ManagerDeploymentProfile,
  type ManagerEnvironment,
} from "./config/sdkBaseUrls";
export {
  normalizeOperatorSession,
  type OperatorSession,
} from "./session/operatorSessionStorage";
export { listAdminPreferences } from "./services/preferencesAdminService";
export { retrieveManagerPreferences, updateManagerPreferences } from "./services/preferencesAppService";
