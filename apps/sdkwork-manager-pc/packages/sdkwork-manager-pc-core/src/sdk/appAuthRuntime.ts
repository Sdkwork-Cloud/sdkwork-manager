import type {
  SdkworkAuthAppearanceConfig,
  SdkworkAuthRuntimeConfig,
  SdkworkIamRuntimeAuthRuntimeLike,
} from "@sdkwork/auth-pc-react";
import {
  createSdkworkAppbasePcAuthRuntime,
  type SdkworkAppbasePcAuthRuntimeComposition,
  type SdkworkAppbasePcAuthRuntimeSdkClient,
} from "@sdkwork/auth-runtime-pc-react";
import { wrapCredentialEntryClient } from "@sdkwork/iam-credential-entry";
import { resolveIamAppApiBaseUrl, readSdkBaseUrlEnvValue } from "@sdkwork/manager-client-core";

import {
  clearManagerIamSession,
  commitManagerIamSession,
  loadManagerIamSession,
  type ManagerIamSession,
} from "../session/iamOperatorSessionBridge";
import { getOperatorTokenManager } from "../session/operatorSession";
import { getAppbaseAppSdkClient } from "./appbaseAppSdkClient";
import {
  getOperatorAuthenticatedSdkClients,
  resetOperatorAuthenticatedSdkClients,
} from "./operatorSdkClients";

const MANAGER_APP_ID = "sdkwork-manager";

let iamRuntimeComposition: SdkworkAppbasePcAuthRuntimeComposition | null = null;

function readEnvValue(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readSdkBaseUrlEnvValue(key);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (["1", "on", "true", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return undefined;
}

function resolveIamEnvironment(): "dev" | "prod" | "test" {
  const value = readEnvValue(
    "VITE_SDKWORK_MANAGER_IAM_ENVIRONMENT",
    "VITE_SDKWORK_IAM_ENVIRONMENT",
  );
  return value === "prod" || value === "production"
    ? "prod"
    : value === "test"
      ? "test"
      : "dev";
}

function resolveIamDeploymentMode(): "local" | "private" | "saas" {
  const value = readEnvValue(
    "VITE_SDKWORK_MANAGER_IAM_DEPLOYMENT_MODE",
    "VITE_SDKWORK_IAM_DEPLOYMENT_MODE",
  );
  return value === "saas" || value === "private" || value === "local" ? value : "saas";
}

function createManagerIamRuntimeComposition(): SdkworkAppbasePcAuthRuntimeComposition {
  const tokenManager = getOperatorTokenManager();
  return createSdkworkAppbasePcAuthRuntime({
    app: {
      appId: MANAGER_APP_ID,
      deploymentMode: resolveIamDeploymentMode(),
      environment: resolveIamEnvironment(),
      platform: "pc",
    },
    baseUrls: {
      appbaseAppApiBaseUrl: resolveIamAppApiBaseUrl(),
    },
    createAppbaseAppClient: () =>
      wrapCredentialEntryClient(getAppbaseAppSdkClient(), { tokenManager }),
    credentialEntry: {
      skipWrap: true,
    },
    hooks: {
      onSessionChanged: () => {
        resetOperatorAuthenticatedSdkClients();
      },
    },
    sdkClients: getOperatorAuthenticatedSdkClients() as SdkworkAppbasePcAuthRuntimeSdkClient[],
    sessionBridge: {
      clearSession: () => {
        clearManagerIamSession();
        resetOperatorAuthenticatedSdkClients();
      },
      commitSession: (session) => {
        commitManagerIamSession(session as ManagerIamSession);
        resetOperatorAuthenticatedSdkClients();
      },
      readSession: () => loadManagerIamSession(),
    },
    tokenManager,
  });
}

export function getManagerIamRuntime(): SdkworkIamRuntimeAuthRuntimeLike {
  if (!iamRuntimeComposition) {
    iamRuntimeComposition = createManagerIamRuntimeComposition();
  }
  return iamRuntimeComposition.runtime as unknown as SdkworkIamRuntimeAuthRuntimeLike;
}

export function resetManagerIamRuntime(): void {
  iamRuntimeComposition = null;
}

function resolveDevelopmentPrefill(): SdkworkAuthRuntimeConfig["developmentPrefill"] {
  const account = readEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_ACCOUNT");
  const email = readEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_EMAIL");
  const phone = readEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_PHONE");
  const password = readEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_PASSWORD");
  const enabled = parseBoolean(readEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_PREFILL_ENABLED"));
  const shouldEnable = enabled ?? Boolean(account || email || phone || password);
  if (!shouldEnable) {
    return undefined;
  }
  return {
    account: account || email || phone,
    email,
    enabled: true,
    loginMethod: "password",
    password,
    phone,
  };
}

export function resolveManagerAuthRuntimeConfig(): SdkworkAuthRuntimeConfig {
  const developmentPrefill = resolveDevelopmentPrefill();
  return {
    leftRailMode: "qr-only",
    loginMethods: ["password"],
    oauthLoginEnabled: false,
    oauthProviders: [],
    qrLoginEnabled: true,
    recoveryMethods: [],
    registerMethods: ["email", "phone"],
    verificationPolicy: {
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    },
    ...(developmentPrefill ? { developmentPrefill } : {}),
  };
}

export function resolveManagerAuthAppearance(): SdkworkAuthAppearanceConfig {
  return {
    pageClassName: "sdkwork-manager-auth-page",
    shellClassName: "sdkwork-manager-auth-shell",
    theme: {
      pageBackgroundColor: "#f6f8fb",
    },
  };
}
