import { type FormEvent, type MouseEvent, useMemo, useState } from "react";
import {
  Boxes,
  Building2,
  ChevronRight,
  Grid2X2,
  KeyRound,
  Languages,
  Link2,
  LogOut,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import type { AdminModuleAccessScope, AdminModuleRegistry } from "@sdkwork/manager-pc-core";

import { useManagerShellMessages } from "./i18n";

type AdminHostShellProps = {
  accessScope: AdminModuleAccessScope;
  locale: string;
  onLocaleChange: (locale: string) => void;
  onSignOut: () => Promise<void>;
  registry: AdminModuleRegistry;
};

function AdminModuleHeader({ accessScope, registry }: Pick<AdminHostShellProps, "accessScope" | "registry">) {
  const { pathname } = useLocation();
  const module = registry.findModuleForPath(pathname);
  const activeRoute = registry.findRouteForPath(pathname);

  if (!module || !registry.hasModuleAccess(module, accessScope)) {
    return null;
  }

  const Context = module.header.Context;

  return (
    <section className="manager-module-header" aria-labelledby="manager-module-title">
      <div className="manager-module-header__identity">
        <p className="manager-module-header__eyebrow">{module.domain} / {module.capability}</p>
        <h1 id="manager-module-title">{module.header.title}</h1>
        <p>{module.header.description}</p>
      </div>
      <div className="manager-module-header__tools">
        {Context ? <Context activeRoute={activeRoute} module={module} pathname={pathname} /> : null}
        {module.header.actions?.map((action) => (
          <button
            className={`manager-button manager-button--${action.variant ?? "secondary"}`}
            disabled={action.disabled || !action.onSelect}
            key={action.id}
            onClick={action.onSelect}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function AdminModuleNavigation({ accessScope, registry }: Pick<AdminHostShellProps, "accessScope" | "registry">) {
  const { adminHost } = useManagerShellMessages();
  const { pathname } = useLocation();
  const module = registry.findModuleForPath(pathname);

  if (!module || !registry.hasModuleAccess(module, accessScope)) {
    return (
      <aside className="manager-sidebar" aria-label={adminHost.moduleNavigation}>
        <p className="manager-sidebar__heading">{adminHost.workspace}</p>
        <p className="manager-sidebar__empty">{adminHost.selectModule}</p>
      </aside>
    );
  }

  const visibleRoutes = registry.listVisibleRoutes(module, accessScope);

  return (
    <aside className="manager-sidebar" aria-label={`${module.displayName} ${adminHost.moduleNavigation}`}>
      <div className="manager-sidebar__header">
        <p className="manager-sidebar__eyebrow">{adminHost.capabilityNavigation}</p>
        <h2>{module.displayName}</h2>
        <p>{adminHost.navigationCountTemplate.replace("{count}", String(visibleRoutes.length))}</p>
      </div>
      <nav className="manager-sidebar__nav">
        {visibleRoutes.length ? visibleRoutes.map((route) => (
          <NavLink className={({ isActive }) => `manager-sidebar__link${isActive ? " is-active" : ""}`} key={route.id} to={route.path}>
            <span className="manager-sidebar__icon" aria-hidden="true"><AdminRouteIcon routeId={route.id} /></span>
            <span className="manager-sidebar__label">
              <strong>{route.label}</strong>
              {route.description ? <small>{route.description}</small> : null}
            </span>
            <ChevronRight className="manager-sidebar__chevron" aria-hidden="true" size={15} />
          </NavLink>
        )) : <p className="manager-sidebar__empty">{adminHost.noAvailableCapabilities}</p>}
      </nav>
    </aside>
  );
}

function AdminRouteIcon({ routeId }: { routeId: string }) {
  if (routeId === "iam.users") return <Users size={17} />;
  if (routeId === "iam.tenants") return <Building2 size={17} />;
  if (routeId === "iam.organizations") return <Network size={17} />;
  if (routeId === "iam.authorization") return <ShieldCheck size={17} />;
  if (routeId === "iam.oauth") return <KeyRound size={17} />;
  if (routeId === "iam.account-binding") return <Link2 size={17} />;
  if (routeId === "iam.audit") return <ScrollText size={17} />;
  return <Grid2X2 size={17} />;
}

export function AdminHostShell({ accessScope, locale, onLocaleChange, onSignOut, registry }: AdminHostShellProps) {
  const { adminHost } = useManagerShellMessages();
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
              className={({ isActive }) => `manager-module-switcher${isActive ? " is-active" : ""}`}
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
        <main className="manager-main-content">
          <AdminModuleHeader accessScope={accessScope} registry={registry} />
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
