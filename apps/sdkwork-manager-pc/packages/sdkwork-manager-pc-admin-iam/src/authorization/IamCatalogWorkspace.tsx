import { useCallback, useEffect, useState } from "react";
import type {
  SdkworkIamPermission,
  SdkworkIamPermissionController,
  SdkworkIamPolicy,
  SdkworkIamRole,
} from "@sdkwork/iam-pc-admin-permission";

import type { ManagerIamAdminModuleMessages } from "../types/i18n";

type Kind = "role" | "permission" | "policy";
type Item = SdkworkIamRole | SdkworkIamPermission | SdkworkIamPolicy;
type CatalogMessages = ManagerIamAdminModuleMessages["catalog"];
type Props = {
  controller: SdkworkIamPermissionController;
  description: string;
  kind: Kind;
  messages: CatalogMessages;
  title: string;
};
type Draft = { action: string; code: string; name: string; resource: string; status: string };
type ErrorNotice = "deleteError" | "loadError" | "saveError";
type SuccessNotice = "deleteSuccess" | "saveSuccess";

const emptyDraft: Draft = { action: "", code: "", name: "", resource: "", status: "" };

function idOf(item: Item, kind: Kind) {
  if (kind === "role") return (item as SdkworkIamRole).roleId;
  if (kind === "permission") return (item as SdkworkIamPermission).permissionId;
  return (item as SdkworkIamPolicy).policyId;
}

function formatMessage(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function IamCatalogWorkspace({ controller, description, kind, messages, title }: Props) {
  const [items, setItems] = useState<readonly Item[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string>();
  const [error, setError] = useState<ErrorNotice>();
  const [notice, setNotice] = useState<SuccessNotice>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const permission = kind === "permission";
  const kindLabel = messages.labels[kind];

  const refresh = useCallback(async () => {
    const nextItems = kind === "role"
      ? await controller.listRoles()
      : kind === "permission"
        ? await controller.listPermissions()
        : await controller.listPolicies();
    setItems(nextItems);
  }, [controller, kind]);

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    void refresh()
      .catch(() => setError("loadError"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const save = async () => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (editing) {
        if (kind === "role") await controller.updateRole(editing, draft);
        if (kind === "permission") await controller.updatePermission(editing, draft);
        if (kind === "policy") await controller.updatePolicy(editing, draft);
      } else {
        if (kind === "role") await controller.createRole(draft);
        if (kind === "permission") await controller.createPermission(draft);
        if (kind === "policy") await controller.createPolicy(draft);
      }
      setDraft(emptyDraft);
      setEditing(undefined);
      setNotice("saveSuccess");
      await refresh();
    } catch {
      setError("saveError");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Item) => {
    const id = idOf(item, kind);
    if (!window.confirm(formatMessage(messages.notices.deleteConfirmTemplate, { name: item.name }))) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (kind === "role") await controller.deleteRole(id);
      if (kind === "permission") await controller.deletePermission(id);
      if (kind === "policy") await controller.deletePolicy(id);
      setNotice("deleteSuccess");
      await refresh();
    } catch {
      setError("deleteError");
    } finally {
      setBusy(false);
    }
  };

  const resetEditor = () => {
    setDraft(emptyDraft);
    setEditing(undefined);
    setError(undefined);
    setNotice(undefined);
  };

  const openEditor = (item: Item) => {
    const details = item as Item & Partial<Draft>;
    setEditing(idOf(item, kind));
    setDraft({
      action: details.action || "",
      code: details.code || "",
      name: item.name,
      resource: details.resource || "",
      status: details.status || "",
    });
    setError(undefined);
    setNotice(undefined);
  };

  const tableColumnCount = permission ? 5 : 4;
  const titleId = `manager-iam-${kind}-title`;

  return (
    <section
      aria-busy={loading || busy}
      aria-labelledby={titleId}
      className="manager-iam-workspace"
    >
      <header className="manager-iam-workspace__header">
        <div>
          <p className="manager-iam-workspace__eyebrow">
            {formatMessage(messages.accessControlTemplate, { kind: title })}
          </p>
          <h2 id={titleId}>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="manager-iam-workspace__count">
          {formatMessage(messages.countTemplate, { count: items.length })}
        </span>
      </header>

      {error ? <p className="manager-iam-workspace__notice manager-iam-workspace__notice--error" role="alert">{messages.notices[error]}</p> : null}
      {notice ? <p className="manager-iam-workspace__notice" role="status">{messages.notices[notice]}</p> : null}

      <form
        className={`manager-iam-editor manager-iam-editor--${kind}`}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="manager-iam-editor__heading">
          <h3>{formatMessage(editing ? messages.editor.editTemplate : messages.editor.createTemplate, { kind: kindLabel })}</h3>
          {editing ? (
            <button className="manager-iam-button manager-iam-button--quiet" disabled={busy} onClick={resetEditor} type="button">
              {messages.editor.cancel}
            </button>
          ) : null}
        </div>

        <label>
          <span>{messages.editor.name}</span>
          <input onChange={(event) => setDraft({ ...draft, name: event.target.value })} required value={draft.name} />
        </label>
        <label>
          <span>{messages.editor.code}</span>
          <input onChange={(event) => setDraft({ ...draft, code: event.target.value })} required={permission} value={draft.code} />
        </label>
        {permission ? (
          <>
            <label>
              <span>{messages.editor.resource}</span>
              <input onChange={(event) => setDraft({ ...draft, resource: event.target.value })} value={draft.resource} />
            </label>
            <label>
              <span>{messages.editor.action}</span>
              <input onChange={(event) => setDraft({ ...draft, action: event.target.value })} value={draft.action} />
            </label>
          </>
        ) : (
          <label>
            <span>{messages.editor.status}</span>
            <input onChange={(event) => setDraft({ ...draft, status: event.target.value })} value={draft.status} />
          </label>
        )}
        <button className="manager-iam-button manager-iam-button--primary" disabled={busy || !draft.name || (permission && !draft.code)} type="submit">
          {editing ? messages.editor.save : formatMessage(messages.editor.createTemplate, { kind: kindLabel })}
        </button>
      </form>

      <div className="manager-iam-table-wrap">
        <table className={`manager-iam-table manager-iam-table--${kind}${loading || !items.length ? " manager-iam-table--empty" : ""}`}>
          <thead>
            <tr>
              <th scope="col">{messages.table.name}</th>
              <th scope="col">{messages.table.code}</th>
              {permission ? <><th scope="col">{messages.table.resource}</th><th scope="col">{messages.table.action}</th></> : <th scope="col">{messages.table.status}</th>}
              <th aria-label={messages.table.actions} scope="col" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="manager-iam-table__empty" colSpan={tableColumnCount} role="status">{formatMessage(messages.loadingTemplate, { kind: kindLabel })}</td></tr>
            ) : items.length ? (
              items.map((item) => {
                const details = item as Item & Partial<Draft>;
                return (
                  <tr key={idOf(item, kind)}>
                    <td><strong>{item.name}</strong></td>
                    <td><code>{details.code || "-"}</code></td>
                    {permission ? <><td>{details.resource || "-"}</td><td>{details.action || "-"}</td></> : <td>{details.status || "-"}</td>}
                    <td className="manager-iam-table__actions">
                      <button className="manager-iam-button manager-iam-button--quiet" disabled={busy} onClick={() => openEditor(item)} type="button">{messages.table.edit}</button>
                      <button className="manager-iam-button manager-iam-button--danger" disabled={busy} onClick={() => void remove(item)} type="button">{messages.table.delete}</button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td className="manager-iam-table__empty" colSpan={tableColumnCount}>{messages.table.empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
