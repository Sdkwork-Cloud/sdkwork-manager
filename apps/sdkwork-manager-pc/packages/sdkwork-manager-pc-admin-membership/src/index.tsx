import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useLocation } from "react-router-dom";
import type {
  AdminMembershipEntitlementItem,
  AdminMembershipMemberItem,
  AdminMembershipPackageGroupItem,
  AdminMembershipPackageGroupMutation,
  AdminMembershipPackageItem,
  AdminMembershipPackageMutation,
  AdminMembershipPlanItem,
  AdminMembershipPlanMutation,
  MembershipBackendListQuery,
  MembershipBackendPage,
  SdkworkMembershipBackendService,
} from "@sdkwork/membership-service";
import { getManagerMembershipBackendService } from "@sdkwork/manager-pc-admin-core";
import {
  hasManagerPermission,
  type AdminModuleContribution,
} from "@sdkwork/manager-pc-core";
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

import { resolveMembershipMessages } from "./i18n";

type Messages = ReturnType<typeof resolveMembershipMessages>;
type FieldDefinition = { key: string; label: string; type?: "number" | "text" };
type CatalogRecord = { id: string; status: string };

function useMembershipPage<T>(
  loader: (
    query: MembershipBackendListQuery,
  ) => Promise<MembershipBackendPage<T>>,
) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<MembershipBackendPage<T>>({
    items: [],
    pageInfo: { mode: "offset", page: 1, pageSize: 20 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResult(
        await loader({ page, pageSize: 20, status: status || undefined }),
      );
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loader, page, status]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { error, loading, page, reload, result, setPage, setStatus, status };
}

function PageState({
  children,
  error,
  loading,
  messages,
}: {
  children: ReactNode;
  error: boolean;
  loading: boolean;
  messages: Messages;
}) {
  return (
    <>
      {error ? (
        <p className="manager-feedback manager-feedback--error" role="alert">
          {messages.error}
        </p>
      ) : null}
      {loading ? (
        <p className="manager-feedback" role="status">
          {messages.loading}
        </p>
      ) : (
        children
      )}
    </>
  );
}

function Pagination({
  page,
  pageInfo,
  setPage,
  messages,
}: {
  page: number;
  pageInfo: MembershipBackendPage<unknown>["pageInfo"];
  setPage: (value: number | ((current: number) => number)) => void;
  messages: Messages;
}) {
  const totalPages =
    pageInfo.totalPages ?? (pageInfo.hasMore ? page + 1 : page);
  return (
    <div className="manager-operations-pagination">
      <button
        disabled={page <= 1}
        onClick={() => setPage((value) => value - 1)}
        type="button"
      >
        {messages.previous}
      </button>
      <span>
        {page} / {Math.max(1, totalPages)}
      </span>
      <button
        disabled={page >= Math.max(1, totalPages)}
        onClick={() => setPage((value) => value + 1)}
        type="button"
      >
        {messages.next}
      </button>
    </div>
  );
}

function EmptyRow({
  columns,
  messages,
}: {
  columns: number;
  messages: Messages;
}) {
  return (
    <tr>
      <td colSpan={columns}>{messages.empty}</td>
    </tr>
  );
}

function MembershipOverview({
  messages,
  service,
}: {
  messages: Messages;
  service: SdkworkMembershipBackendService;
}) {
  const [metrics, setMetrics] = useState<Array<[string, number]> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void Promise.all([
      service.listMembers({ page: 1, pageSize: 20 }),
      service.listPlans({ page: 1, pageSize: 20 }),
      service.listPackages({ page: 1, pageSize: 20 }),
      service.listEntitlements({ page: 1, pageSize: 20 }),
    ])
      .then(([members, plans, packages, entitlements]) =>
        setMetrics([
          [messages.routes.members[0], members.items.length],
          [messages.routes.plans[0], plans.items.length],
          [messages.routes.packages[0], packages.items.length],
          [messages.routes.entitlements[0], entitlements.items.length],
        ]),
      )
      .catch(() => setError(true));
  }, [messages, service]);
  return (
    <section className="manager-operations-page">
      <p className="manager-operations-note">{messages.currentPage}</p>
      <PageState error={error} loading={!metrics && !error} messages={messages}>
        <div className="manager-kpi-grid">
          {metrics?.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </PageState>
    </section>
  );
}

function MembersPage({
  messages,
  service,
}: {
  messages: Messages;
  service: SdkworkMembershipBackendService;
}) {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [submittedUserId, setSubmittedUserId] = useState("");
  const [submittedStatus, setSubmittedStatus] = useState("");
  const [result, setResult] = useState<
    MembershipBackendPage<AdminMembershipMemberItem>
  >({ items: [], pageInfo: { mode: "offset", pageSize: 20 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResult(
        await service.listMembers({
          page,
          pageSize: 20,
          status: submittedStatus || undefined,
          userId: submittedUserId || undefined,
        }),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, service, submittedStatus, submittedUserId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSubmittedStatus(status.trim());
      setSubmittedUserId(userId.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [status, userId]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <section className="manager-operations-page">
      <div className="manager-operations-filter-row">
        <label>
          {messages.search}
          <input
            aria-label="userId"
            onChange={(event) => {
              setPage(1);
              setUserId(event.target.value);
            }}
            placeholder="User ID"
            value={userId}
          />
        </label>
        <label>
          {messages.status}
          <select
            aria-label="status"
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            value={status}
          >
            <option value="">--</option>
            {["active", "inactive", "expired", "suspended", "cancelled"].map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      <PageState error={error} loading={loading} messages={messages}>
        <div aria-label={messages.routes.members[0]} className="manager-operations-table-wrap" role="region" tabIndex={0}>
          <table className="manager-operations-table">
            <caption className="sr-only">{messages.routes.members[0]}</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Period</th>
                <th>{messages.details}</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code>{item.id}</code>
                    </td>
                    <td>{item.ownerUserId}</td>
                    <td>
                      <strong>{item.planCode}</strong>
                    </td>
                    <td>
                      <span
                        className="manager-status-badge"
                        data-status={item.status}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.startedAt}
                      <small>{item.expiresAt}</small>
                    </td>
                    <td className="manager-operations-actions">
                      <Link
                        to={`/admin/memberships/members/${encodeURIComponent(item.id)}`}
                      >
                        {messages.details}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={6} messages={messages} />
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          messages={messages}
          page={page}
          pageInfo={result.pageInfo}
          setPage={setPage}
        />
      </PageState>
    </section>
  );
}

function MemberDetailPage({
  messages,
  service,
}: {
  messages: Messages;
  service: SdkworkMembershipBackendService;
}) {
  const { pathname } = useLocation();
  const membershipId = decodeURIComponent(
    pathname.split("/").filter(Boolean).at(-1) ?? "",
  );
  const canManage = hasManagerPermission("commerce.memberships.manage");
  const [member, setMember] = useState<AdminMembershipMemberItem | null>(null);
  const [entitlements, setEntitlements] = useState<
    AdminMembershipEntitlementItem[]
  >([]);
  const [status, setStatus] = useState("");
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const load = useCallback(async () => {
    setError(false);
    try {
      const [item, page] = await Promise.all([
        service.getMember(membershipId),
        service.listEntitlements({ membershipId, page: 1, pageSize: 20 }),
      ]);
      setMember(item);
      setStatus(item.status);
      setEntitlements(page.items);
      return true;
    } catch {
      setError(true);
      return false;
    }
  }, [membershipId, service]);
  useEffect(() => {
    void load();
  }, [load]);
  const updateStatus = async () => {
    if (status === member?.status) return;
    setSaving(true);
    setFeedback(null);
    try {
      await service.updateMemberStatus(membershipId, { status });
      if (!(await load())) throw new Error("membership refresh failed");
      setStatusEditorOpen(false);
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="manager-operations-page">
      <div className="manager-operations-toolbar">
        <Link to="/admin/memberships/members">
          ← {messages.routes.members[0]}
        </Link>
      </div>
      {feedback ? (
        <p
          className={`manager-feedback manager-feedback--${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
      <PageState error={error} loading={!member && !error} messages={messages}>
        {member ? (
          <div className="manager-detail-grid">
            <article>
              <h2>{member.id}</h2>
              <dl>
                <div>
                  <dt>User</dt>
                  <dd>{member.ownerUserId}</dd>
                </div>
                <div>
                  <dt>Plan</dt>
                  <dd>{member.planCode}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span
                      className="manager-status-badge"
                      data-status={member.status}
                    >
                      {member.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Period</dt>
                  <dd>
                    {member.startedAt} – {member.expiresAt}
                  </dd>
                </div>
              </dl>
              {canManage ? (
                <div className="manager-operations-actions">
                  <button
                    disabled={saving}
                    onClick={() => {
                      setStatus(member.status);
                      setStatusEditorOpen(true);
                    }}
                    type="button"
                  >
                    {messages.edit}
                  </button>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}
        <h3 className="manager-detail-section-title">
          {messages.routes.entitlements[0]}
        </h3>
        <div aria-label={messages.routes.entitlements[0]} className="manager-operations-table-wrap" role="region" tabIndex={0}>
          <table className="manager-operations-table">
            <caption className="sr-only">{messages.routes.entitlements[0]}</caption>
            <thead>
              <tr>
                <th>Code</th>
                <th>Quota</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.length ? (
                entitlements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.code}</strong>
                    </td>
                    <td className="manager-numeric-cell">{item.quota}</td>
                    <td>
                      <span
                        className="manager-status-badge"
                        data-status={item.status}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={3} messages={messages} />
              )}
            </tbody>
          </table>
        </div>
      </PageState>
      <Drawer
        open={statusEditorOpen}
        onOpenChange={(open) => {
          setStatusEditorOpen(open);
          if (!open && member) setStatus(member.status);
        }}
      >
        <DrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>{messages.edit}</DrawerTitle>
            <DrawerDescription>{messages.confirmStatus}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <label className="manager-drawer-field">
              {messages.status}
              <select
                disabled={saving}
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                {[
                  "active",
                  "inactive",
                  "expired",
                  "suspended",
                  "cancelled",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </DrawerBody>
          <DrawerFooter>
            <button
              disabled={saving}
              onClick={() => setStatusEditorOpen(false)}
              type="button"
            >
              {messages.cancel}
            </button>
            <button
              disabled={saving || status === member?.status}
              onClick={() => void updateStatus()}
              type="button"
            >
              {saving ? messages.processing : messages.save}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </section>
  );
}

function CatalogCrudPage<T extends CatalogRecord>({
  description,
  fields,
  list,
  create,
  update,
  messages,
  tableLabel,
}: {
  description: string;
  fields: FieldDefinition[];
  list: (
    query: MembershipBackendListQuery,
  ) => Promise<MembershipBackendPage<T>>;
  create: (input: Record<string, string>) => Promise<unknown>;
  update: (id: string, input: Record<string, string>) => Promise<unknown>;
  messages: Messages;
  tableLabel: string;
}) {
  const loader = useCallback(
    (query: MembershipBackendListQuery) => list(query),
    [list],
  );
  const state = useMembershipPage(loader);
  const canManage = hasManagerPermission("commerce.memberships.manage");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [disableTarget, setDisableTarget] = useState<T | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);
  const begin = (item?: T) => {
    setEditingId(item?.id ?? "");
    const record = item as unknown as Record<string, unknown> | undefined;
    setDraft(
      Object.fromEntries(
        fields.map((field) => [field.key, String(record?.[field.key] ?? "")]),
      ),
    );
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input = Object.fromEntries(
      fields.map((field) => [field.key, draft[field.key] ?? ""]),
    );
    setPending(true);
    setFeedback(null);
    try {
      if (editingId) await update(editingId, input);
      else await create(input);
      if (!(await state.reload()))
        throw new Error("membership catalog refresh failed");
      setEditingId(null);
      setDraft({});
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setPending(false);
    }
  };
  const disable = async () => {
    if (!disableTarget) return;
    setPending(true);
    setFeedback(null);
    try {
      const record = disableTarget as unknown as Record<string, unknown>;
      const input = Object.fromEntries(
        fields.map((field) => [
          field.key,
          field.key === "status" ? "disabled" : String(record[field.key] ?? ""),
        ]),
      );
      await update(disableTarget.id, input);
      if (!(await state.reload()))
        throw new Error("membership catalog refresh failed");
      setDisableTarget(null);
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="manager-operations-page">
      {feedback ? (
        <p
          className={`manager-feedback manager-feedback--${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
      <div className="manager-operations-filter-row">
        <label>
          {messages.status}
          <input
            disabled={pending}
            onChange={(event) => {
              state.setPage(1);
              state.setStatus(event.target.value);
            }}
            placeholder="active"
            value={state.status}
          />
        </label>
        {canManage ? (
          <button disabled={pending} onClick={() => begin()} type="button">
            {messages.create}
          </button>
        ) : null}
      </div>
      <PageState
        error={state.error}
        loading={state.loading}
        messages={messages}
      >
        <div aria-label={tableLabel} className="manager-operations-table-wrap" role="region" tabIndex={0}>
          <table className="manager-operations-table">
            <caption className="sr-only">{tableLabel}</caption>
            <thead>
              <tr>
                {fields.slice(0, 4).map((field) => (
                  <th key={field.key}>{field.label}</th>
                ))}
                {canManage ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {state.result.items.length ? (
                state.result.items.map((item) => {
                  const record = item as unknown as Record<string, unknown>;
                  return (
                    <tr key={item.id}>
                      {fields.slice(0, 4).map((field) => (
                        <td key={field.key}>
                          {field.key === "status" ? (
                            <span
                              className="manager-status-badge"
                              data-status={String(
                                record[field.key] ?? "unknown",
                              )}
                            >
                              {String(record[field.key] ?? "-")}
                            </span>
                          ) : (
                            String(record[field.key] ?? "-")
                          )}
                        </td>
                      ))}
                      {canManage ? (
                        <td className="manager-operations-actions">
                          <button
                            disabled={pending}
                            onClick={() => begin(item)}
                            type="button"
                          >
                            {messages.edit}
                          </button>
                          <button
                            className="manager-action-danger"
                            disabled={pending || item.status === "disabled"}
                            onClick={() => setDisableTarget(item)}
                            type="button"
                          >
                            {messages.remove}
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <EmptyRow columns={canManage ? 5 : 4} messages={messages} />
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          messages={messages}
          page={state.page}
          pageInfo={state.result.pageInfo}
          setPage={state.setPage}
        />
      </PageState>
      <Drawer
        open={canManage && editingId !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setEditingId(null);
            setDraft({});
          }
        }}
      >
        <DrawerContent size="md">
          <form
            className="manager-drawer-form"
            onSubmit={(event) => void submit(event)}
          >
            <DrawerHeader>
              <DrawerTitle>
                {editingId ? messages.edit : messages.create}
              </DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="manager-drawer-fields">
              {fields.map((field) => (
                <label className="manager-drawer-field" key={field.key}>
                  {field.label}
                  <input
                    disabled={pending}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        [field.key]: event.target.value,
                      }))
                    }
                    required
                    type={field.type ?? "text"}
                    value={draft[field.key] ?? ""}
                  />
                </label>
              ))}
            </DrawerBody>
            <DrawerFooter>
              <button
                disabled={pending}
                onClick={() => {
                  setEditingId(null);
                  setDraft({});
                }}
                type="button"
              >
                {messages.cancel}
              </button>
              <button disabled={pending} type="submit">
                {pending ? messages.processing : messages.save}
              </button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <ConfirmDialog
        cancelLabel={messages.cancel}
        closeOnConfirm={false}
        confirmLabel={messages.remove}
        confirmLoading={pending}
        description={messages.confirmDisable}
        onConfirm={() => void disable()}
        onOpenChange={(open) => {
          if (!open && !pending) setDisableTarget(null);
        }}
        open={Boolean(disableTarget)}
        title={messages.remove}
        tone="warning"
      />
    </section>
  );
}

function EntitlementsPage({
  messages,
  service,
}: {
  messages: Messages;
  service: SdkworkMembershipBackendService;
}) {
  const loader = useCallback(
    (query: MembershipBackendListQuery) => service.listEntitlements(query),
    [service],
  );
  const state = useMembershipPage(loader);
  return (
    <section className="manager-operations-page">
      <PageState
        error={state.error}
        loading={state.loading}
        messages={messages}
      >
        <div aria-label={messages.routes.entitlements[0]} className="manager-operations-table-wrap" role="region" tabIndex={0}>
          <table className="manager-operations-table">
            <caption className="sr-only">{messages.routes.entitlements[0]}</caption>
            <thead>
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Membership</th>
                <th>Plan</th>
                <th>Quota</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.result.items.length ? (
                state.result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code>{item.id}</code>
                    </td>
                    <td>
                      <strong>{item.code}</strong>
                    </td>
                    <td>{item.membershipId}</td>
                    <td>{item.planId}</td>
                    <td className="manager-numeric-cell">{item.quota}</td>
                    <td>
                      <span
                        className="manager-status-badge"
                        data-status={item.status}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow columns={6} messages={messages} />
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          messages={messages}
          page={state.page}
          pageInfo={state.result.pageInfo}
          setPage={state.setPage}
        />
      </PageState>
    </section>
  );
}

function toPlanMutation(
  input: Record<string, string>,
): AdminMembershipPlanMutation {
  return {
    code: input.code ?? "",
    name: input.name ?? "",
    rank: input.rank ?? "",
    status: input.status ?? "",
  };
}

function toPackageGroupMutation(
  input: Record<string, string>,
): AdminMembershipPackageGroupMutation {
  return {
    billingCycle: input.billingCycle ?? "",
    code: input.code ?? "",
    durationDays: input.durationDays ?? "",
    name: input.name ?? "",
    sortWeight: input.sortWeight ?? "",
    status: input.status ?? "",
  };
}

function toPackageMutation(
  input: Record<string, string>,
): AdminMembershipPackageMutation {
  return {
    code: input.code ?? "",
    currencyCode: input.currencyCode ?? "",
    durationDays: input.durationDays ?? "",
    name: input.name ?? "",
    packageGroupId: input.packageGroupId ?? "",
    planId: input.planId ?? "",
    priceAmount: input.priceAmount ?? "",
    status: input.status ?? "",
  };
}

export function createSdkworkManagerMembershipAdminContribution(
  locale: string,
): AdminModuleContribution {
  const messages = resolveMembershipMessages(locale);
  const service = getManagerMembershipBackendService();
  const routeGroups = {
    entitlements: {
      id: "entitlements",
      label: messages.navigationGroups.entitlements,
    },
    members: {
      id: "member-operations",
      label: messages.navigationGroups.operations,
    },
    overview: {
      id: "member-operations",
      label: messages.navigationGroups.operations,
    },
    packageGroups: {
      id: "membership-catalog",
      label: messages.navigationGroups.catalog,
    },
    packages: {
      id: "membership-catalog",
      label: messages.navigationGroups.catalog,
    },
    plans: {
      id: "membership-catalog",
      label: messages.navigationGroups.catalog,
    },
  } satisfies Record<
    keyof typeof messages.routes,
    { id: string; label: string }
  >;
  const route = (
    key: keyof typeof messages.routes,
    Component: () => ReactNode,
  ) => ({
    Component,
    description: messages.routes[key][1],
    id: `commerce.memberships.${key}`,
    label: messages.routes[key][0],
    navigationGroups: [routeGroups[key]],
    path: `/admin/memberships/${key === "packageGroups" ? "package-groups" : key}`,
    requiredPermissions: ["commerce.memberships.read"],
  });
  const planFields = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "rank", label: "Rank" },
    { key: "status", label: "Status" },
  ];
  const groupFields = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "billingCycle", label: "Billing cycle" },
    { key: "durationDays", label: "Days" },
    { key: "sortWeight", label: "Weight" },
    { key: "status", label: "Status" },
  ];
  const packageFields = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "packageGroupId", label: "Group" },
    { key: "planId", label: "Plan" },
    { key: "priceAmount", label: "Price" },
    { key: "currencyCode", label: "Currency" },
    { key: "durationDays", label: "Days" },
    { key: "status", label: "Status" },
  ];
  return {
    access: {
      permissionMode: "any",
      requiredPermissions: [
        "commerce.memberships.read",
        "commerce.memberships.manage",
      ],
    },
    capability: "membership-operations",
    commercial: {
      entitlementKey: "sdkwork.membership.admin",
      releaseChannel: "stable",
      tier: "professional",
    },
    defaultPath: "/admin/memberships/overview",
    displayName: messages.displayName,
    domain: "commerce",
    header: { description: messages.description, title: messages.title },
    id: "commerce.memberships",
    packageName: "@sdkwork/manager-pc-admin-membership",
    pathPrefix: "/admin/memberships",
    routes: [
      route("overview", () => (
        <MembershipOverview messages={messages} service={service} />
      )),
      route("members", () => (
        <MembersPage messages={messages} service={service} />
      )),
      {
        Component: () => (
          <MemberDetailPage messages={messages} service={service} />
        ),
        description: messages.routes.members[1],
        id: "commerce.memberships.member-detail",
        label: messages.details,
        navigationVisible: false,
        path: "/admin/memberships/members/:id",
        requiredPermissions: ["commerce.memberships.read"],
      },
      route("plans", () => (
        <CatalogCrudPage<AdminMembershipPlanItem>
          description={messages.routes.plans[1]}
          fields={planFields}
          list={(query) => service.listPlans(query)}
          create={(input) => service.createPlan(toPlanMutation(input))}
          update={(id, input) => service.updatePlan(id, toPlanMutation(input))}
          messages={messages}
          tableLabel={messages.routes.plans[0]}
        />
      )),
      route("packageGroups", () => (
        <CatalogCrudPage<AdminMembershipPackageGroupItem>
          description={messages.routes.packageGroups[1]}
          fields={groupFields}
          list={(query) => service.listPackageGroups(query)}
          create={(input) =>
            service.createPackageGroup(toPackageGroupMutation(input))
          }
          update={(id, input) =>
            service.updatePackageGroup(id, toPackageGroupMutation(input))
          }
          messages={messages}
          tableLabel={messages.routes.packageGroups[0]}
        />
      )),
      route("packages", () => (
        <CatalogCrudPage<AdminMembershipPackageItem>
          description={messages.routes.packages[1]}
          fields={packageFields}
          list={(query) => service.listPackages(query)}
          create={(input) => service.createPackage(toPackageMutation(input))}
          update={(id, input) =>
            service.updatePackage(id, toPackageMutation(input))
          }
          messages={messages}
          tableLabel={messages.routes.packages[0]}
        />
      )),
      route("entitlements", () => (
        <EntitlementsPage messages={messages} service={service} />
      )),
    ],
    surface: "backend-admin",
  };
}

export * from "./i18n";
