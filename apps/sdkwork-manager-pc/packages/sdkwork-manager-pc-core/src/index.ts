import {
  buildManagerPreferencesDraft,
  describeManager,
} from "./preferences";

export {
  buildManagerPreferencesDraft,
  describeManager,
};

export {
  resolveManagerApiBaseUrl,
  resolveIamAppApiBaseUrl,
} from "@sdkwork/manager-client-core";

export {
  buildOperatorSdkHeaders,
  getOperatorTokenManager,
  loadOperatorSession,
  readOperatorSessionFromEnv,
  saveOperatorSession,
  OPERATOR_SESSION_STORAGE_KEY,
  OPERATOR_SESSION_CHANGED_EVENT,
  type OperatorSession,
} from "./session/operatorSession";

export {
  clearManagerIamSession,
  commitManagerIamSession,
  loadManagerIamSession,
  toOperatorSession,
  MANAGER_IAM_SESSION_STORAGE_KEY,
  type ManagerIamSession,
} from "./session/iamOperatorSessionBridge";

export {
  getManagerIamRuntime,
  resetManagerIamRuntime,
  resolveManagerAuthAppearance,
  resolveManagerAuthRuntimeConfig,
  getManagerAppSdkClient,
  getManagerBackendSdkClient,
  resetOperatorAuthenticatedSdkClients,
} from "./sdk";

export * from "./composition";
