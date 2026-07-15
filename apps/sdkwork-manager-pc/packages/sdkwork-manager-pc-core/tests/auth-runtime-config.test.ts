import { describe, expect, it } from "vitest";

import {
  resolveManagerAuthRuntimeConfig,
  resolveManagerAuthRuntimeConfigFromMetadata,
} from "../src/sdk/authRuntimeConfig";

describe("manager IAM auth runtime config", () => {
  it("keeps IAM capabilities disabled until canonical metadata is available", () => {
    const config = resolveManagerAuthRuntimeConfig();

    expect(config.leftRailMode).toBe("highlights-only");
    expect(config.qrLoginEnabled).toBe(false);
    expect(config.registerMethods).toEqual([]);
    expect(config.recoveryMethods).toEqual([]);
    expect(config.loginMethods).toEqual([]);
    expect(config.verificationPolicy).toEqual({
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      oauthLoginEnabled: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
  });

  it("maps the canonical IAM runtime and verification policy responses", () => {
    const config = resolveManagerAuthRuntimeConfigFromMetadata(
      {
        code: 0,
        data: {
          accountBinding: {
            contactBinding: {
              emailEnabled: true,
              phoneEnabled: true,
            },
            oauthLogin: {
              allowedProviders: [],
              enabled: false,
            },
          },
          auth: {
            loginMethods: ["password", "sessionBridge"],
            oauthLoginEnabled: false,
            oauthProviderRegion: "global",
            oauthProviders: [],
            sdkworkOAuthProviderEnabled: true,
            supportsLocalCredentials: true,
            supportsSessionExchange: true,
          },
        },
      },
      {
        code: 0,
        data: {
          emailCodeLoginEnabled: false,
          emailRegistrationVerificationRequired: false,
          phoneCodeLoginEnabled: false,
          phoneRegistrationVerificationRequired: false,
          qrLoginEnabled: true,
          registrationEnabled: true,
        },
      },
    );

    expect(config.loginMethods).toEqual(["password", "sessionBridge"]);
    expect(config.oauthLoginEnabled).toBe(false);
    expect(config.oauthProviderRegion).toBe("overseas");
    expect(config.qrLoginEnabled).toBe(true);
    expect(config.leftRailMode).toBe("highlights-only");
    expect(config.registerMethods).toEqual(["email", "phone"]);
    expect(config.recoveryMethods).toEqual(["email", "phone"]);
    expect(config.verificationPolicy).toEqual({
      emailCodeLoginEnabled: false,
      emailRegistrationVerificationRequired: false,
      oauthLoginEnabled: false,
      phoneCodeLoginEnabled: false,
      phoneRegistrationVerificationRequired: false,
    });
  });

  it("fails closed when IAM disables registration, QR, and contact recovery", () => {
    const config = resolveManagerAuthRuntimeConfigFromMetadata(
      {
          auth: {
            loginMethods: ["password", "emailCode"],
            oauthLoginEnabled: true,
            oauthProviders: ["github"],
            sdkworkOAuthProviderEnabled: false,
            supportsLocalCredentials: true,
            supportsSessionExchange: false,
          },
      },
      {
        accountBinding: {
          contactBinding: {
            emailEnabled: false,
            phoneEnabled: false,
          },
        },
        emailCodeLoginEnabled: true,
        emailRegistrationVerificationRequired: false,
        phoneCodeLoginEnabled: false,
        phoneRegistrationVerificationRequired: false,
        qrLoginEnabled: false,
        registrationEnabled: false,
      },
    );

    expect(config.loginMethods).toEqual(["password", "emailCode"]);
    expect(config.oauthLoginEnabled).toBe(true);
    expect(config.oauthProviders).toEqual(["github"]);
    expect(config.leftRailMode).toBe("highlights-only");
    expect(config.qrLoginEnabled).toBe(false);
    expect(config.registerMethods).toEqual([]);
    expect(config.recoveryMethods).toEqual([]);
  });

  it("rejects incomplete IAM policy metadata instead of inferring local defaults", () => {
    expect(() => resolveManagerAuthRuntimeConfigFromMetadata(
      { code: 0, data: { auth: { loginMethods: ["password"] } } },
      { code: 0, data: { qrLoginEnabled: true } },
    )).toThrow(/IAM/);
  });
});
