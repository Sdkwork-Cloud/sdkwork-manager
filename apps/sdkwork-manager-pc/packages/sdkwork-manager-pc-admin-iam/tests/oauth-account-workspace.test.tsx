import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "../src/i18n/manifest";
import { IamOauthAccountWorkspace } from "../src/oauth/IamOauthAccountWorkspace";
import type { IamOauthAccountController } from "../src/oauth/oauthAccountTypes";

describe("IAM OAuth account workspace", () => {
  it("renders provider account configuration around applications and credentials", () => {
    const controller = {
      getState: () => ({
        accounts: [{
          appId: "demo-app",
          applicationName: "Demo App",
          clientId: "wx-app-id",
          clientRecordId: "client-1",
          displayName: "Demo Mini Program",
          enabled: true,
          environment: "production",
          healthStatus: "healthy",
          integrationId: "integration-1",
          kind: "mini_program",
          miniProgramEnvironment: "release",
          miniProgramOriginalId: "gh_demo",
          providerCatalogId: "catalog-mini",
          providerCode: "wechat_mini_program",
          providerTenantId: "",
          redirectUri: "",
          secretConfigured: true,
          surfaceId: "surface-1",
        }],
        applications: [{ appId: "demo-app", displayName: "Demo App", environment: "production", status: "enabled", tenantApplicationId: "tenant-app-1" }],
        providers: [{ catalogId: "catalog-mini", code: "wechat_mini_program", displayName: "WeChat Mini Program", kind: "mini_program" }],
        status: "ready",
      }),
    } as unknown as IamOauthAccountController;
    const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.oauthAccounts;
    const html = renderToStaticMarkup(<IamOauthAccountWorkspace canManage controller={controller} messages={messages} view="accounts" />);

    expect(html).toContain("Demo Mini Program");
    expect(html).toContain("Demo App");
    expect(html).toContain("集成账号");
    expect(html).toContain("配置完整");
    expect(html).toContain("小程序");
    expect(html).not.toContain("Claim Mapping");
  });
});
