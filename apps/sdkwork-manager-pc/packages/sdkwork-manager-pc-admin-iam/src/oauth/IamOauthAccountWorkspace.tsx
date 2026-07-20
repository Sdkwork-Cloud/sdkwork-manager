import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Globe2,
  KeyRound,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { Button, OperationDrawer, Switch } from "@sdkwork/ui-pc-react";

import type { ManagerIamOauthAccountMessages } from "../types/i18n";
import type {
  IamOauthAccount,
  IamOauthAccountController,
  IamOauthAccountDraft,
  IamOauthAccountKind,
  IamOauthProviderOption,
} from "./oauthAccountTypes";

type IamOauthAccountWorkspaceProps = {
  canManage: boolean;
  controller: IamOauthAccountController;
  messages: ManagerIamOauthAccountMessages;
  view: "accounts" | "applications";
};

const EMPTY_DRAFT: IamOauthAccountDraft = {
  appId: "",
  clientId: "",
  displayName: "",
  enabled: true,
  environment: "production",
  kind: "oauth",
  miniProgramEnvironment: "release",
  miniProgramOriginalId: "",
  providerCatalogId: "",
  providerCode: "",
  providerTenantId: "",
  redirectUri: "",
  secretValue: "",
};

export function IamOauthAccountWorkspace({ canManage, controller, messages, view }: IamOauthAccountWorkspaceProps) {
  const [workspace, setWorkspace] = useState(() => controller.getState());
  const [draft, setDraft] = useState<IamOauthAccountDraft>(EMPTY_DRAFT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [providerFilter, setProviderFilter] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string>();
  const [drawerError, setDrawerError] = useState<string>();

  const reload = () => {
    setNotice(undefined);
    setWorkspace(controller.getState());
    void controller.load()
      .then(setWorkspace)
      .catch(() => {
        setWorkspace(controller.getState());
        setNotice(messages.errors.load);
      });
  };

  useEffect(reload, [controller]);

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return workspace.accounts.filter((account) => {
      if (providerFilter && account.providerCode !== providerFilter) return false;
      if (!normalized) return true;
      return [account.displayName, account.applicationName, account.appId, account.clientId, account.providerCode]
        .some((value) => value.toLocaleLowerCase().includes(normalized));
    });
  }, [providerFilter, query, workspace.accounts]);

  const openCreate = () => {
    const provider = workspace.providers[0];
    setDraft({
      ...EMPTY_DRAFT,
      appId: workspace.applications[0]?.appId ?? "",
      environment: workspace.applications[0]?.environment || "production",
      kind: provider?.kind ?? "oauth",
      providerCatalogId: provider?.catalogId ?? "",
      providerCode: provider?.code ?? "",
    });
    setNotice(undefined);
    setDrawerError(undefined);
    setDrawerOpen(true);
  };

  const openEdit = (account: IamOauthAccount) => {
    setDraft({
      appId: account.appId,
      clientId: account.clientId,
      displayName: account.displayName,
      enabled: account.enabled,
      environment: account.environment || "production",
      integrationId: account.integrationId,
      kind: account.kind,
      miniProgramEnvironment: account.miniProgramEnvironment || "release",
      miniProgramOriginalId: account.miniProgramOriginalId,
      providerCatalogId: account.providerCatalogId,
      providerCode: account.providerCode,
      providerTenantId: account.providerTenantId,
      redirectUri: account.redirectUri,
      secretValue: "",
    });
    setNotice(undefined);
    setDrawerError(undefined);
    setDrawerOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setNotice(undefined);
    setDrawerError(undefined);
    setWorkspace(controller.getState());
    void controller.saveAccount(draft)
      .then((next) => {
        setWorkspace(next);
        setDrawerOpen(false);
      })
      .catch(() => {
        setWorkspace(controller.getState());
        setDrawerError(messages.errors.save);
      });
  };

  const toggleAccount = (account: IamOauthAccount, enabled: boolean) => {
    setNotice(undefined);
    setWorkspace(controller.getState());
    void controller.setAccountEnabled(account, enabled)
      .then(setWorkspace)
      .catch(() => {
        setWorkspace(controller.getState());
        setNotice(messages.errors.status);
      });
  };

  if (workspace.status === "loading" && workspace.accounts.length === 0) {
    return <div className="manager-module-loading" role="status">{messages.loading}</div>;
  }

  const hasActiveFilters = Boolean(query.trim() || providerFilter);

  return (
    <section className="manager-oauth-accounts" aria-label={view === "applications" ? messages.applicationAccess.title : messages.summary.accounts}>
      {notice ? (
        <div className="manager-oauth-accounts__notice" role="alert">
          <AlertTriangle aria-hidden="true" size={16} />
          <span>{notice}</span>
          <Button onClick={reload} size="sm" type="button" variant="outline">
            <RefreshCw aria-hidden="true" size={15} />
            {messages.actions.retry}
          </Button>
        </div>
      ) : null}

      {view === "accounts" ? (
        <>
          <div className="manager-oauth-accounts__summary" aria-label={messages.summary.accounts}>
            <SummaryMetric label={messages.summary.accounts} value={workspace.accounts.length} />
            <SummaryMetric label={messages.summary.enabled} value={workspace.accounts.filter((account) => account.enabled).length} />
            <SummaryMetric label={messages.summary.applications} value={new Set(workspace.accounts.map((account) => account.appId).filter(Boolean)).size} />
            <SummaryMetric label={messages.summary.missingSecret} tone="warning" value={workspace.accounts.filter((account) => !account.secretConfigured).length} />
          </div>

          <div className="manager-oauth-accounts__toolbar">
            <label className="manager-oauth-accounts__search">
              <Search aria-hidden="true" size={16} />
              <input
                aria-label={messages.filters.searchPlaceholder}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={messages.filters.searchPlaceholder}
                type="search"
                value={query}
              />
            </label>
            <select aria-label={messages.form.provider} onChange={(event) => setProviderFilter(event.target.value)} value={providerFilter}>
              <option value="">{messages.filters.allProviders}</option>
              {workspace.providers.map((provider) => (
                <option key={provider.code} value={provider.code}>{providerDisplayName(provider, messages)}</option>
              ))}
            </select>
            <Button disabled={!canManage || workspace.applications.length === 0 || workspace.providers.length === 0} onClick={openCreate} type="button">
              <Plus aria-hidden="true" size={16} />
              {messages.actions.add}
            </Button>
          </div>

          <div className="manager-oauth-accounts__table-meta">
            <span aria-live="polite" role="status">
              <strong>{filteredAccounts.length}</strong> / {workspace.accounts.length} {messages.summary.accounts}
            </span>
            {hasActiveFilters ? (
              <Button onClick={() => { setQuery(""); setProviderFilter(""); }} size="sm" type="button" variant="ghost">
                <X aria-hidden="true" size={15} />
                {messages.filters.clear}
              </Button>
            ) : null}
          </div>

          {workspace.applications.length === 0 ? (
            <EmptyState message={messages.empty.applications} />
          ) : filteredAccounts.length === 0 ? (
            <EmptyState message={workspace.accounts.length === 0 ? messages.empty.accounts : messages.empty.filtered} />
          ) : (
            <AccountTable
              accounts={filteredAccounts}
              messages={messages}
              canManage={canManage}
              onEdit={openEdit}
              onToggle={toggleAccount}
              providers={workspace.providers}
              saving={workspace.status === "saving"}
            />
          )}
        </>
      ) : (
        <ApplicationAccessView
          accounts={workspace.accounts}
          applications={workspace.applications}
          canManage={canManage}
          messages={messages}
          onEdit={openEdit}
          onToggle={toggleAccount}
          providers={workspace.providers}
          saving={workspace.status === "saving"}
        />
      )}

      <AccountDrawer
        draft={draft}
        error={drawerError}
        messages={messages}
        onChange={setDraft}
        onOpenChange={setDrawerOpen}
        onSubmit={submit}
        open={drawerOpen}
        providers={workspace.providers}
        applications={workspace.applications}
        saving={workspace.status === "saving"}
      />
    </section>
  );
}

function SummaryMetric({ label, tone, value }: { label: string; tone?: "warning"; value: number }) {
  return (
    <div data-tone={tone}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="manager-oauth-accounts__empty" role="status">{message}</div>;
}

function AccountTable({ accounts, canManage, messages, onEdit, onToggle, providers, saving }: {
  accounts: readonly IamOauthAccount[];
  canManage: boolean;
  messages: ManagerIamOauthAccountMessages;
  onEdit: (account: IamOauthAccount) => void;
  onToggle: (account: IamOauthAccount, enabled: boolean) => void;
  providers: readonly IamOauthProviderOption[];
  saving: boolean;
}) {
  return (
    <div aria-label={messages.summary.accounts} className="manager-oauth-accounts__table-wrap" role="region" tabIndex={0}>
      <table aria-busy={saving} className="manager-oauth-accounts__table">
        <caption className="sr-only">{messages.summary.accounts}</caption>
        <thead>
          <tr>
            <th>{messages.table.account}</th>
            <th>{messages.table.platform}</th>
            <th>{messages.table.application}</th>
            <th>{messages.table.environment}</th>
            <th>{messages.table.credential}</th>
            <th>{messages.table.status}</th>
            <th><span className="sr-only">{messages.table.actions}</span></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.integrationId}>
              <td>
                <strong>{account.displayName}</strong>
                <small>{account.clientId}</small>
              </td>
              <td><ProviderBadge account={account} messages={messages} providers={providers} /></td>
              <td>
                <span>{account.applicationName || messages.status.unbound}</span>
                <small>{account.appId}</small>
              </td>
              <td><span className="manager-oauth-accounts__environment">{account.environment || "-"}</span></td>
              <td>
                <span className="manager-oauth-accounts__credential" data-ready={account.secretConfigured}>
                  {account.secretConfigured ? <CheckCircle2 aria-hidden="true" size={15} /> : <AlertTriangle aria-hidden="true" size={15} />}
                  {account.secretConfigured ? messages.status.ready : messages.status.missingSecret}
                </span>
              </td>
              <td>
                <div className="manager-oauth-accounts__switch">
                  <Switch
                    aria-label={`${account.displayName} ${messages.table.status}`}
                    checked={account.enabled}
                    disabled={!canManage || saving}
                    onCheckedChange={(enabled) => onToggle(account, enabled)}
                  />
                  <span>{account.enabled ? messages.status.enabled : messages.status.disabled}</span>
                </div>
              </td>
              <td>
                <Button aria-label={`${messages.actions.edit}: ${account.displayName}`} disabled={!canManage} onClick={() => onEdit(account)} size="icon" title={messages.actions.edit} type="button" variant="ghost">
                  <Pencil aria-hidden="true" size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationAccessView({ accounts, applications, canManage, messages, onEdit, onToggle, providers, saving }: {
  accounts: readonly IamOauthAccount[];
  applications: readonly { appId: string; displayName: string; environment: string; status: string }[];
  canManage: boolean;
  messages: ManagerIamOauthAccountMessages;
  onEdit: (account: IamOauthAccount) => void;
  onToggle: (account: IamOauthAccount, enabled: boolean) => void;
  providers: readonly IamOauthProviderOption[];
  saving: boolean;
}) {
  if (applications.length === 0) return <EmptyState message={messages.empty.applications} />;
  return (
    <div className="manager-oauth-applications">
      {applications.map((application) => {
        const boundAccounts = accounts.filter((account) => account.appId === application.appId);
        return (
          <section className="manager-oauth-applications__group" key={application.appId}>
            <header>
              <div>
                <h2>{application.displayName}</h2>
                <p>{application.appId}</p>
              </div>
              <span>{application.environment}</span>
            </header>
            {boundAccounts.length === 0 ? (
              <div className="manager-oauth-applications__empty">{messages.applicationAccess.empty}</div>
            ) : (
              <ul>
                {boundAccounts.map((account) => (
                  <li key={account.integrationId}>
                    <ProviderBadge account={account} messages={messages} providers={providers} />
                    <div>
                      <strong>{account.displayName}</strong>
                      <small>{account.clientId}</small>
                    </div>
                    <span className="manager-oauth-accounts__credential" data-ready={account.secretConfigured}>
                      {account.secretConfigured ? messages.status.ready : messages.status.missingSecret}
                    </span>
                    <Switch
                      aria-label={`${account.displayName} ${messages.table.status}`}
                      checked={account.enabled}
                      disabled={!canManage || saving}
                      onCheckedChange={(enabled) => onToggle(account, enabled)}
                    />
                    <Button aria-label={`${messages.actions.edit}: ${account.displayName}`} disabled={!canManage} onClick={() => onEdit(account)} size="icon" title={messages.actions.edit} type="button" variant="ghost">
                      <Pencil aria-hidden="true" size={16} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ProviderBadge({ account, messages, providers }: {
  account: IamOauthAccount;
  messages: ManagerIamOauthAccountMessages;
  providers: readonly IamOauthProviderOption[];
}) {
  const provider = providers.find((candidate) => candidate.code === account.providerCode);
  const Icon = account.kind === "mini_program" ? Smartphone : account.kind === "official_account" ? MessageCircle : Globe2;
  return (
    <span className="manager-oauth-accounts__provider" data-provider={providerTone(account.providerCode)}>
      <Icon aria-hidden="true" size={15} />
      {providerDisplayName(provider ?? { catalogId: "", code: account.providerCode, displayName: account.providerCode, kind: account.kind }, messages)}
    </span>
  );
}

function AccountDrawer({ applications, draft, error, messages, onChange, onOpenChange, onSubmit, open, providers, saving }: {
  applications: readonly { appId: string; displayName: string; environment: string }[];
  draft: IamOauthAccountDraft;
  error?: string;
  messages: ManagerIamOauthAccountMessages;
  onChange: (draft: IamOauthAccountDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent) => void;
  open: boolean;
  providers: readonly IamOauthProviderOption[];
  saving: boolean;
}) {
  const editing = Boolean(draft.integrationId);
  const setField = <K extends keyof IamOauthAccountDraft>(key: K, value: IamOauthAccountDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };
  const selectProvider = (providerCode: string) => {
    const provider = providers.find((candidate) => candidate.code === providerCode);
    if (!provider) return;
    onChange({
      ...draft,
      kind: provider.kind,
      providerCatalogId: provider.catalogId,
      providerCode: provider.code,
      redirectUri: provider.kind === "mini_program" ? "" : draft.redirectUri,
    });
  };

  return (
    <OperationDrawer
      description={editing ? messages.form.editDescription : messages.form.createDescription}
      footer={(
        <div className="manager-oauth-account-form__footer">
          <Button disabled={saving} onClick={() => onOpenChange(false)} type="button" variant="outline">{messages.actions.cancel}</Button>
          <Button disabled={saving} form="manager-oauth-account-form" type="submit">
            <KeyRound aria-hidden="true" size={16} />
            {saving ? messages.actions.saving : messages.actions.save}
          </Button>
        </div>
      )}
      onOpenChange={(nextOpen) => { if (!saving) onOpenChange(nextOpen); }}
      open={open}
      size="lg"
      title={editing ? messages.form.editTitle : messages.form.createTitle}
    >
      <form className="manager-oauth-account-form" id="manager-oauth-account-form" onSubmit={onSubmit}>
        {error ? (
          <div className="manager-oauth-account-form__error manager-oauth-account-form__wide" role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            <span>{error}</span>
          </div>
        ) : null}
        <label>
          <span>{messages.form.provider}</span>
          <select disabled={editing} onChange={(event) => selectProvider(event.target.value)} required value={draft.providerCode}>
            {providers.map((provider) => (
              <option key={provider.code} value={provider.code}>{providerDisplayName(provider, messages)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{messages.form.displayName}</span>
          <input onChange={(event) => setField("displayName", event.target.value)} required value={draft.displayName} />
        </label>
        <label>
          <span>{messages.form.application}</span>
          <select
            onChange={(event) => {
              const application = applications.find((candidate) => candidate.appId === event.target.value);
              onChange({ ...draft, appId: event.target.value, environment: application?.environment || draft.environment });
            }}
            required
            value={draft.appId}
          >
            <option disabled value="">-</option>
            {applications.map((application) => (
              <option key={application.appId} value={application.appId}>{application.displayName} ({application.environment})</option>
            ))}
          </select>
        </label>
        <label>
          <span>{messages.form.environment}</span>
          <select onChange={(event) => setField("environment", event.target.value)} value={draft.environment}>
            <option value="production">production</option>
            <option value="staging">staging</option>
            <option value="dev">dev</option>
          </select>
        </label>
        <label className="manager-oauth-account-form__wide">
          <span>{messages.form.appId}</span>
          <input autoComplete="off" onChange={(event) => setField("clientId", event.target.value)} required value={draft.clientId} />
          <small>{messages.form.appIdHint}</small>
        </label>
        <label className="manager-oauth-account-form__wide">
          <span>{messages.form.secret}</span>
          <input autoComplete="new-password" onChange={(event) => setField("secretValue", event.target.value)} required={!editing} type="password" value={draft.secretValue} />
          <small>{messages.form.secretHint}</small>
        </label>
        {draft.kind === "mini_program" ? (
          <>
            <label>
              <span>{messages.form.miniProgramOriginalId}</span>
              <input onChange={(event) => setField("miniProgramOriginalId", event.target.value)} placeholder="gh_xxxxxxxx" value={draft.miniProgramOriginalId} />
              <small>{messages.form.miniProgramOriginalIdHint}</small>
            </label>
            <label>
              <span>{messages.form.miniProgramEnvironment}</span>
              <select onChange={(event) => setField("miniProgramEnvironment", event.target.value)} value={draft.miniProgramEnvironment}>
                <option value="release">release</option>
                <option value="trial">trial</option>
                <option value="develop">develop</option>
              </select>
            </label>
          </>
        ) : (
          <label className="manager-oauth-account-form__wide">
            <span>{messages.form.callbackUrl}</span>
            <input onChange={(event) => setField("redirectUri", event.target.value)} required type="url" value={draft.redirectUri} />
            <small>{messages.form.callbackUrlHint}</small>
          </label>
        )}
        {(draft.providerCode === "wechat_open" || draft.providerCode === "microsoft") ? (
          <label className="manager-oauth-account-form__wide">
            <span>{messages.form.providerTenantId}</span>
            <input onChange={(event) => setField("providerTenantId", event.target.value)} value={draft.providerTenantId} />
            <small>{messages.form.providerTenantIdHint}</small>
          </label>
        ) : null}
        <label className="manager-oauth-account-form__toggle manager-oauth-account-form__wide">
          <Switch aria-label={messages.form.enabled} checked={draft.enabled} onCheckedChange={(enabled) => setField("enabled", enabled)} />
          <span>{messages.form.enabled}</span>
        </label>
      </form>
    </OperationDrawer>
  );
}

function providerDisplayName(provider: IamOauthProviderOption, messages: ManagerIamOauthAccountMessages) {
  if (provider.code === "wechat") return `WeChat · ${messages.kind.officialAccount}`;
  if (provider.code === "wechat_mini_program") return `WeChat · ${messages.kind.miniProgram}`;
  if (provider.code === "wechat_open") return "WeChat Open Platform";
  return provider.displayName || provider.code;
}

function providerTone(providerCode: string) {
  if (providerCode.startsWith("wechat")) return "wechat";
  if (["alipay", "microsoft"].includes(providerCode)) return "blue";
  if (["google", "github", "apple"].includes(providerCode)) return "neutral";
  return "brand";
}
