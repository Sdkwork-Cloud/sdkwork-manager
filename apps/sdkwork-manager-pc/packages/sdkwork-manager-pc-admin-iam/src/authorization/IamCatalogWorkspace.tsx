import { useCallback, useEffect, useState } from "react";
import {
  ConfirmDialog,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@sdkwork/ui-pc-react";
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
  permissions: {
    create: boolean;
    delete: boolean;
    update: boolean;
  };
  title: string;
};
type Draft = {
  action: string;
  code: string;
  name: string;
  resource: string;
  status: string;
};
type ErrorNotice = "deleteError" | "loadError" | "saveError";
type SuccessNotice = "deleteSuccess" | "saveSuccess";

const emptyDraft: Draft = {
  action: "",
  code: "",
  name: "",
  resource: "",
  status: "",
};

function idOf(item: Item, kind: Kind) {
  if (kind === "role") return (item as SdkworkIamRole).roleId;
  if (kind === "permission") return (item as SdkworkIamPermission).permissionId;
  return (item as SdkworkIamPolicy).policyId;
}

function formatMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function IamCatalogWorkspace({
  controller,
  description,
  kind,
  messages,
  permissions,
  title,
}: Props) {
  const [items, setItems] = useState<readonly Item[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item>();
  const [error, setError] = useState<ErrorNotice>();
  const [notice, setNotice] = useState<SuccessNotice>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const permission = kind === "permission";
  const kindLabel = messages.labels[kind];

  const refresh = useCallback(async () => {
    const nextItems =
      kind === "role"
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
    if ((editing && !permissions.update) || (!editing && !permissions.create)) return;
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (editing) {
        if (kind === "role") await controller.updateRole(editing, draft);
        if (kind === "permission")
          await controller.updatePermission(editing, draft);
        if (kind === "policy") await controller.updatePolicy(editing, draft);
      } else {
        if (kind === "role") await controller.createRole(draft);
        if (kind === "permission") await controller.createPermission(draft);
        if (kind === "policy") await controller.createPolicy(draft);
      }
      setDraft(emptyDraft);
      setEditing(undefined);
      setEditorOpen(false);
      setNotice("saveSuccess");
      await refresh();
    } catch {
      setError("saveError");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget || !permissions.delete) return;
    const id = idOf(deleteTarget, kind);
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      if (kind === "role") await controller.deleteRole(id);
      if (kind === "permission") await controller.deletePermission(id);
      if (kind === "policy") await controller.deletePolicy(id);
      setNotice("deleteSuccess");
      await refresh();
      setDeleteTarget(undefined);
    } catch {
      setError("deleteError");
    } finally {
      setBusy(false);
    }
  };

  const resetEditor = () => {
    setDraft(emptyDraft);
    setEditing(undefined);
    setEditorOpen(false);
    setError(undefined);
    setNotice(undefined);
  };

  const openEditor = (item: Item) => {
    const details = item as Item & Partial<Draft>;
    setEditing(idOf(item, kind));
    setEditorOpen(true);
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
  return (
    <section
      aria-busy={loading || busy}
      aria-label={title}
      className="manager-iam-workspace"
    >
      <div className="manager-iam-workspace__toolbar">
        <span className="manager-iam-workspace__count">
          {formatMessage(messages.countTemplate, { count: items.length })}
        </span>
        {permissions.create ? (
          <button
            className="manager-iam-button manager-iam-button--primary"
            disabled={busy}
            onClick={() => {
              setDraft(emptyDraft);
              setEditing(undefined);
              setError(undefined);
              setNotice(undefined);
              setEditorOpen(true);
            }}
            type="button"
          >
            {formatMessage(messages.editor.createTemplate, { kind: kindLabel })}
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          className="manager-iam-workspace__notice manager-iam-workspace__notice--error"
          role="alert"
        >
          {messages.notices[error]}
        </p>
      ) : null}
      {notice ? (
        <p className="manager-iam-workspace__notice" role="status">
          {messages.notices[notice]}
        </p>
      ) : null}

      <Drawer
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) resetEditor();
        }}
      >
        <DrawerContent size="md">
          <form
            className="manager-iam-drawer-form"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <DrawerHeader>
              <DrawerTitle>
                {formatMessage(
                  editing
                    ? messages.editor.editTemplate
                    : messages.editor.createTemplate,
                  { kind: kindLabel },
                )}
              </DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody
              className={`manager-iam-editor manager-iam-editor--${kind}`}
            >
              <label>
                <span>{messages.editor.name}</span>
                <input
                  autoFocus
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  required
                  value={draft.name}
                />
              </label>
              <label>
                <span>{messages.editor.code}</span>
                <input
                  onChange={(event) =>
                    setDraft({ ...draft, code: event.target.value })
                  }
                  required={permission}
                  value={draft.code}
                />
              </label>
              {permission ? (
                <>
                  <label>
                    <span>{messages.editor.resource}</span>
                    <input
                      onChange={(event) =>
                        setDraft({ ...draft, resource: event.target.value })
                      }
                      value={draft.resource}
                    />
                  </label>
                  <label>
                    <span>{messages.editor.action}</span>
                    <input
                      onChange={(event) =>
                        setDraft({ ...draft, action: event.target.value })
                      }
                      value={draft.action}
                    />
                  </label>
                </>
              ) : (
                <label>
                  <span>{messages.editor.status}</span>
                  <input
                    onChange={(event) =>
                      setDraft({ ...draft, status: event.target.value })
                    }
                    value={draft.status}
                  />
                </label>
              )}
            </DrawerBody>
            <DrawerFooter>
              <button
                className="manager-iam-button manager-iam-button--quiet"
                disabled={busy}
                onClick={resetEditor}
                type="button"
              >
                {messages.editor.cancel}
              </button>
              <button
                className="manager-iam-button manager-iam-button--primary"
                disabled={busy || !draft.name || (permission && !draft.code)}
                type="submit"
              >
                {editing
                  ? messages.editor.save
                  : formatMessage(messages.editor.createTemplate, {
                      kind: kindLabel,
                    })}
              </button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <div aria-label={kindLabel} className="manager-iam-table-wrap" role="region" tabIndex={0}>
        <table
          className={`manager-iam-table manager-iam-table--${kind}${loading || !items.length ? " manager-iam-table--empty" : ""}`}
        >
          <caption className="sr-only">{kindLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{messages.table.name}</th>
              <th scope="col">{messages.table.code}</th>
              {permission ? (
                <>
                  <th scope="col">{messages.table.resource}</th>
                  <th scope="col">{messages.table.action}</th>
                </>
              ) : (
                <th scope="col">{messages.table.status}</th>
              )}
              <th aria-label={messages.table.actions} scope="col" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="manager-iam-table__empty"
                  colSpan={tableColumnCount}
                  role="status"
                >
                  {formatMessage(messages.loadingTemplate, { kind: kindLabel })}
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => {
                const details = item as Item & Partial<Draft>;
                return (
                  <tr key={idOf(item, kind)}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <code>{details.code || "-"}</code>
                    </td>
                    {permission ? (
                      <>
                        <td>{details.resource || "-"}</td>
                        <td>{details.action || "-"}</td>
                      </>
                    ) : (
                      <td>{details.status || "-"}</td>
                    )}
                    <td className="manager-iam-table__actions">
                      {permissions.update ? (
                        <button
                          className="manager-iam-button manager-iam-button--quiet"
                          disabled={busy}
                          onClick={() => openEditor(item)}
                          type="button"
                        >
                          {messages.table.edit}
                        </button>
                      ) : null}
                      {permissions.delete ? (
                        <button
                          className="manager-iam-button manager-iam-button--danger"
                          disabled={busy}
                          onClick={() => setDeleteTarget(item)}
                          type="button"
                        >
                          {messages.table.delete}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  className="manager-iam-table__empty"
                  colSpan={tableColumnCount}
                >
                  {messages.table.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        cancelLabel={messages.editor.cancel}
        closeOnConfirm={false}
        confirmLabel={messages.table.delete}
        confirmLoading={busy}
        description={
          deleteTarget
            ? formatMessage(messages.notices.deleteConfirmTemplate, {
                name: deleteTarget.name,
              })
            : undefined
        }
        onConfirm={() => void remove()}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(undefined);
        }}
        open={Boolean(deleteTarget)}
        title={`${messages.table.delete} ${kindLabel}`}
        tone="danger"
      />
    </section>
  );
}
