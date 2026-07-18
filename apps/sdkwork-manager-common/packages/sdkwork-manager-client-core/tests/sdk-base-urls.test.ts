import { describe, expect, it } from "vitest";

import {
  resolveIamAppApiBaseUrl,
  resolveIamBackendApiBaseUrl,
  resolvePlatformApiGatewayBaseUrl,
} from "../src/config/sdkBaseUrls";

const standaloneEnv = {
  DEV: false,
  VITE_SDKWORK_MANAGER_APPLICATION_PUBLIC_HTTP_URL: "http://127.0.0.1:18092",
  VITE_SDKWORK_MANAGER_DEPLOYMENT_PROFILE: "standalone",
  VITE_SDKWORK_MANAGER_PLATFORM_API_GATEWAY_HTTP_URL: "http://127.0.0.1:3900",
} as const;

describe("manager SDK base URL topology", () => {
  it("routes standalone dependency SDKs through the application ingress", () => {
    expect(resolveIamAppApiBaseUrl(undefined, standaloneEnv)).toBe(
      "http://127.0.0.1:18092",
    );
    expect(resolveIamBackendApiBaseUrl(undefined, standaloneEnv)).toBe(
      "http://127.0.0.1:18092",
    );
    expect(resolvePlatformApiGatewayBaseUrl(undefined, standaloneEnv)).toBe(
      "http://127.0.0.1:18092",
    );
  });

  it("routes cloud IAM SDKs through the application assembly ingress", () => {
    const cloudEnv = {
      ...standaloneEnv,
      VITE_SDKWORK_MANAGER_DEPLOYMENT_PROFILE: "cloud",
    } as const;

    expect(resolveIamAppApiBaseUrl(undefined, cloudEnv)).toBe(
      "http://127.0.0.1:18092",
    );
    expect(resolveIamBackendApiBaseUrl(undefined, cloudEnv)).toBe(
      "http://127.0.0.1:18092",
    );
    expect(resolvePlatformApiGatewayBaseUrl(undefined, cloudEnv)).toBe(
      "http://127.0.0.1:3900",
    );
  });
});
