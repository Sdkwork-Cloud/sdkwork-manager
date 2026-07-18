import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type {
  SdkworkIamAdminUser,
  SdkworkIamUserAdminController,
} from "@sdkwork/iam-pc-admin-user";
import type { SdkworkMembershipBackendService } from "@sdkwork/membership-service";
import {
  getManagerIamAdminService,
  getManagerMembershipBackendService,
} from "@sdkwork/manager-pc-admin-core";
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";

import { resolveCustomerMessages } from "./i18n";

type Messages = ReturnType<typeof resolveCustomerMessages>;

let customerControllerPromise: Promise<SdkworkIamUserAdminController> | null = null;

function loadCustomerController(): Promise<SdkworkIamUserAdminController> {
  customerControllerPromise ??= import("@sdkwork/iam-pc-admin-user").then(
    ({ createSdkworkIamUserAdminController }) =>
      createSdkworkIamUserAdminController(getManagerIamAdminService()),
  );
  return customerControllerPromise;
}

function useCustomerController() {
  const [controller, setController] = useState<SdkworkIamUserAdminController | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void loadCustomerController()
      .then((value) => { if (active) setController(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  return { controller, error };
}

function useCustomerDirectory(controller: SdkworkIamUserAdminController) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [users, setUsers] = useState<readonly SdkworkIamAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setUsers(await controller.listUsers({ page, page_size: 20, q: submittedQ || undefined })); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [controller, page, submittedQ]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSubmittedQ(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);
  useEffect(() => { void load(); }, [load]);
  return { error, loading, page, pageInfo: controller.getState().listPageInfo, q, setPage, setQ, users };
}

function CustomerOverview({ controller, membershipService, messages }: {
  controller: SdkworkIamUserAdminController;
  membershipService: SdkworkMembershipBackendService;
  messages: Messages;
}) {
  const canReadMemberships = hasManagerPermission("commerce.memberships.read");
  const [metrics, setMetrics] = useState<Array<[string, number]> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const users = controller.listUsers({ page: 1, page_size: 20 });
    const memberships = canReadMemberships
      ? membershipService.listMembers({ page: 1, pageSize: 20 })
      : Promise.resolve(null);
    void Promise.all([users, memberships])
      .then(([userItems, membershipPage]) => setMetrics([
        [messages.routes.directory[0], userItems.length],
        ...(membershipPage ? [[messages.memberships, membershipPage.items.length] as [string, number]] : []),
      ]))
      .catch(() => setError(true));
  }, [canReadMemberships, controller, membershipService, messages]);
  if (error) return <p role="alert">{messages.error}</p>;
  if (!metrics) return <p role="status">{messages.loading}</p>;
  return <section className="manager-operations-page"><p className="manager-operations-note">{messages.currentPage}</p><div className="manager-kpi-grid">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div></section>;
}

function CustomerDirectory({ controller, messages }: { controller: SdkworkIamUserAdminController; messages: Messages }) {
  const state = useCustomerDirectory(controller);
  const totalPages = state.pageInfo?.totalPages ?? (state.pageInfo?.hasMore ? state.page + 1 : state.page);
  return <section className="manager-operations-page">
    <label className="manager-operations-search"><span>{messages.search}</span><input onChange={(event) => { state.setPage(1); state.setQ(event.target.value); }} placeholder={messages.searchPlaceholder} type="search" value={state.q} /></label>
    {state.error ? <p role="alert">{messages.error}</p> : null}
    {state.loading ? <p role="status">{messages.loading}</p> : <div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr><th>User ID</th><th>Name</th><th>Username</th><th>Email</th><th>Status</th><th>{messages.details}</th></tr></thead><tbody>{state.users.length ? state.users.map((user) => <tr key={user.userId}><td>{user.userId}</td><td>{user.displayName || "-"}</td><td>{user.username || "-"}</td><td>{maskEmail(user.email)}</td><td>{user.status || "-"}</td><td><Link to={`/admin/customers/${encodeURIComponent(user.userId)}`}>{messages.details}</Link></td></tr>) : <tr><td colSpan={6}>{messages.empty}</td></tr>}</tbody></table></div>}
    <div className="manager-operations-pagination"><button disabled={state.page <= 1 || state.loading} onClick={() => state.setPage((value) => value - 1)} type="button">{messages.previous}</button><span>{state.page} / {Math.max(1, totalPages)}</span><button disabled={state.page >= Math.max(1, totalPages) || state.loading} onClick={() => state.setPage((value) => value + 1)} type="button">{messages.next}</button></div>
  </section>;
}

function CustomerDetail({ controller, membershipService, messages }: {
  controller: SdkworkIamUserAdminController;
  membershipService: SdkworkMembershipBackendService;
  messages: Messages;
}) {
  const { pathname } = useLocation();
  const decodedUserId = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "");
  const canReadMemberships = hasManagerPermission("commerce.memberships.read");
  const [user, setUser] = useState<SdkworkIamAdminUser | null>(null);
  const [memberships, setMemberships] = useState<Awaited<ReturnType<SdkworkMembershipBackendService["listMembers"]>>["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    setLoading(true); setError(false);
    const userRequest = controller.retrieveUser(decodedUserId);
    const membershipRequest = canReadMemberships
      ? membershipService.listMembers({ userId: decodedUserId, page: 1, pageSize: 20 })
      : Promise.resolve(null);
    void Promise.all([userRequest, membershipRequest]).then(([item, membershipPage]) => {
      if (!item) throw new Error("customer not found");
      setUser(item); setMemberships(membershipPage?.items ?? []);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [canReadMemberships, controller, decodedUserId, membershipService]);
  if (error) return <p role="alert">{messages.error}</p>;
  if (loading || !user) return <p role="status">{messages.loading}</p>;
  return <section className="manager-operations-page">
    <div className="manager-detail-grid"><article><h2>{messages.identity}</h2><dl><div><dt>User ID</dt><dd>{user.userId}</dd></div><div><dt>Name</dt><dd>{user.displayName || "-"}</dd></div><div><dt>Username</dt><dd>{user.username || "-"}</dd></div><div><dt>Email</dt><dd>{maskEmail(user.email)}</dd></div><div><dt>Phone</dt><dd>{maskPhone(user.phone)}</dd></div><div><dt>Status</dt><dd>{user.status || "-"}</dd></div></dl></article></div>
    {canReadMemberships ? <><h3>{messages.memberships}</h3><div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr><th>ID</th><th>Plan</th><th>Status</th><th>Period</th></tr></thead><tbody>{memberships.length ? memberships.map((membership) => <tr key={membership.id}><td><Link to={`/admin/memberships/members/${encodeURIComponent(membership.id)}`}>{membership.id}</Link></td><td>{membership.planCode}</td><td>{membership.status}</td><td>{membership.startedAt}<small>{membership.expiresAt}</small></td></tr>) : <tr><td colSpan={4}>{messages.noMemberships}</td></tr>}</tbody></table></div></> : null}
  </section>;
}

function CustomerControllerRoute({ children, messages }: {
  children: (controller: SdkworkIamUserAdminController) => React.ReactNode;
  messages: Messages;
}) {
  const state = useCustomerController();
  if (state.error) return <p role="alert">{messages.error}</p>;
  if (!state.controller) return <p role="status">{messages.loading}</p>;
  return children(state.controller);
}

function maskEmail(value?: string): string {
  if (!value) return "-";
  const [local = "", domain = ""] = value.split("@");
  return domain ? `${local.slice(0, 2)}***@${domain}` : "***";
}

function maskPhone(value?: string): string {
  if (!value) return "-";
  return value.length > 7 ? `${value.slice(0, 3)}****${value.slice(-4)}` : "***";
}

export function createSdkworkManagerCustomerAdminContribution(locale: string): AdminModuleContribution {
  const messages = resolveCustomerMessages(locale);
  const membershipService = getManagerMembershipBackendService();
  return {
    access: { requiredPermissions: ["iam.users.read"], permissionMode: "all" },
    capability: "customer-360",
    commercial: { entitlementKey: "sdkwork.customer.admin", releaseChannel: "stable", tier: "standard" },
    defaultPath: "/admin/customers/overview",
    displayName: messages.displayName,
    domain: "platform",
    header: { description: messages.description, title: messages.title },
    id: "platform.customers",
    packageName: "@sdkwork/manager-pc-admin-customer",
    pathPrefix: "/admin/customers",
    routes: [
      { Component: () => <CustomerControllerRoute messages={messages}>{(controller) => <CustomerOverview controller={controller} membershipService={membershipService} messages={messages} />}</CustomerControllerRoute>, description: messages.routes.overview[1], id: "platform.customers.overview", label: messages.routes.overview[0], path: "/admin/customers/overview", requiredPermissions: ["iam.users.read"] },
      { Component: () => <CustomerControllerRoute messages={messages}>{(controller) => <CustomerDirectory controller={controller} messages={messages} />}</CustomerControllerRoute>, description: messages.routes.directory[1], id: "platform.customers.directory", label: messages.routes.directory[0], path: "/admin/customers/directory", requiredPermissions: ["iam.users.read"] },
      { Component: () => <CustomerControllerRoute messages={messages}>{(controller) => <CustomerDetail controller={controller} membershipService={membershipService} messages={messages} />}</CustomerControllerRoute>, description: messages.details, id: "platform.customers.detail", label: messages.details, navigationVisible: false, path: "/admin/customers/:userId", requiredPermissions: ["iam.users.read"] },
    ],
    surface: "backend-admin",
  };
}

export * from "./i18n";
