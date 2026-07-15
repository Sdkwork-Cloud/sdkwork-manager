import type { SdkworkAuthRuntimeConfig } from "@sdkwork/auth-pc-react";
import {
  isSdkworkAuthLoginMethod,
  isSdkworkAuthRecoveryMethod,
  isSdkworkAuthRegisterMethod,
  resolveSdkworkAuthRuntimeConfigFromMetadata,
  type SdkworkAuthVerificationPolicyConfig,
  type SdkworkCanonicalAuthMetadataLike,
} from "@sdkwork/iam-contracts";
import { readSdkBaseUrlEnvValue } from "@sdkwork/manager-client-core";

import { getAppbaseAppSdkClient } from "./appbaseAppSdkClient";

type JsonRecord = Record<string, unknown>;

let managerAuthRuntimeConfigPromise: Promise<SdkworkAuthRuntimeConfig> | null = null;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapSdkData(value: unknown, source: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${source} metadata is unavailable`);
  }
  if ("code" in value) {
    if (value.code !== 0 || !isRecord(value.data)) {
      throw new Error(`${source} metadata is invalid`);
    }
    return value.data;
  }
  return value;
}

function readRecord(record: JsonRecord, key: string): JsonRecord {
  return isRecord(record[key]) ? record[key] : {};
}

function readBoolean(record: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function readRequiredBoolean(record: JsonRecord, source: string, ...keys: string[]): boolean {
  const value = readBoolean(record, ...keys);
  if (value === undefined) {
    throw new Error(`${source} is required`);
  }
  return value;
}

function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readStringArray(record: JsonRecord, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return items.length > 0 ? [...new Set(items)] : [];
}

function readRequiredStringArray(record: JsonRecord, key: string, source: string): string[] {
  const values = readStringArray(record, key);
  if (!values) {
    throw new Error(`${source} is required`);
  }
  return values;
}

function readOAuthProviders(auth: JsonRecord, runtime: JsonRecord): string[] {
  const configured = readStringArray(auth, "oauthProviders");
  if (configured) {
    return configured.filter((provider) => /^[A-Za-z0-9_-]{1,64}$/u.test(provider));
  }
  const oauthLogin = readRecord(readRecord(runtime, "accountBinding"), "oauthLogin");
  return (readStringArray(oauthLogin, "allowedProviders") ?? [])
    .filter((provider) => /^[A-Za-z0-9_-]{1,64}$/u.test(provider));
}

function resolveOAuthProviderRegion(auth: JsonRecord): "mainland" | "overseas" | undefined {
  const region = readString(auth, "oauthProviderRegion")?.toLowerCase();
  if (region === "mainland") {
    return "mainland";
  }
  if (region === "overseas" || region === "global") {
    return "overseas";
  }
  return undefined;
}

function resolveContactMethods(runtime: JsonRecord, policy: JsonRecord): Array<"email" | "phone"> {
  const runtimeContact = readRecord(readRecord(runtime, "accountBinding"), "contactBinding");
  const policyContact = readRecord(readRecord(policy, "accountBinding"), "contactBinding");
  const emailEnabled = readBoolean(policyContact, "emailEnabled")
    ?? readBoolean(runtimeContact, "emailEnabled")
    ?? false;
  const phoneEnabled = readBoolean(policyContact, "phoneEnabled")
    ?? readBoolean(runtimeContact, "phoneEnabled")
    ?? false;
  return [
    ...(emailEnabled ? ["email" as const] : []),
    ...(phoneEnabled ? ["phone" as const] : []),
  ];
}

function resolveVerificationPolicy(
  auth: JsonRecord,
  runtime: JsonRecord,
  policy: JsonRecord,
): SdkworkAuthVerificationPolicyConfig {
  return {
    emailCodeLoginEnabled: readRequiredBoolean(
      policy,
      "IAM emailCodeLoginEnabled",
      "emailCodeLoginEnabled",
    ),
    emailRegistrationVerificationRequired:
      readRequiredBoolean(
        policy,
        "IAM emailRegistrationVerificationRequired",
        "emailRegistrationVerificationRequired",
        "emailRegisterVerificationRequired",
      ),
    oauthLoginEnabled: readRequiredBoolean(
      auth,
      "IAM oauthLoginEnabled",
      "oauthLoginEnabled",
    ),
    phoneCodeLoginEnabled: readRequiredBoolean(
      policy,
      "IAM phoneCodeLoginEnabled",
      "phoneCodeLoginEnabled",
    ),
    phoneRegistrationVerificationRequired:
      readRequiredBoolean(
        policy,
        "IAM phoneRegistrationVerificationRequired",
        "phoneRegistrationVerificationRequired",
        "phoneRegisterVerificationRequired",
      ),
  };
}

function resolveDevelopmentPrefill(): SdkworkAuthRuntimeConfig["developmentPrefill"] {
  const account = readSdkBaseUrlEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_ACCOUNT");
  const email = readSdkBaseUrlEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_EMAIL");
  const phone = readSdkBaseUrlEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_PHONE");
  const password = readSdkBaseUrlEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_DEFAULT_PASSWORD");
  const enabledValue = readSdkBaseUrlEnvValue("VITE_SDKWORK_MANAGER_AUTH_DEV_PREFILL_ENABLED")
    ?.trim()
    .toLowerCase();
  const enabled = enabledValue
    ? ["1", "on", "true", "yes"].includes(enabledValue)
    : undefined;
  if (!(enabled ?? Boolean(account || email || phone || password))) {
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
  return {
    leftRailMode: "highlights-only",
    loginMethods: [],
    oauthLoginEnabled: false,
    oauthProviders: [],
    qrLoginEnabled: false,
    recoveryMethods: [],
    registerMethods: [],
    sdkworkOAuthProviderEnabled: false,
    verificationPolicy: {
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      oauthLoginEnabled: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    },
  };
}

export function resolveManagerAuthRuntimeConfigFromMetadata(
  runtimeValue: unknown,
  verificationPolicyValue: unknown,
): SdkworkAuthRuntimeConfig {
  const runtime = unwrapSdkData(runtimeValue, "IAM runtime");
  const auth = runtime.auth;
  if (!isRecord(auth)) {
    throw new Error("IAM runtime auth metadata is required");
  }
  const policy = unwrapSdkData(verificationPolicyValue, "IAM verification policy");
  const verificationPolicy = resolveVerificationPolicy(auth, runtime, policy);
  const contactMethods = resolveContactMethods(runtime, policy);
  const registrationEnabled = readRequiredBoolean(
    policy,
    "IAM registrationEnabled",
    "registrationEnabled",
  );
  const configuredRegisterMethods = readStringArray(auth, "registerMethods")
    ?.filter(isSdkworkAuthRegisterMethod);
  const configuredRecoveryMethods = readStringArray(auth, "recoveryMethods")
    ?.filter(isSdkworkAuthRecoveryMethod);
  const qrLoginEnabled = readRequiredBoolean(policy, "IAM qrLoginEnabled", "qrLoginEnabled");
  const loginMethods = readRequiredStringArray(auth, "loginMethods", "IAM loginMethods")
    .filter(isSdkworkAuthLoginMethod);
  const supportsLocalCredentials = readBoolean(auth, "supportsLocalCredentials");
  const supportsSessionExchange = readBoolean(auth, "supportsSessionExchange");
  const sdkworkOAuthProviderEnabled = readBoolean(auth, "sdkworkOAuthProviderEnabled");
  const metadata: SdkworkCanonicalAuthMetadataLike = {
    loginMethods,
    oauthLoginEnabled: verificationPolicy.oauthLoginEnabled,
    oauthProviders: readOAuthProviders(auth, runtime),
    qrLoginEnabled,
    recoveryMethods: configuredRecoveryMethods !== undefined
      ? configuredRecoveryMethods
      : contactMethods,
    registerMethods: registrationEnabled
      ? (configuredRegisterMethods ?? contactMethods)
      : [],
    ...(typeof sdkworkOAuthProviderEnabled === "boolean" ? { sdkworkOAuthProviderEnabled } : {}),
    ...(typeof supportsLocalCredentials === "boolean" ? { supportsLocalCredentials } : {}),
    ...(typeof supportsSessionExchange === "boolean" ? { supportsSessionExchange } : {}),
    verificationPolicy,
    ...(resolveOAuthProviderRegion(auth)
      ? { oauthProviderRegion: resolveOAuthProviderRegion(auth) }
      : {}),
  };
  const resolved = resolveSdkworkAuthRuntimeConfigFromMetadata(metadata);
  const developmentPrefill = resolveDevelopmentPrefill();
  return {
    ...resolved,
    loginMethods,
    oauthLoginEnabled: verificationPolicy.oauthLoginEnabled,
    oauthProviders: [...(metadata.oauthProviders ?? [])],
    // QR availability is an IAM capability; the rail is a host presentation choice.
    leftRailMode: "highlights-only",
    qrLoginEnabled,
    recoveryMethods: metadata.recoveryMethods?.filter(isSdkworkAuthRecoveryMethod) ?? [],
    registerMethods: registrationEnabled
      ? metadata.registerMethods?.filter(isSdkworkAuthRegisterMethod) ?? []
      : [],
    ...(typeof sdkworkOAuthProviderEnabled === "boolean" ? { sdkworkOAuthProviderEnabled } : {}),
    verificationPolicy,
    ...(developmentPrefill ? { developmentPrefill } : {}),
  };
}

export function loadManagerAuthRuntimeConfig(): Promise<SdkworkAuthRuntimeConfig> {
  if (!managerAuthRuntimeConfigPromise) {
    const client = getAppbaseAppSdkClient();
    const request = Promise.all([
      client.system.iam.runtime.retrieve(),
      client.system.iam.verificationPolicy.retrieve(),
    ]).then(([runtime, verificationPolicy]) =>
      resolveManagerAuthRuntimeConfigFromMetadata(runtime, verificationPolicy));
    managerAuthRuntimeConfigPromise = request;
    void request.catch(() => {
      if (managerAuthRuntimeConfigPromise === request) {
        managerAuthRuntimeConfigPromise = null;
      }
    });
  }
  return managerAuthRuntimeConfigPromise;
}

export function resetManagerAuthRuntimeConfig(): void {
  managerAuthRuntimeConfigPromise = null;
}
