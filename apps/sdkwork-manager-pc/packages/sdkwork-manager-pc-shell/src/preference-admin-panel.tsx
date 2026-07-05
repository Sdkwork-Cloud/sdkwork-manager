import { useCallback, useEffect, useState } from "react";
import { listAdminPreferences } from "@sdkwork/manager-client-core";
import type { OperatorSession } from "@sdkwork/manager-pc-core";
import type { AdminPreferenceSummary } from "@sdkwork/manager-contracts";
import type { SdkworkBackendClient } from "@sdkwork/manager-backend-sdk";

interface PreferenceAdminPanelProps {
  session: OperatorSession | null;
  backendClient: SdkworkBackendClient;
}

export function PreferenceAdminPanel({ session, backendClient }: PreferenceAdminPanelProps) {
  const [items, setItems] = useState<AdminPreferenceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasSession = Boolean(session?.accessToken || session?.authToken);

  const refresh = useCallback(async () => {
    if (!hasSession) {
      setItems([]);
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const nextItems = await listAdminPreferences(backendClient);
      setItems(nextItems);
    } catch (cause: unknown) {
      setStatusMessage(cause instanceof Error ? cause.message : "Failed to load admin preferences");
    } finally {
      setLoading(false);
    }
  }, [backendClient, hasSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section aria-labelledby="preference-admin-heading" className="manager-admin-panel">
      <h2 id="preference-admin-heading">Tenant preference summaries</h2>
      {!hasSession ? (
        <p className="manager-muted">Sign in to list tenant preference summaries.</p>
      ) : null}
      {loading ? <p>Loading tenant preferences…</p> : null}
      <div className="manager-admin-actions">
        <button type="button" onClick={() => void refresh()} disabled={!hasSession}>
          Refresh
        </button>
      </div>
      <ul className="manager-admin-list">
        {items.map((item) => (
          <li key={item.userId} className="manager-admin-list-item">
            <strong>{item.userId}</strong>
            <span>
              {item.theme} · {item.pinnedCount} pinned
            </span>
          </li>
        ))}
      </ul>
      {!loading && hasSession && items.length === 0 ? (
        <p className="manager-muted">No preference rows for this tenant yet.</p>
      ) : null}
      {statusMessage ? <p role="alert">{statusMessage}</p> : null}
    </section>
  );
}
