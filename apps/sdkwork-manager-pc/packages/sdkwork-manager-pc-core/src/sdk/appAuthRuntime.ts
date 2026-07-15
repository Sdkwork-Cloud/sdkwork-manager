import type {
  SdkworkAuthAppearanceConfig,
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
import {
  clearOperatorTokenManagerTokens,
  getOperatorTokenManager,
} from "../session/operatorSession";
import {
  getManagerAuthenticatedSdkClients,
  resetManagerAuthenticatedSdkClients,
} from "./authenticatedSdkClients";
import { getAppbaseAppSdkClient } from "./appbaseAppSdkClient";
import { resetManagerAuthRuntimeConfig } from "./authRuntimeConfig";

const MANAGER_APP_ID = "sdkwork-manager-pc";

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

function resolveIamEnvironment(): "dev" | "prod" | "test" {
  const value = readEnvValue(
    "VITE_SDKWORK_MANAGER_ENVIRONMENT",
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
  const deploymentProfile = readEnvValue(
    "VITE_SDKWORK_MANAGER_DEPLOYMENT_PROFILE",
    "VITE_SDKWORK_DEPLOYMENT_PROFILE",
  );
  if (deploymentProfile === "cloud") {
    return "saas";
  }
  if (deploymentProfile === "standalone") {
    // The manager initial release is a browser host, not a native desktop shell.
    return "private";
  }
  const value = readEnvValue(
    "VITE_SDKWORK_MANAGER_IAM_DEPLOYMENT_MODE",
    "VITE_SDKWORK_IAM_DEPLOYMENT_MODE",
  );
  if (value === "saas" || value === "private" || value === "local") {
    return value;
  }
  return resolveIamEnvironment() === "dev" ? "private" : "saas";
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
        resetManagerAuthenticatedSdkClients();
      },
    },
    localeProvider: () => "zh-CN",
    sdkClients: getManagerAuthenticatedSdkClients() as SdkworkAppbasePcAuthRuntimeSdkClient[],
    sessionBridge: {
      clearSession: () => {
        clearManagerIamSession();
        clearOperatorTokenManagerTokens();
        resetManagerAuthenticatedSdkClients();
      },
      commitSession: (session) => {
        commitManagerIamSession(session as ManagerIamSession);
        resetManagerAuthenticatedSdkClients();
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
  resetManagerAuthRuntimeConfig();
}

export function resolveManagerAuthAppearance(): SdkworkAuthAppearanceConfig {
  return {
    asidePanelClassName: "manager-auth-aside-panel",
    bodyClassName: "manager-auth-body",
    contentContainerClassName: "manager-auth-content",
    pageClassName: "sdkwork-manager-auth-page",
    qrFrameClassName: "manager-auth-qr-frame",
    shellClassName: "sdkwork-manager-auth-card-shell",
    slotProps: {
      background: {
        className: "manager-auth-background",
      },
      page: {
        className: "sdkwork-manager-auth-page",
      },
      shell: {
        className: "sdkwork-manager-auth-card-shell",
      },
    },
    theme: {
      asideCardBackgroundColor: "var(--manager-auth-aside-card-bg)",
      asideCardBorderColor: "var(--manager-auth-aside-card-border)",
      asidePanelBackgroundColor: "var(--manager-auth-aside-bg)",
      asidePanelBorderColor: "var(--manager-auth-aside-border)",
      asidePanelColor: "var(--manager-auth-aside-text)",
      badgeBackgroundColor: "var(--manager-auth-aside-badge-bg)",
      badgeTextColor: "var(--manager-auth-aside-badge-text)",
      contentBackgroundColor: "var(--manager-auth-content-bg)",
      contentBorderColor: "transparent",
      contentTextColor: "var(--manager-auth-content-text)",
      descriptionColor: "var(--manager-auth-muted-text)",
      dividerColor: "var(--manager-auth-divider)",
      fieldBackgroundColor: "var(--manager-auth-field-bg)",
      fieldBorderColor: "transparent",
      fieldPlaceholderColor: "#9ca3af",
      fieldTextColor: "var(--manager-auth-content-text)",
      formMutedTextColor: "var(--manager-auth-muted-text)",
      iconMutedColor: "var(--manager-auth-muted-text)",
      labelColor: "var(--manager-auth-content-text)",
      pageBackgroundColor: "var(--manager-auth-bg)",
      qrFrameBackgroundColor: "var(--manager-auth-qr-bg)",
      qrFrameBorderColor: "var(--manager-auth-qr-border)",
      shellBackgroundColor: "var(--manager-auth-content-bg)",
      shellBorderColor: "transparent",
      tabActiveBackgroundColor: "var(--manager-auth-tab-active-bg)",
      tabActiveTextColor: "var(--manager-auth-content-text)",
      tabBackgroundColor: "transparent",
      tabInactiveTextColor: "var(--manager-auth-muted-text)",
      titleColor: "var(--manager-auth-content-text)",
    },
  };
}
