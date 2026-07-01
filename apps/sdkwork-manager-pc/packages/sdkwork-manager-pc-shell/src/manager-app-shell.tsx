import { useEffect, useMemo, useState } from "react";
import { retrieveManagerPreferences } from "@sdkwork/manager-client-core";
import {
  describeManager,
  getManagerAppSdkClient,
  getManagerBackendSdkClient,
  loadOperatorSession,
  type OperatorSession,
} from "@sdkwork/manager-pc-core";
import type { ManagerPreferences } from "@sdkwork/manager-contracts";

import { PreferenceAdminPanel } from "./preference-admin-panel";
import { PreferenceEditorPanel } from "./preference-editor-panel";

function resolveOperatorSession(): OperatorSession | null {
  return loadOperatorSession();
}

export function ManagerAppShell() {
  const [session] = useState<OperatorSession | null>(() => resolveOperatorSession());
  const appClient = useMemo(() => getManagerAppSdkClient(), [session]);
  const backendClient = useMemo(() => getManagerBackendSdkClient(), [session]);
  const [preferences, setPreferences] = useState<ManagerPreferences | null>(null);
  const [status, setStatus] = useState<string>("Loading preferences…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const item = await retrieveManagerPreferences(appClient);
        if (cancelled) {
          return;
        }
        setPreferences(item);
        setStatus("Preferences loaded via generated manager app SDK.");
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Failed to load preferences");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appClient]);

  const headline = preferences ? describeManager(preferences) : "Manager preferences unavailable";

  return (
    <main className="manager-shell">
      <section className="manager-card">
        <h1>SDKWork Manager</h1>
        <p>{headline}</p>
        <p>{status}</p>
        {error ? <p role="alert">{error}</p> : null}
        <p>Operator console aligned with sdkwork-specs: IAM session, generated SDK, and standard API envelope.</p>
      </section>
      {preferences ? (
        <PreferenceEditorPanel
          appClient={appClient}
          preferences={preferences}
          onUpdated={(next) => setPreferences(next)}
        />
      ) : null}
      <PreferenceAdminPanel session={session} backendClient={backendClient} />
    </main>
  );
}
