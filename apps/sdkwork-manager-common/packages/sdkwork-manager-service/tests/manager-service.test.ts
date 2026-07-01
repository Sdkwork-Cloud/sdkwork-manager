import { describe, expect, it } from "vitest";

import { formatManagerHeadline, normalizeManagerPreferencesInput } from "../src/index.ts";

describe("manager service", () => {
  it("normalizes pinned app keys with utils helpers", () => {
    const result = normalizeManagerPreferencesInput({
      pinnedAppKeys: [" Docs ", "docs", "Drive"],
      theme: " dark ",
    });

    expect(result.pinnedAppKeys).toEqual(["docs", "drive"]);
    expect(result.theme).toBe("dark");
  });

  it("formats manager headline", () => {
    expect(
      formatManagerHeadline({ pinnedAppKeys: ["docs"], theme: "system" }),
    ).toBe("Manager (system, 1 pinned apps)");
  });
});
