import { describe, expect, it, vi } from "vitest";

import { listAdminPreferences } from "../src/services/preferencesAdminService";
import {
  retrieveManagerPreferences,
  updateManagerPreferences,
} from "../src/services/preferencesAppService";

describe("manager client-core preference services", () => {
  it("retrieves unwrapped manager preferences", async () => {
    const client = {
      manager: {
        preferences: {
          retrieve: vi.fn().mockResolvedValue({
            item: { pinnedAppKeys: ["docs"], theme: "dark" },
          }),
        },
      },
    };

    await expect(retrieveManagerPreferences(client as never)).resolves.toEqual({
      pinnedAppKeys: ["docs"],
      theme: "dark",
    });
  });

  it("lists admin preference summaries from unwrapped page data", async () => {
    const client = {
      manager: {
        preferences: {
          admin: {
            list: vi.fn().mockResolvedValue({
              items: [{ userId: "u-1", theme: "system", pinnedCount: 2 }],
              pageInfo: { mode: "offset", page: 1, pageSize: 20 },
            }),
          },
        },
      },
    };

    await expect(listAdminPreferences(client as never)).resolves.toEqual([
      { userId: "u-1", theme: "system", pinnedCount: 2 },
    ]);
  });

  it("updates manager preferences from unwrapped resource data", async () => {
    const client = {
      manager: {
        preferences: {
          update: vi.fn().mockResolvedValue({
            item: { pinnedAppKeys: ["drive"], theme: "light" },
          }),
        },
      },
    };

    await expect(
      updateManagerPreferences(client as never, {
        pinnedAppKeys: ["drive"],
        theme: "light",
      }),
    ).resolves.toEqual({
      pinnedAppKeys: ["drive"],
      theme: "light",
    });
  });
});
