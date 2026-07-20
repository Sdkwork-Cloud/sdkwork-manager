import { type FormEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  Building2,
  ChartColumn,
  CheckCircle2,
  Coins,
  ContactRound,
  CreditCard,
  Database,
  Download,
  Gauge,
  GitBranch,
  Grid2X2,
  HardDrive,
  KeyRound,
  Landmark,
  Languages,
  Layers3,
  Link2,
  ListChecks,
  LogOut,
  Megaphone,
  Moon,
  Network,
  Package,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Route,
  ScrollText,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Scale,
  Store,
  Sun,
  Tags,
  TicketPercent,
  Truck,
  UserCheck,
  UserRoundCog,
  Users,
  WalletCards,
  Webhook,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import type {
  AdminModuleAccessScope,
  AdminModuleNavigationGroup,
  AdminModuleRegistry,
  AdminModuleRoute,
} from "@sdkwork/manager-pc-core";
import { useSdkworkTheme } from "@sdkwork/ui-pc-react/theme";

import { useManagerShellMessages } from "./i18n";

type AdminHostShellProps = {
  accessScope: AdminModuleAccessScope;
  locale: string;
  onLocaleChange: (locale: string) => void;
  onSignOut: () => Promise<void>;
  registry: AdminModuleRegistry;
};

export function AdminModuleNavigation({ accessScope, registry }: Pick<AdminHostShellProps, "accessScope" | "registry">) {
  const { adminHost } = useManagerShellMessages();
  const { pathname } = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const module = registry.findModuleForPath(pathname);

  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 860px)").matches) {
      return;
    }
    sidebarRef.current
      ?.querySelector<HTMLElement>(".manager-sidebar__link.is-active")
      ?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }, [pathname]);

  if (!module || !registry.hasModuleAccess(module, accessScope)) {
    return (
      <aside className="manager-sidebar" aria-label={adminHost.moduleNavigation} ref={sidebarRef}>
        <p className="manager-sidebar__heading">{adminHost.workspace}</p>
        <p className="manager-sidebar__empty">{adminHost.selectModule}</p>
      </aside>
    );
  }

  const visibleRoutes = registry.listVisibleRoutes(module, accessScope);
  const navigationSections = groupNavigationRoutes(visibleRoutes);

  return (
    <aside className="manager-sidebar" aria-label={`${module.displayName} ${adminHost.moduleNavigation}`} ref={sidebarRef}>
      <nav className="manager-sidebar__nav">
        {navigationSections.length ? navigationSections.map((section) => {
          const headingId = section.group
            ? `manager-sidebar-group-${module.id}-${section.group.id}`
            : undefined;
          return (
            <section
              aria-labelledby={headingId}
              className="manager-sidebar__section"
              key={section.group?.id ?? "ungrouped"}
            >
              {section.group ? (
                <div className="manager-sidebar__group-heading">
                  <h3 id={headingId}>{section.group.label}</h3>
                  <span aria-hidden="true">{section.routes.length}</span>
                </div>
              ) : null}
              <div className="manager-sidebar__items">
                {section.routes.map((route) => (
                  <NavLink
                    className={({ isActive }) => `manager-sidebar__link${isActive ? " is-active" : ""}`}
                    end
                    key={route.id}
                    title={route.description}
                    to={route.path}
                  >
                    <span className="manager-sidebar__icon" aria-hidden="true"><AdminRouteIcon routeId={route.id} /></span>
                    <span className="manager-sidebar__label">{route.label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          );
        }) : <p className="manager-sidebar__empty">{adminHost.noAvailableCapabilities}</p>}
      </nav>
    </aside>
  );
}

type AdminNavigationSection = {
  group?: AdminModuleNavigationGroup;
  routes: AdminModuleRoute[];
};

function groupNavigationRoutes(routes: readonly AdminModuleRoute[]): AdminNavigationSection[] {
  const sections = new Map<string, AdminNavigationSection>();
  for (const route of routes) {
    const group = route.navigationGroups?.[0];
    const key = group?.id ?? "ungrouped";
    const section = sections.get(key) ?? { group, routes: [] };
    section.routes.push(route);
    sections.set(key, section);
  }
  return [...sections.values()];
}

const ADMIN_ROUTE_ICONS: Readonly<Record<string, LucideIcon>> = {
  "commerce.marketing.applications": CheckCircle2,
  "commerce.marketing.campaigns": Megaphone,
  "commerce.marketing.claims": UserCheck,
  "commerce.marketing.codeBatches": QrCode,
  "commerce.marketing.codes": TicketPercent,
  "commerce.marketing.distributions": Send,
  "commerce.marketing.ledger": BookOpenCheck,
  "commerce.marketing.offers": BadgeCheck,
  "commerce.marketing.overview": ChartColumn,
  "commerce.marketing.stocks": Archive,
  "commerce.memberships.entitlements": BadgeCheck,
  "commerce.memberships.members": Users,
  "commerce.memberships.overview": ChartColumn,
  "commerce.memberships.packageGroups": Boxes,
  "commerce.memberships.packages": Package,
  "commerce.memberships.plans": Layers3,
  "commerce.payment.attempts": Activity,
  "commerce.payment.channels": Route,
  "commerce.payment.integration": Plug,
  "commerce.payment.methods": CreditCard,
  "commerce.payment.providers": Landmark,
  "commerce.payment.reconciliation": Scale,
  "commerce.payment.records": ReceiptText,
  "commerce.payment.refunds": RefreshCcw,
  "commerce.payment.routeRules": GitBranch,
  "commerce.payment.subMerchants": Store,
  "commerce.payment.webhooks": Webhook,
  "commerce.trade.afterSales": RefreshCcw,
  "commerce.trade.orders": ShoppingCart,
  "commerce.trade.packages": PackagePlus,
  "commerce.trade.refunds": ReceiptText,
  "commerce.trade.shipments": Truck,
  "commerce.trade.tokenBank": Coins,
  "commerce.trade.withdrawals": WalletCards,
  "drive.audit": ShieldAlert,
  "drive.downloads": Download,
  "drive.labels": Tags,
  "drive.maintenance": Wrench,
  "drive.quotas": Gauge,
  "drive.spaces": HardDrive,
  "drive.storage-bindings": GitBranch,
  "drive.storage-providers": Database,
  "iam.account-binding": Link2,
  "iam.audit": ShieldAlert,
  "iam.oauth": KeyRound,
  "iam.oauth.activity": Activity,
  "iam.oauth.applications": KeyRound,
  "iam.oauth.authorizations": Link2,
  "iam.oauth.governance": ShieldCheck,
  "iam.oauth.login-configuration": Settings2,
  "iam.oauth.overview": Gauge,
  "iam.oauth.providers": Plug,
  "iam.oauth.resources": Database,
  "iam.organizations": Network,
  "iam.permissions": ShieldCheck,
  "iam.policies": ScrollText,
  "iam.roles": UserRoundCog,
  "iam.tenants": Building2,
  "iam.users": Users,
  "platform.customers.directory": ContactRound,
  "platform.customers.overview": ChartColumn,
  "platform.integration.overview": Settings2,
};

function AdminRouteIcon({ routeId }: { routeId: string }) {
  const Icon = ADMIN_ROUTE_ICONS[routeId] ?? ListChecks;
  return <Icon size={16} strokeWidth={1.9} />;
}

export function AdminHostShell({ accessScope, locale, onLocaleChange, onSignOut, registry }: AdminHostShellProps) {
  const { adminHost } = useManagerShellMessages();
  const { colorMode, setThemeSelection } = useSdkworkTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [moduleQuery, setModuleQuery] = useState("");
  const modules = registry.listVisibleModules(accessScope);
  const matchingModules = useMemo(() => {
    const query = moduleQuery.trim().toLocaleLowerCase(locale);
    if (!query) return modules;
    return modules.filter((module) => [
      module.displayName,
      module.domain,
      module.capability,
      ...module.routes.map((route) => `${route.label} ${route.description ?? ""}`),
    ].some((value) => value.toLocaleLowerCase(locale).includes(query)));
  }, [locale, moduleQuery, modules]);
  const activeModule = registry.findModuleForPath(pathname);
  const activeRoute = registry.findRouteForPath(pathname);
  const canAccessActiveRoute = Boolean(
    activeModule
      && registry.hasModuleAccess(activeModule, accessScope)
      && (!activeRoute || registry.hasRouteAccess(activeRoute, accessScope)),
  );
  const isEdgeToEdgeRoute = canAccessActiveRoute && activeRoute?.contentLayout === "edge-to-edge";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = matchingModules[0];
    if (target) {
      navigate(registry.resolveModuleDefaultPath(target, accessScope));
      setModuleQuery("");
    }
  };

  const handleSidebarToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    setSidebarOpen((current) => !current);
  };
  const sidebarToggleLabel = isSidebarOpen
    ? adminHost.hideModuleNavigation
    : adminHost.showModuleNavigation;
  const themeToggleLabel = colorMode === "light"
    ? adminHost.switchToDarkMode
    : adminHost.switchToLightMode;

  return (
    <div className="manager-admin-app">
      <header className="manager-global-header">
        <div className="manager-brand" aria-label={adminHost.brandLabel}>
          <span className="manager-brand__mark" aria-hidden="true"><Boxes size={19} strokeWidth={2.25} /></span>
          <span>{adminHost.brandLabel}</span>
          <span className="manager-brand__badge">{adminHost.adminBadge}</span>
        </div>
        <nav className="manager-global-header__modules" aria-label={adminHost.registeredModules}>
          {modules.map((module) => (
            <NavLink
              aria-current={activeModule?.id === module.id ? "page" : undefined}
              className={`manager-module-switcher${activeModule?.id === module.id ? " is-active" : ""}`}
              key={module.id}
              to={registry.resolveModuleDefaultPath(module, accessScope)}
            >
              {module.displayName}
            </NavLink>
          ))}
        </nav>
        <div className="manager-global-header__actions">
          <form className="manager-search" onSubmit={handleSearch} role="search">
            <Search aria-hidden="true" size={16} />
            <input aria-label={adminHost.searchModules} list="manager-module-search-results" onChange={(event) => setModuleQuery(event.target.value)} placeholder={adminHost.searchModules} type="search" value={moduleQuery} />
            <datalist id="manager-module-search-results">
              {matchingModules.map((module) => <option key={module.id} value={module.displayName}>{module.domain} / {module.capability}</option>)}
            </datalist>
          </form>
          <button
            aria-label={themeToggleLabel}
            className="manager-icon-button manager-theme-toggle"
            onClick={() => setThemeSelection(colorMode === "light" ? "dark" : "light")}
            title={themeToggleLabel}
            type="button"
          >
            {colorMode === "light" ? <Moon aria-hidden="true" size={18} /> : <Sun aria-hidden="true" size={18} />}
          </button>
          <label className="manager-locale-select" title={adminHost.language}>
            <Languages aria-hidden="true" size={16} />
            <span className="manager-visually-hidden">{adminHost.language}</span>
            <select
              aria-label={adminHost.language}
              onChange={(event) => onLocaleChange(event.target.value)}
              value={locale}
            >
              <option value="zh-CN">{adminHost.simplifiedChinese}</option>
              <option value="en-US">{adminHost.english}</option>
            </select>
          </label>
          <button
            className="manager-icon-button"
            onClick={handleSidebarToggle}
            title={sidebarToggleLabel}
            type="button"
          >
            {isSidebarOpen ? <PanelLeftClose aria-hidden="true" size={18} /> : <PanelLeftOpen aria-hidden="true" size={18} />}
            <span className="manager-visually-hidden">{sidebarToggleLabel}</span>
          </button>
          <button className="manager-sign-out" onClick={() => void onSignOut()} title={adminHost.signOut} type="button">
            <LogOut aria-hidden="true" size={16} />
            {adminHost.signOut}
          </button>
        </div>
      </header>

      <div className={`manager-admin-workspace${isSidebarOpen ? "" : " manager-admin-workspace--collapsed"}`}>
        {isSidebarOpen ? <AdminModuleNavigation accessScope={accessScope} registry={registry} /> : null}
        <main className={`manager-main-content${isEdgeToEdgeRoute ? " manager-main-content--edge-to-edge" : ""}`}>
          {activeRoute && canAccessActiveRoute ? (
            <activeRoute.Component />
          ) : pathname === "/" ? (
            <AdminHostWelcomePage accessScope={accessScope} registry={registry} />
          ) : activeModule && !canAccessActiveRoute ? (
            <AdminHostAccessDeniedPage />
          ) : (
            <Navigate replace to={registry.resolveDefaultPath(accessScope)} />
          )}
        </main>
      </div>
    </div>
  );
}

export function AdminHostWelcomePage({ accessScope, registry }: Pick<AdminHostShellProps, "accessScope" | "registry">) {
  const { adminHost } = useManagerShellMessages();
  const modules = registry.listVisibleModules(accessScope);
  const entitlementSummary = useMemo(
    () => modules.filter((module) => module.commercial.tier !== "foundation").length,
    [modules],
  );

  return (
    <section className="manager-welcome" aria-labelledby="manager-welcome-title">
      <div className="manager-welcome__heading">
        <Grid2X2 aria-hidden="true" size={22} />
        <div>
          <p className="manager-welcome__eyebrow">{adminHost.unifiedWorkspace}</p>
          <h1 id="manager-welcome-title">{adminHost.moduleAssemblyTitle}</h1>
          <p>{adminHost.moduleAssemblyDescription}</p>
        </div>
      </div>
      <div className="manager-module-grid">
        {modules.map((module) => (
          <NavLink className="manager-module-card" key={module.id} to={registry.resolveModuleDefaultPath(module, accessScope)}>
            <div>
              <p className="manager-module-card__domain">{module.domain}</p>
              <h2>{module.displayName}</h2>
              <p>{module.header.description}</p>
            </div>
            <dl>
              <div><dt>{adminHost.capability}</dt><dd>{module.capability}</dd></div>
              <div><dt>{adminHost.commercialTier}</dt><dd>{module.commercial.tier}</dd></div>
              <div><dt>{adminHost.releaseChannel}</dt><dd>{module.commercial.releaseChannel}</dd></div>
            </dl>
          </NavLink>
        ))}
      </div>
      {entitlementSummary ? (
        <p className="manager-welcome__note">{adminHost.commercialModulesNote}</p>
      ) : null}
    </section>
  );
}

export function AdminHostAccessDeniedPage() {
  const { integration } = useManagerShellMessages();
  return (
    <section className="manager-integration-page" aria-labelledby="manager-access-denied-title">
      <p className="manager-welcome__eyebrow">{integration.accessEyebrow}</p>
      <h2 id="manager-access-denied-title">{integration.accessTitle}</h2>
      <p>{integration.accessDescription}</p>
    </section>
  );
}

export function AdminHostIntegrationPage() {
  const { integration } = useManagerShellMessages();
  return (
    <section className="manager-integration-page" aria-labelledby="manager-integration-title">
      <p className="manager-welcome__eyebrow">{integration.eyebrow}</p>
      <h2 id="manager-integration-title">{integration.title}</h2>
      <p>{integration.description}</p>
      <ul>
        <li>{integration.moduleOwnershipRule}</li>
        <li>{integration.remoteCodeRule}</li>
        <li>{integration.lifecycleRule}</li>
      </ul>
    </section>
  );
}
