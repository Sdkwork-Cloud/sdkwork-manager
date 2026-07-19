import { renderToStaticMarkup } from "react-dom/server";
import type { SdkworkIamOauthAdminController } from "@sdkwork/iam-pc-admin-oauth";
import { describe, expect, it } from "vitest";

import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "../src/i18n/manifest";
import { IamOauthOverview } from "../src/oauth/IamOauthOverview";

describe("manager IAM OAuth overview", () => {
  it("renders localized readiness and inventory without exposing raw errors", () => {
    const controller = {
      getState: () => ({
        accountLinks: [{}],
        callbackEvents: [],
        claimMappings: [{}],
        clients: [{}],
        diagnosticRuns: [],
        flowConfigs: [{}],
        grants: [{}],
        integrations: [{}],
        lastError: "provider-secret-path:/private/oauth.env",
        operationalResources: [],
        operatorPlatforms: [],
        policies: [{}],
        providerCatalog: [{}],
        resourceAccounts: [],
        resourceAuthorizations: [],
        scopeProfiles: [{}],
        secrets: [{}],
        status: "error",
        surfaces: [{}],
        tenantBindings: [],
        webhookConfigs: [],
      }),
    } as SdkworkIamOauthAdminController;
    const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module.oauthOverview;
    const html = renderToStaticMarkup(<IamOauthOverview controller={controller} messages={messages} />);

    expect(html).toContain("OAuth 运行总览");
    expect(html).toContain("接入就绪度");
    expect(html).toContain("配置资产");
    expect(html).toContain("OAuth 运行状态暂时无法加载");
    expect(html).not.toContain("provider-secret-path");
  });
});
