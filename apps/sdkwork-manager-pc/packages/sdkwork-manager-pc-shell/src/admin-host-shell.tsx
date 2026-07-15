import { type FormEvent, type MouseEvent, useMemo, useState } from "react";
import { Boxes, Grid2X2, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import type { AdminModuleAccessScope, AdminModuleRegistry } from "@sdkwork/manager-pc-core";

type AdminHostShellProps = {
  accessScope: AdminModuleAccessScope;
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

function AdminModuleNavigation({ accessScope, registry }: Pick<AdminHostShellProps, "accessScope" | "registry">) {
  const { pathname } = useLocation();
  const module = registry.findModuleForPath(pathname);

  if (!module || !registry.hasModuleAccess(module, accessScope)) {
    return (
      <aside className="manager-sidebar" aria-label="Module navigation">
        <p className="manager-sidebar__heading">Workspace</p>
        <p className="manager-sidebar__empty">Select a registered module to open its operational workspace.</p>
      </aside>
    );
  }

  const visibleRoutes = registry.listVisibleRoutes(module, accessScope);

  return (
    <aside className="manager-sidebar" aria-label={`${module.displayName} navigation`}>
      <p className="manager-sidebar__heading">{module.displayName}</p>
      <nav className="manager-sidebar__nav">
        {visibleRoutes.map((route) => (
          <NavLink
            className={({ isActive }) => `manager-sidebar__link${isActive ? " is-active" : ""}`}
            key={route.id}
            to={route.path}
          >
            <span>{route.label}</span>
            {route.description ? <small>{route.description}</small> : null}
          </NavLink>
        ))}
      </nav>
      {module.access.requiredPermissions?.length ? (
        <p className="manager-sidebar__permission">Server authorization: {module.access.requiredPermissions.join(", ")}</p>
      ) : null}
    </aside>
  );
}

export function AdminHostShell({ accessScope, onSignOut, registry }: AdminHostShellProps) {
  const { pathname } = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const modules = registry.listVisibleModules(accessScope);
  const activeModule = registry.findModuleForPath(pathname);
  const activeRoute = registry.findRouteForPath(pathname);
  const canAccessActiveRoute = Boolean(
    activeModule
      && registry.hasModuleAccess(activeModule, accessScope)
      && (!activeRoute || registry.hasRouteAccess(activeRoute, accessScope)),
  );

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleSidebarToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    setSidebarOpen((current) => !current);
  };

  return (
    <div className="manager-admin-app">
      <header className="manager-global-header">
        <div className="manager-brand" aria-label="SDKWork Manager">
          <span className="manager-brand__mark" aria-hidden="true"><Boxes size={19} strokeWidth={2.25} /></span>
          <span>SDKWork Manager</span>
          <span className="manager-brand__badge">Admin</span>
        </div>
        <nav className="manager-global-header__modules" aria-label="Registered modules">
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
            <input aria-label="Search modules" placeholder="Search modules" type="search" />
          </form>
          <button
            className="manager-icon-button"
            onClick={handleSidebarToggle}
            title={isSidebarOpen ? "Hide module navigation" : "Show module navigation"}
            type="button"
          >
            {isSidebarOpen ? <PanelLeftClose aria-hidden="true" size={18} /> : <PanelLeftOpen aria-hidden="true" size={18} />}
            <span className="manager-visually-hidden">{isSidebarOpen ? "Hide module navigation" : "Show module navigation"}</span>
          </button>
          <button className="manager-sign-out" onClick={() => void onSignOut()} title="Sign out" type="button">
            <LogOut aria-hidden="true" size={16} />
            Sign out
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
          <p className="manager-welcome__eyebrow">Unified admin workspace</p>
          <h1 id="manager-welcome-title">Module assembly</h1>
          <p>Only registered backend-admin contributions appear here. The host does not own their business pages, services, SDK clients, or permissions.</p>
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
              <div><dt>Capability</dt><dd>{module.capability}</dd></div>
              <div><dt>Commercial tier</dt><dd>{module.commercial.tier}</dd></div>
              <div><dt>Release channel</dt><dd>{module.commercial.releaseChannel}</dd></div>
            </dl>
          </NavLink>
        ))}
      </div>
      {entitlementSummary ? (
        <p className="manager-welcome__note">Commercial modules are displayed from the assembly catalog; tenant entitlement must remain server-authoritative.</p>
      ) : null}
    </section>
  );
}

export function AdminHostAccessDeniedPage() {
  return (
    <section className="manager-integration-page" aria-labelledby="manager-access-denied-title">
      <p className="manager-welcome__eyebrow">Access restricted</p>
      <h2 id="manager-access-denied-title">This operator scope cannot open the requested capability</h2>
      <p>Navigation visibility is derived from the IAM session permission scope. The owning backend remains the final authorization authority for every operation.</p>
    </section>
  );
}

export function AdminHostIntegrationPage() {
  return (
    <section className="manager-integration-page" aria-labelledby="manager-integration-title">
      <p className="manager-welcome__eyebrow">Host capability</p>
      <h2 id="manager-integration-title">Integration control plane</h2>
      <p>This route belongs to the host only. It establishes the route namespace, header contract, navigation frame, and module lifecycle used by every product admin contribution.</p>
      <ul>
        <li>Module packages declare their own backend SDK dependencies and operator permissions.</li>
        <li>The host composes stable package exports at build time; it does not load arbitrary remote code in an authenticated browser session.</li>
        <li>Commercial availability is declared by module metadata and enforced by the owning backend service.</li>
      </ul>
    </section>
  );
}
