import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SdkworkIamPermissionController } from "@sdkwork/iam-pc-admin-permission";
import { describe, expect, it } from "vitest";

import { IamCatalogWorkspace } from "../src/authorization/IamCatalogWorkspace";
import { MANAGER_IAM_ADMIN_I18N_CATALOG } from "../src/i18n/manifest";

describe("IAM catalog workspace", () => {
  it("renders localized permission controls without English fallback copy", () => {
    const messages = MANAGER_IAM_ADMIN_I18N_CATALOG.resolveMessages("zh-CN").module;
    const html = renderToStaticMarkup(createElement(IamCatalogWorkspace, {
      controller: {} as SdkworkIamPermissionController,
      description: messages.routes.permissions.description,
      kind: "permission",
      messages: messages.catalog,
      title: messages.routes.permissions.label,
    }));

    expect(html).toContain("访问控制 / 权限");
    expect(html).toContain("创建权限");
    expect(html).toContain("正在加载权限");
    expect(html).toContain("manager-iam-editor--permission");
    expect(html).toContain("manager-iam-table--empty");
    expect(html).not.toContain("Create permission");
    expect(html).not.toContain("Loading permission");
  });
});
