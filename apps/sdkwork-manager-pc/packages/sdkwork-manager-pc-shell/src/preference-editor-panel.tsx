import { useState } from "react";
import { updateManagerPreferences } from "@sdkwork/manager-client-core";
import { buildManagerPreferencesDraft } from "@sdkwork/manager-pc-core";
import type { ManagerPreferences } from "@sdkwork/manager-contracts";
import type { SdkworkAppClient } from "sdkwork-manager-app-sdk-generated-typescript";

interface PreferenceEditorPanelProps {
  appClient: SdkworkAppClient;
  preferences: ManagerPreferences;
  onUpdated: (next: ManagerPreferences) => void;
}

export function PreferenceEditorPanel({
  appClient,
  preferences,
  onUpdated,
}: PreferenceEditorPanelProps) {
  const [theme, setTheme] = useState(preferences.theme);
  const [pinnedInput, setPinnedInput] = useState(preferences.pinnedAppKeys.join(", "));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const draft = buildManagerPreferencesDraft({
        theme,
        pinnedAppKeys: pinnedInput
          .split(",")
          .map((key) => key.trim())
          .filter(Boolean),
      });
      const next = await updateManagerPreferences(appClient, draft);
      onUpdated(next);
      setTheme(next.theme);
      setPinnedInput(next.pinnedAppKeys.join(", "));
      setStatus("Preferences saved.");
    } catch (cause: unknown) {
      setStatus(cause instanceof Error ? cause.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="preference-editor-heading" className="manager-admin-panel">
      <h2 id="preference-editor-heading">My preferences</h2>
      <label className="manager-field">
        Theme
        <select value={theme} onChange={(event) => setTheme(event.target.value)}>
          <option value="system">system</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>
      <label className="manager-field">
        Pinned app keys (comma-separated)
        <input
          type="text"
          value={pinnedInput}
          onChange={(event) => setPinnedInput(event.target.value)}
          placeholder="docs, drive, manager"
        />
      </label>
      <div className="manager-admin-actions">
        <button type="button" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
      {status ? <p className="manager-muted">{status}</p> : null}
    </section>
  );
}
