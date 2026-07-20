import type { SdkworkIamService } from "@sdkwork/iam-service";
import { describe, expect, it, vi } from "vitest";

import { createIamOauthAccountController } from "../src/services/oauthAccountController";

function createServiceFixture() {
  const integrationsCreate = vi.fn().mockResolvedValue({ item: { integrationId: "integration-1" } });
  const clientsCreate = vi.fn().mockResolvedValue({ item: { oauthClientId: "client-1" } });
  const secretsCreate = vi.fn().mockResolvedValue({ item: { secretId: "secret-1" } });
  const surfacesCreate = vi.fn().mockResolvedValue({ item: { surfaceId: "surface-1" } });
  const service = {
    iam: {
      oauth: {
        providerCatalog: {
          list: vi.fn().mockResolvedValue({ items: [{ id: "catalog-mini", providerCode: "wechat_mini_program", providerDisplayName: "WeChat Mini Program" }] }),
        },
        integrations: {
          create: integrationsCreate,
          delete: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue({ items: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
        clients: {
          create: clientsCreate,
          delete: vi.fn().mockResolvedValue(undefined),
          list: vi.fn().mockResolvedValue({ items: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
        secrets: {
          create: secretsCreate,
          list: vi.fn().mockResolvedValue({ items: [] }),
        },
        surfaces: {
          create: surfacesCreate,
          list: vi.fn().mockResolvedValue({ items: [] }),
          update: vi.fn().mockResolvedValue({}),
        },
      },
      tenantApplications: {
        list: vi.fn().mockResolvedValue({
          items: [{ appId: "demo-app", displayName: "Demo App", environment: "production", status: "enabled", tenantApplicationId: "tenant-app-1" }],
        }),
      },
    },
  } as unknown as SdkworkIamService;
  return { clientsCreate, integrationsCreate, secretsCreate, service, surfacesCreate };
}

describe("IAM OAuth account controller", () => {
  it("creates a Mini Program account with application binding and a write-only secret", async () => {
    const fixture = createServiceFixture();
    const controller = createIamOauthAccountController({ service: fixture.service, tenantId: "tenant-1" });
    await controller.load();

    await controller.saveAccount({
      appId: "demo-app",
      clientId: "wx-app-id",
      displayName: "Demo Mini Program",
      enabled: true,
      environment: "production",
      kind: "mini_program",
      miniProgramEnvironment: "release",
      miniProgramOriginalId: "gh_demo",
      providerCatalogId: "catalog-mini",
      providerCode: "wechat_mini_program",
      providerTenantId: "",
      redirectUri: "",
      secretValue: "provider-secret",
    });

    expect(fixture.integrationsCreate).toHaveBeenCalledWith(expect.objectContaining({
      appId: "demo-app",
      enabled: true,
      environment: "production",
      providerCatalogId: "catalog-mini",
      providerCode: "wechat_mini_program",
    }));
    expect(fixture.clientsCreate).toHaveBeenCalledWith(expect.objectContaining({
      integrationId: "integration-1",
      providerClientId: "wx-app-id",
    }));
    expect(fixture.surfacesCreate).toHaveBeenCalledWith(expect.objectContaining({
      miniProgramAppId: "wx-app-id",
      miniProgramEnvironment: "release",
      miniProgramOriginalId: "gh_demo",
      oauthClientId: "client-1",
      surfaceKind: "mini_program",
    }));
    expect(fixture.secretsCreate).toHaveBeenCalledWith({
      secretKind: "client_secret",
      secretOwnerId: "client-1",
      secretOwnerKind: "oauth_client",
      secretValue: "provider-secret",
    });
    expect(JSON.stringify(fixture.secretsCreate.mock.calls)).not.toContain("secretRef");
  });

  it("normalizes account, credential, and application relationships from SDK responses", async () => {
    const fixture = createServiceFixture();
    const oauth = (fixture.service as never as { iam: { oauth: Record<string, { list: ReturnType<typeof vi.fn> }> } }).iam.oauth;
    oauth.integrations.list.mockResolvedValue({ items: [{ appId: "demo-app", enabled: true, environment: "production", id: "integration-1", providerCatalogId: "catalog-mini", providerCode: "wechat_mini_program", displayName: "Demo Mini Program" }] });
    oauth.clients.list.mockResolvedValue({ items: [{ id: "client-1", integrationId: "integration-1", providerClientId: "wx-app-id", secretConfigStatus: "configured" }] });
    oauth.secrets.list.mockResolvedValue({ items: [{ oauthClientId: "client-1" }] });
    oauth.surfaces.list.mockResolvedValue({ items: [{ id: "surface-1", integrationId: "integration-1", miniProgramEnvironment: "release", miniProgramOriginalId: "gh_demo" }] });

    const state = await createIamOauthAccountController({ service: fixture.service, tenantId: "tenant-1" }).load();

    expect(state.accounts).toEqual([expect.objectContaining({
      appId: "demo-app",
      applicationName: "Demo App",
      clientId: "wx-app-id",
      kind: "mini_program",
      secretConfigured: true,
      surfaceId: "surface-1",
    })]);
  });
});
