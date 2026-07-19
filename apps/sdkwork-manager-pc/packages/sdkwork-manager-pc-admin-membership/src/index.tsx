import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";

import { resolveMembershipMessages } from "./i18n";

type Messages = ReturnType<typeof resolveMembershipMessages>;
type FieldDefinition = { key: string; label: string; type?: "number" | "text" };
type CatalogRecord = { id: string; status: string };

function useMembershipPage<T>(loader: (query: MembershipBackendListQuery) => Promise<MembershipBackendPage<T>>) {
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
      setResult(await loader({ page, pageSize: 20, status: status || undefined }));
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loader, page, status]);
  useEffect(() => { void reload(); }, [reload]);
  return { error, loading, page, reload, result, setPage, setStatus, status };
}

function PageState({ children, error, loading, messages }: {
  children: ReactNode;
  error: boolean;
  loading: boolean;
  messages: Messages;
}) {
  return <>{error ? <p role="alert">{messages.error}</p> : null}{loading ? <p role="status">{messages.loading}</p> : children}</>;
}

function Pagination({ page, pageInfo, setPage, messages }: {
  page: number;
  pageInfo: MembershipBackendPage<unknown>["pageInfo"];
  setPage: (value: number | ((current: number) => number)) => void;
  messages: Messages;
}) {
  const totalPages = pageInfo.totalPages ?? (pageInfo.hasMore ? page + 1 : page);
  return <div className="manager-operations-pagination">
    <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">{messages.previous}</button>
    <span>{page} / {Math.max(1, totalPages)}</span>
    <button disabled={page >= Math.max(1, totalPages)} onClick={() => setPage((value) => value + 1)} type="button">{messages.next}</button>
  </div>;
}

function EmptyRow({ columns, messages }: { columns: number; messages: Messages }) {
  return <tr><td colSpan={columns}>{messages.empty}</td></tr>;
}

function MembershipOverview({ messages, service }: { messages: Messages; service: SdkworkMembershipBackendService }) {
  const [metrics, setMetrics] = useState<Array<[string, number]> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void Promise.all([
      service.listMembers({ page: 1, pageSize: 20 }),
      service.listPlans({ page: 1, pageSize: 20 }),
      service.listPackages({ page: 1, pageSize: 20 }),
      service.listEntitlements({ page: 1, pageSize: 20 }),
    ]).then(([members, plans, packages, entitlements]) => setMetrics([
      [messages.routes.members[0], members.items.length],
      [messages.routes.plans[0], plans.items.length],
      [messages.routes.packages[0], packages.items.length],
      [messages.routes.entitlements[0], entitlements.items.length],
    ])).catch(() => setError(true));
  }, [messages, service]);
  return <section className="manager-operations-page">
    <p className="manager-operations-note">{messages.currentPage}</p>
    <PageState error={error} loading={!metrics && !error} messages={messages}>
      <div className="manager-kpi-grid">{metrics?.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    </PageState>
  </section>;
}

function MembersPage({ messages, service }: { messages: Messages; service: SdkworkMembershipBackendService }) {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [submittedUserId, setSubmittedUserId] = useState("");
  const [submittedStatus, setSubmittedStatus] = useState("");
  const [result, setResult] = useState<MembershipBackendPage<AdminMembershipMemberItem>>({ items: [], pageInfo: { mode: "offset", pageSize: 20 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setResult(await service.listMembers({ page, pageSize: 20, status: submittedStatus || undefined, userId: submittedUserId || undefined })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [page, service, submittedStatus, submittedUserId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSubmittedStatus(status.trim());
      setSubmittedUserId(userId.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [status, userId]);
  useEffect(() => { void load(); }, [load]);
  return <section className="manager-operations-page">
    <div className="manager-operations-filter-row">
      <label>{messages.search}<input aria-label="userId" onChange={(event) => { setPage(1); setUserId(event.target.value); }} placeholder="User ID" value={userId} /></label>
      <label>{messages.status}<input aria-label="status" onChange={(event) => { setPage(1); setStatus(event.target.value); }} placeholder="active" value={status} /></label>
    </div>
    <PageState error={error} loading={loading} messages={messages}>
      <div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr><th>ID</th><th>User</th><th>Plan</th><th>Status</th><th>Period</th><th>{messages.details}</th></tr></thead><tbody>
        {result.items.length ? result.items.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.ownerUserId}</td><td>{item.planCode}</td><td>{item.status}</td><td>{item.startedAt}<small>{item.expiresAt}</small></td><td><Link to={`/admin/memberships/members/${encodeURIComponent(item.id)}`}>{messages.details}</Link></td></tr>) : <EmptyRow columns={6} messages={messages} />}
      </tbody></table></div>
      <Pagination messages={messages} page={page} pageInfo={result.pageInfo} setPage={setPage} />
    </PageState>
  </section>;
}

function MemberDetailPage({ messages, service }: { messages: Messages; service: SdkworkMembershipBackendService }) {
  const { pathname } = useLocation();
  const membershipId = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "");
  const canManage = hasManagerPermission("commerce.memberships.manage");
  const [member, setMember] = useState<AdminMembershipMemberItem | null>(null);
  const [entitlements, setEntitlements] = useState<AdminMembershipEntitlementItem[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const load = useCallback(async () => {
    setError(false);
    try {
      const [item, page] = await Promise.all([
        service.getMember(membershipId),
        service.listEntitlements({ membershipId, page: 1, pageSize: 20 }),
      ]);
      setMember(item); setStatus(item.status); setEntitlements(page.items); return true;
    } catch { setError(true); return false; }
  }, [membershipId, service]);
  useEffect(() => { void load(); }, [load]);
  const updateStatus = async () => {
    if (status === member?.status || !window.confirm(messages.confirmStatus)) return;
    setSaving(true); setFeedback(null);
    try {
      await service.updateMemberStatus(membershipId, { status });
      if (!await load()) throw new Error("membership refresh failed");
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setSaving(false);
    }
  };
  return <section className="manager-operations-page">
    {feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
    <PageState error={error} loading={!member && !error} messages={messages}>
      {member ? <div className="manager-detail-grid"><article><h2>{member.id}</h2><dl><div><dt>User</dt><dd>{member.ownerUserId}</dd></div><div><dt>Plan</dt><dd>{member.planCode}</dd></div><div><dt>Status</dt><dd>{member.status}</dd></div><div><dt>Period</dt><dd>{member.startedAt} – {member.expiresAt}</dd></div></dl>{canManage ? <div className="manager-operations-actions"><select aria-label={messages.status} disabled={saving} onChange={(event) => setStatus(event.target.value)} value={status}>{["active", "inactive", "expired", "suspended", "cancelled"].map((value) => <option key={value}>{value}</option>)}</select><button disabled={saving || status === member.status} onClick={() => void updateStatus()} type="button">{saving ? messages.processing : messages.save}</button></div> : null}</article></div> : null}
      <h3>{messages.routes.entitlements[0]}</h3>
      <div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr><th>Code</th><th>Quota</th><th>Status</th></tr></thead><tbody>{entitlements.length ? entitlements.map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.quota}</td><td>{item.status}</td></tr>) : <EmptyRow columns={3} messages={messages} />}</tbody></table></div>
    </PageState>
  </section>;
}

function CatalogCrudPage<T extends CatalogRecord>({ fields, list, create, update, messages }: {
  fields: FieldDefinition[];
  list: (query: MembershipBackendListQuery) => Promise<MembershipBackendPage<T>>;
  create: (input: Record<string, string>) => Promise<unknown>;
  update: (id: string, input: Record<string, string>) => Promise<unknown>;
  messages: Messages;
}) {
  const loader = useCallback((query: MembershipBackendListQuery) => list(query), [list]);
  const state = useMembershipPage(loader);
  const canManage = hasManagerPermission("commerce.memberships.manage");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const begin = (item?: T) => {
    setEditingId(item?.id ?? "");
    const record = item as unknown as Record<string, unknown> | undefined;
    setDraft(Object.fromEntries(fields.map((field) => [field.key, String(record?.[field.key] ?? "")])));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const input = Object.fromEntries(fields.map((field) => [field.key, draft[field.key] ?? ""]));
    setPending(true); setFeedback(null);
    try {
      if (editingId) await update(editingId, input); else await create(input);
      if (!await state.reload()) throw new Error("membership catalog refresh failed");
      setEditingId(null); setDraft({});
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setPending(false);
    }
  };
  const disable = async (item: T) => {
    if (!window.confirm(messages.confirmDisable)) return;
    setPending(true); setFeedback(null);
    try {
      const record = item as unknown as Record<string, unknown>;
      const input = Object.fromEntries(fields.map((field) => [
        field.key,
        field.key === "status" ? "disabled" : String(record[field.key] ?? ""),
      ]));
      await update(item.id, input);
      if (!await state.reload()) throw new Error("membership catalog refresh failed");
      setFeedback({ kind: "success", message: messages.mutationSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.mutationError });
    } finally {
      setPending(false);
    }
  };
  return <section className="manager-operations-page">
    {feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
    <div className="manager-operations-filter-row"><label>{messages.status}<input disabled={pending} onChange={(event) => { state.setPage(1); state.setStatus(event.target.value); }} value={state.status} /></label>{canManage ? <button disabled={pending} onClick={() => begin()} type="button">{messages.create}</button> : null}</div>
    {canManage && editingId !== null ? <form className="manager-operation-form" onSubmit={(event) => void submit(event)}>{fields.map((field) => <label key={field.key}>{field.label}<input disabled={pending} onChange={(event) => setDraft((value) => ({ ...value, [field.key]: event.target.value }))} required type={field.type ?? "text"} value={draft[field.key] ?? ""} /></label>)}<div className="manager-operations-actions"><button disabled={pending} type="submit">{pending ? messages.processing : messages.save}</button><button disabled={pending} onClick={() => setEditingId(null)} type="button">{messages.cancel}</button></div></form> : null}
    <PageState error={state.error} loading={state.loading} messages={messages}><div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr>{fields.slice(0, 4).map((field) => <th key={field.key}>{field.label}</th>)}{canManage ? <th>Actions</th> : null}</tr></thead><tbody>{state.result.items.length ? state.result.items.map((item) => { const record = item as unknown as Record<string, unknown>; return <tr key={item.id}>{fields.slice(0, 4).map((field) => <td key={field.key}>{String(record[field.key] ?? "-")}</td>)}{canManage ? <td className="manager-operations-actions"><button disabled={pending} onClick={() => begin(item)} type="button">{messages.edit}</button><button disabled={pending || item.status === "disabled"} onClick={() => void disable(item)} type="button">{messages.remove}</button></td> : null}</tr>; }) : <EmptyRow columns={canManage ? 5 : 4} messages={messages} />}</tbody></table></div><Pagination messages={messages} page={state.page} pageInfo={state.result.pageInfo} setPage={state.setPage} /></PageState>
  </section>;
}

function EntitlementsPage({ messages, service }: { messages: Messages; service: SdkworkMembershipBackendService }) {
  const loader = useCallback((query: MembershipBackendListQuery) => service.listEntitlements(query), [service]);
  const state = useMembershipPage(loader);
  return <section className="manager-operations-page"><PageState error={state.error} loading={state.loading} messages={messages}><div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr><th>ID</th><th>Code</th><th>Membership</th><th>Plan</th><th>Quota</th><th>Status</th></tr></thead><tbody>{state.result.items.length ? state.result.items.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.code}</td><td>{item.membershipId}</td><td>{item.planId}</td><td>{item.quota}</td><td>{item.status}</td></tr>) : <EmptyRow columns={6} messages={messages} />}</tbody></table></div><Pagination messages={messages} page={state.page} pageInfo={state.result.pageInfo} setPage={state.setPage} /></PageState></section>;
}

function toPlanMutation(input: Record<string, string>): AdminMembershipPlanMutation {
  return { code: input.code ?? "", name: input.name ?? "", rank: input.rank ?? "", status: input.status ?? "" };
}

function toPackageGroupMutation(input: Record<string, string>): AdminMembershipPackageGroupMutation {
  return { billingCycle: input.billingCycle ?? "", code: input.code ?? "", durationDays: input.durationDays ?? "", name: input.name ?? "", sortWeight: input.sortWeight ?? "", status: input.status ?? "" };
}

function toPackageMutation(input: Record<string, string>): AdminMembershipPackageMutation {
  return { code: input.code ?? "", currencyCode: input.currencyCode ?? "", durationDays: input.durationDays ?? "", name: input.name ?? "", packageGroupId: input.packageGroupId ?? "", planId: input.planId ?? "", priceAmount: input.priceAmount ?? "", status: input.status ?? "" };
}

export function createSdkworkManagerMembershipAdminContribution(locale: string): AdminModuleContribution {
  const messages = resolveMembershipMessages(locale);
  const service = getManagerMembershipBackendService();
  const routeGroups = {
    entitlements: { id: "entitlements", label: messages.navigationGroups.entitlements },
    members: { id: "member-operations", label: messages.navigationGroups.operations },
    overview: { id: "member-operations", label: messages.navigationGroups.operations },
    packageGroups: { id: "membership-catalog", label: messages.navigationGroups.catalog },
    packages: { id: "membership-catalog", label: messages.navigationGroups.catalog },
    plans: { id: "membership-catalog", label: messages.navigationGroups.catalog },
  } satisfies Record<keyof typeof messages.routes, { id: string; label: string }>;
  const route = (key: keyof typeof messages.routes, Component: () => ReactNode) => ({ Component, description: messages.routes[key][1], id: `commerce.memberships.${key}`, label: messages.routes[key][0], navigationGroups: [routeGroups[key]], path: `/admin/memberships/${key === "packageGroups" ? "package-groups" : key}`, requiredPermissions: ["commerce.memberships.read"] });
  const planFields = [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "rank", label: "Rank" }, { key: "status", label: "Status" }];
  const groupFields = [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "billingCycle", label: "Billing cycle" }, { key: "durationDays", label: "Days" }, { key: "sortWeight", label: "Weight" }, { key: "status", label: "Status" }];
  const packageFields = [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "packageGroupId", label: "Group" }, { key: "planId", label: "Plan" }, { key: "priceAmount", label: "Price" }, { key: "currencyCode", label: "Currency" }, { key: "durationDays", label: "Days" }, { key: "status", label: "Status" }];
  return {
    access: { permissionMode: "any", requiredPermissions: ["commerce.memberships.read", "commerce.memberships.manage"] },
    capability: "membership-operations",
    commercial: { entitlementKey: "sdkwork.membership.admin", releaseChannel: "stable", tier: "professional" },
    defaultPath: "/admin/memberships/overview",
    displayName: messages.displayName,
    domain: "commerce",
    header: { description: messages.description, title: messages.title },
    id: "commerce.memberships",
    packageName: "@sdkwork/manager-pc-admin-membership",
    pathPrefix: "/admin/memberships",
    routes: [
      route("overview", () => <MembershipOverview messages={messages} service={service} />),
      route("members", () => <MembersPage messages={messages} service={service} />),
      { Component: () => <MemberDetailPage messages={messages} service={service} />, description: messages.routes.members[1], id: "commerce.memberships.member-detail", label: messages.details, navigationVisible: false, path: "/admin/memberships/members/:id", requiredPermissions: ["commerce.memberships.read"] },
      route("plans", () => <CatalogCrudPage<AdminMembershipPlanItem> fields={planFields} list={(query) => service.listPlans(query)} create={(input) => service.createPlan(toPlanMutation(input))} update={(id, input) => service.updatePlan(id, toPlanMutation(input))} messages={messages} />),
      route("packageGroups", () => <CatalogCrudPage<AdminMembershipPackageGroupItem> fields={groupFields} list={(query) => service.listPackageGroups(query)} create={(input) => service.createPackageGroup(toPackageGroupMutation(input))} update={(id, input) => service.updatePackageGroup(id, toPackageGroupMutation(input))} messages={messages} />),
      route("packages", () => <CatalogCrudPage<AdminMembershipPackageItem> fields={packageFields} list={(query) => service.listPackages(query)} create={(input) => service.createPackage(toPackageMutation(input))} update={(id, input) => service.updatePackage(id, toPackageMutation(input))} messages={messages} />),
      route("entitlements", () => <EntitlementsPage messages={messages} service={service} />),
    ],
    surface: "backend-admin",
  };
}

export * from "./i18n";
