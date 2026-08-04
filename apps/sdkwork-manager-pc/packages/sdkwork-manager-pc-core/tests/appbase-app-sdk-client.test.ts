import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY } from "@sdkwork/iam-credential-entry";

import {
  getAppbaseAppSdkClient,
  resetAppbaseAppSdkClient,
} from "../src/sdk/appbaseAppSdkClient";
import {
  getOperatorTokenManager,
  resetOperatorTokenManager,
} from "../src/session/operatorSession";

const BOOTSTRAP_TOKEN = "bootstrap-access-token-fixture";

describe("manager appbase app SDK client credential-entry bootstrap", () => {
  beforeEach(() => {
    resetOperatorTokenManager();
    resetAppbaseAppSdkClient();
    (globalThis as Record<string, unknown>)[
      SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY
    ] = BOOTSTRAP_TOKEN;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[
      SDKWORK_CREDENTIAL_ENTRY_BOOTSTRAP_ACCESS_TOKEN_GLOBAL_KEY
    ];
    resetOperatorTokenManager();
    resetAppbaseAppSdkClient();
  });

  it("installs the injected bootstrap Access-Token into the operator TokenManager", () => {
    const client = getAppbaseAppSdkClient();

    expect(client).toBeDefined();
    expect(getOperatorTokenManager().getTokens().accessToken).toBe(BOOTSTRAP_TOKEN);
  });

  it("re-installs the bootstrap Access-Token after the TokenManager is cleared", () => {
    getAppbaseAppSdkClient();
    resetOperatorTokenManager();

    expect(getOperatorTokenManager().getTokens().accessToken).toBe(BOOTSTRAP_TOKEN);
  });
});
