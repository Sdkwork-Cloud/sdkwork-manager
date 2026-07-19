import { beforeEach, describe, expect, it } from "vitest";

import {
  commitManagerTheme,
  MANAGER_THEME_COLOR,
  MANAGER_THEME_STORAGE_KEY,
  resolveInitialManagerTheme,
} from "../src/bootstrap/theme";

describe("manager theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the technology-blue application palette", () => {
    expect(MANAGER_THEME_COLOR).toBe("tech-blue");
  });

  it("uses the system preference until the operator makes a selection", () => {
    expect(resolveInitialManagerTheme()).toBe("system");

    window.localStorage.setItem(MANAGER_THEME_STORAGE_KEY, "unsupported");
    expect(resolveInitialManagerTheme()).toBe("system");
  });

  it("persists explicit light and dark selections", () => {
    expect(commitManagerTheme("dark")).toBe("dark");
    expect(resolveInitialManagerTheme()).toBe("dark");

    expect(commitManagerTheme("light")).toBe("light");
    expect(window.localStorage.getItem(MANAGER_THEME_STORAGE_KEY)).toBe("light");
  });
});
