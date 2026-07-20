import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type {
  CouponStock,
  CouponStockRequest,
  DiscountApplication,
  PromotionAdminListQuery,
  PromotionAdminPage,
  PromotionCampaign,
  PromotionCampaignRequest,
  PromotionCode,
  PromotionCodeBatch,
  PromotionCodeBatchRequest,
  PromotionCouponLedgerEntry,
  PromotionDistributionRequest,
  PromotionDistributionTask,
  PromotionOffer,
  PromotionOfferRequest,
  PromotionOverview,
  PromotionUserCoupon,
  SdkworkPromotionBackendService,
} from "@sdkwork/promotion-service";
import {
  hasManagerPermission,
  type AdminModuleContribution,
} from "@sdkwork/manager-pc-core";
import { getManagerPromotionBackendService } from "@sdkwork/manager-pc-admin-core";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  QrCode,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  ConfirmDialog,
  Combobox,
  type ComboboxOption,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@sdkwork/ui-pc-react";
import { uuid } from "@sdkwork/utils";

type Language = "en-US" | "zh-CN";
type PageProps = {
  service: SdkworkPromotionBackendService;
  language: Language;
};
type Feedback = { kind: "error" | "success"; message: string } | null;
type EntityOptionLoader = (query: string) => Promise<ComboboxOption[]>;

const COPY = {
  "zh-CN": {
    displayName: "营销中心",
    description:
      "管理营销活动、优惠券、券库存、券码批次、定向发放、领取和核销全生命周期。",
    error: "操作失败，请检查营销权限、输入内容与服务状态。",
    empty: "当前条件下暂无记录。",
    loading: "正在加载营销数据...",
    search: "搜索",
    searchPlaceholder: "输入编号、名称或用户 ID",
    previous: "上一页",
    next: "下一页",
    create: "新建",
    edit: "编辑",
    save: "保存",
    cancel: "取消",
    remove: "删除",
    processing: "处理中...",
    success: "操作已完成。",
    navigationGroups: {
      audit: "核销与审计",
      campaign: "活动与优惠券",
      delivery: "库存与发放",
      insights: "营销洞察",
      lifecycle: "领券生命周期",
    },
    routes: {
      overview: ["经营概览", "查看活动、库存、领取、核销和券码指标"],
      campaigns: ["营销活动", "创建、编辑和管理活动生命周期"],
      offers: ["优惠券", "创建优惠券并管理折扣规则、生效周期和活动关联"],
      stocks: ["券库存", "创建投放库存并查看领取与核销余量"],
      codeBatches: ["券码批次", "按库存批次生成一人一码兑换券"],
      distributions: ["发放任务", "向指定用户批量发放账户券"],
      claims: ["领取记录", "查询领取、后台发放和用户券状态"],
      codes: ["券码明细", "查看脱敏券码及兑换进度"],
      ledger: ["库存流水", "审计库存扣减、领取和发放流水"],
      applications: ["核销记录", "查看订单优惠应用、结算和回滚"],
    },
  },
  "en-US": {
    displayName: "Marketing Center",
    description:
      "Manage campaigns, coupons, stock, code batches, distribution, claims, and redemption lifecycle.",
    error:
      "The operation failed. Check permissions, input, and service health.",
    empty: "No records match the current filters.",
    loading: "Loading marketing data...",
    search: "Search",
    searchPlaceholder: "Search by number, name, or user ID",
    previous: "Previous",
    next: "Next",
    create: "Create",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    remove: "Delete",
    processing: "Processing...",
    success: "Operation completed.",
    navigationGroups: {
      audit: "Redemption & audit",
      campaign: "Campaigns & coupons",
      delivery: "Stock & distribution",
      insights: "Marketing insights",
      lifecycle: "Coupon lifecycle",
    },
    routes: {
      overview: [
        "Overview",
        "Review campaign, stock, claim, redemption, and code indicators",
      ],
      campaigns: ["Campaigns", "Create, edit, and manage campaign lifecycle"],
      offers: [
        "Coupons",
        "Create coupons and manage discount rules, validity, and campaigns",
      ],
      stocks: ["Coupon Stock", "Create distribution stock and review balances"],
      codeBatches: [
        "Code Batches",
        "Generate single-use redemption codes by stock batch",
      ],
      distributions: [
        "Distribution",
        "Issue account coupons to selected users",
      ],
      claims: [
        "Claim Records",
        "Review claims, admin issues, and user-coupon status",
      ],
      codes: ["Coupon Codes", "Review masked codes and redemption progress"],
      ledger: [
        "Stock Ledger",
        "Audit stock deductions, claims, and distribution entries",
      ],
      applications: [
        "Redemptions",
        "Review discount application, settlement, and rollback",
      ],
    },
  },
} as const;

function usePromotionPage<T>(
  loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>,
  refreshKey = 0,
) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PromotionAdminPage<T>>({
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResult(
        await loader({ page, pageSize: 20, q: query.trim() || undefined }),
      );
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loader, page, query]);
  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 250);
    return () => window.clearTimeout(timer);
  }, [refreshKey, reload]);
  return { error, loading, page, query, reload, result, setPage, setQuery };
}

function OperationsTable<T>({
  columns,
  language,
  loader,
  refreshKey = 0,
  renderRow,
  toolbar,
  feedback,
}: {
  columns: string[];
  language: Language;
  loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>;
  refreshKey?: number;
  renderRow: (item: T, reload: () => Promise<boolean>) => ReactNode;
  toolbar?: ReactNode;
  feedback?: Feedback;
}) {
  const copy = COPY[language];
  const state = usePromotionPage(loader, refreshKey);
  return (
    <section aria-busy={state.loading} className="manager-operations-page">
      <div className="manager-operations-filter-row">
        <label>
          <span>{copy.search}</span>
          <input
            type="search"
            placeholder={copy.searchPlaceholder}
            value={state.query}
            onChange={(event) => {
              state.setPage(1);
              state.setQuery(event.target.value);
            }}
          />
        </label>
        <span className="manager-operations-note">
          {state.result.totalItems}
        </span>
        {toolbar}
      </div>
      {state.error ? (
        <p className="manager-feedback manager-feedback--error" role="alert">
          {copy.error}
        </p>
      ) : null}
      {feedback ? (
        <p
          className={`manager-feedback manager-feedback--${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
      {state.loading ? (
        <p className="manager-feedback" role="status">
          {copy.loading}
        </p>
      ) : (
        <div aria-label={columns.join(", ")} className="manager-operations-table-wrap" role="region" tabIndex={0}>
          <table className="manager-operations-table">
            <caption className="sr-only">{columns.join(" / ")}</caption>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.result.items.length ? (
                state.result.items.map((item) => renderRow(item, state.reload))
              ) : (
                <tr>
                  <td colSpan={columns.length}>{copy.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="manager-operations-pagination">
        <button
          aria-label={copy.previous}
          disabled={state.page <= 1 || state.loading}
          onClick={() => state.setPage((value) => value - 1)}
          title={copy.previous}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
        <span>
          {state.page} / {Math.max(1, state.result.totalPages)}
        </span>
        <button
          aria-label={copy.next}
          disabled={
            state.page >= Math.max(1, state.result.totalPages) || state.loading
          }
          onClick={() => state.setPage((value) => value + 1)}
          title={copy.next}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </section>
  );
}

function FeedbackForm({
  children,
  onSubmit,
  onCancel,
  language,
  pending,
  title,
  description,
  feedback,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  language: Language;
  pending: boolean;
  title: string;
  description?: string;
  feedback?: Feedback;
}) {
  const copy = COPY[language];
  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open && !pending) onCancel();
      }}
    >
      <DrawerContent size="md">
        <form className="manager-drawer-form" onSubmit={onSubmit}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          <DrawerBody className="manager-drawer-fields">
            {feedback ? (
              <p
                className={`manager-feedback manager-feedback--${feedback.kind}`}
                role={feedback.kind === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </p>
            ) : null}
            {children}
          </DrawerBody>
          <DrawerFooter>
            <button disabled={pending} onClick={onCancel} type="button">
              <X aria-hidden="true" size={16} />
              {copy.cancel}
            </button>
            <button disabled={pending} type="submit">
              <Check aria-hidden="true" size={16} />
              {pending ? copy.processing : copy.save}
            </button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function EntityPicker({
  emptyText,
  label,
  language,
  loader,
  onValueChange,
  placeholder,
  required = false,
  value,
}: {
  emptyText: string;
  label: string;
  language: Language;
  loader: EntityOptionLoader;
  onValueChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void loader(query)
        .then((items) => {
          if (!active) return;
          setOptions((current) => {
            const selected = current.find((option) => option.value === value);
            return selected && !items.some((option) => option.value === value)
              ? [selected, ...items]
              : items;
          });
        })
        .catch(() => {
          if (active) setOptions([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loader, query, value]);

  const resolvedOptions =
    value && !options.some((option) => option.value === value)
      ? [{ value, label: value }, ...options]
      : options;
  return (
    <div className="manager-drawer-field">
      <span>{label}</span>
      <Combobox
        aria-required={required}
        clearable={!required}
        emptyText={emptyText}
        onValueChange={onValueChange}
        options={resolvedOptions}
        placeholder={loading ? (language === "zh-CN" ? "正在加载..." : "Loading...") : placeholder}
        searchPlaceholder={language === "zh-CN" ? "输入名称或编码搜索" : "Search by name or code"}
        slotProps={{ input: { onValueChange: setQuery } }}
        value={value}
      />
    </div>
  );
}

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function validDateRange(startsAt: string, endsAt?: string | null) {
  return !endsAt || new Date(endsAt).getTime() > new Date(startsAt).getTime();
}

function formatDiscount(item: PromotionOffer, language: Language) {
  const value = item.discountValue ?? "0";
  if (item.discountType === "PERCENTAGE") return `${value}%`;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${item.currencyCode || "CNY"}`;
  try {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: item.currencyCode || "CNY",
    }).format(amount);
  } catch {
    return `${value} ${item.currencyCode || "CNY"}`;
  }
}

function useStockOptionLoader(
  service: SdkworkPromotionBackendService,
  language: Language,
) {
  return useCallback<EntityOptionLoader>(
    async (query) => {
      const page = await service.listCouponStocks({
        page: 1,
        pageSize: 20,
        q: query.trim() || undefined,
        status: 1,
      });
      return page.items.map((item) => ({
        value: item.id,
        label: item.stockNo,
        description:
          language === "zh-CN"
            ? `可用 ${item.availableQuantity} / 总量 ${item.totalQuantity}`
            : `${item.availableQuantity} available / ${item.totalQuantity} total`,
        keywords: [item.stockNo, item.offerId],
      }));
    },
    [language, service],
  );
}
const toLocalDate = (value?: string | null) =>
  value ? value.slice(0, 16) : "";
const nowLocal = () => new Date(Date.now() + 60_000).toISOString().slice(0, 16);

function MarketingStatus({
  language,
  status,
}: {
  language: Language;
  status: number | string;
}) {
  const normalized =
    typeof status === "number" ? (status === 1 ? "ACTIVE" : "INACTIVE") : status;
  const labels: Record<string, string> = {
    ACTIVE: "启用",
    ARCHIVED: "已归档",
    CANCELLED: "已取消",
    COMPLETED: "已完成",
    DRAFT: "草稿",
    ENDED: "已结束",
    FAILED: "失败",
    INACTIVE: "停用",
    PAUSED: "已暂停",
    PENDING: "待处理",
    PROCESSING: "处理中",
    SCHEDULED: "待生效",
    SUCCESS: "成功",
  };
  const label = language === "zh-CN" ? labels[normalized] || normalized : normalized;
  return <span className="manager-status-badge" data-status={normalized}>{label}</span>;
}

function MarketingOverview({ service, language }: PageProps) {
  const [value, setValue] = useState<PromotionOverview | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    void service
      .getOverview()
      .then(setValue)
      .catch(() => setError(true));
  }, [service]);
  if (error) return <p role="alert">{COPY[language].error}</p>;
  if (!value) return <p role="status">{COPY[language].loading}</p>;
  const metrics =
    language === "zh-CN"
      ? [
          ["优惠券总数", value.totalOffers],
          ["启用优惠券", value.activeOffers],
          ["券总量", value.totalCouponStock],
          ["可发放", value.availableCoupons],
          ["已领取", value.claimedCoupons],
          ["已核销", value.redeemedCoupons],
          ["有效券码", value.activeCodes],
          ["优惠应用", value.discountApplications],
        ]
      : [
          ["Coupons", value.totalOffers],
          ["Active coupons", value.activeOffers],
          ["Coupon stock", value.totalCouponStock],
          ["Available", value.availableCoupons],
          ["Claimed", value.claimedCoupons],
          ["Redeemed", value.redeemedCoupons],
          ["Active codes", value.activeCodes],
          ["Applications", value.discountApplications],
        ];
  return (
    <div className="manager-kpi-grid">
      {metrics.map(([label, count]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{count}</strong>
        </article>
      ))}
    </div>
  );
}

const emptyCampaign = (): PromotionCampaignRequest => ({
  displayName: "",
  campaignCode: "",
  description: "",
  channelScope: "ALL",
  audienceScope: "ALL",
  startsAt: nowLocal(),
  endsAt: null,
  status: "DRAFT",
});
function MarketingCampaigns({ service, language }: PageProps) {
  const copy = COPY[language];
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const [draft, setDraft] = useState<PromotionCampaignRequest | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PromotionCampaign | null>(null);
  const loader = useCallback(
    (query: PromotionAdminListQuery) => service.listCampaigns(query),
    [service],
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    if (!validDateRange(draft.startsAt, draft.endsAt)) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "结束时间必须晚于开始时间。"
            : "The end time must be later than the start time.",
      });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      if (editingId) await service.updateCampaign(editingId, draft);
      else await service.createCampaign(draft);
      setDraft(null);
      setEditingId(null);
      setFeedback({ kind: "success", message: copy.success });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  const begin = (item?: PromotionCampaign) => {
    setFeedback(null);
    setEditingId(item?.id ?? null);
    setDraft(
      item
        ? {
            campaignCode: item.campaignCode,
            displayName: item.displayName,
            description: item.description,
            channelScope: item.channelScope,
            audienceScope: item.audienceScope,
            startsAt: toLocalDate(item.startsAt),
            endsAt: toLocalDate(item.endsAt) || null,
            status: item.status,
            version: item.version,
          }
        : emptyCampaign(),
    );
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setPending(true);
    setFeedback(null);
    try {
      await service.deleteCampaign(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback({ kind: "success", message: copy.success });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      {draft ? (
        <FeedbackForm
          description={
            language === "zh-CN"
              ? "配置活动周期、覆盖渠道和目标人群。"
              : "Configure the campaign period, channels, and audience."
          }
          language={language}
          feedback={feedback}
          pending={pending}
          onCancel={() => setDraft(null)}
          onSubmit={(event) => void submit(event)}
          title={
            editingId
              ? language === "zh-CN"
                ? "编辑营销活动"
                : "Edit campaign"
              : language === "zh-CN"
                ? "创建营销活动"
                : "Create campaign"
          }
        >
          <label>
            {language === "zh-CN" ? "活动名称" : "Name"}
            <input
              required
              value={draft.displayName}
              onChange={(e) =>
                setDraft({ ...draft, displayName: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "活动说明" : "Description"}
            <textarea
              maxLength={500}
              rows={4}
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "渠道范围" : "Channel scope"}
            <input
              required
              value={draft.channelScope}
              onChange={(e) =>
                setDraft({ ...draft, channelScope: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "人群范围" : "Audience scope"}
            <input
              required
              value={draft.audienceScope}
              onChange={(e) =>
                setDraft({ ...draft, audienceScope: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "活动编码" : "Code"}
            <input
              value={draft.campaignCode ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, campaignCode: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "开始时间" : "Starts"}
            <input
              required
              type="datetime-local"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            />
          </label>
          <label>
            {language === "zh-CN" ? "结束时间" : "Ends"}
            <input
              min={draft.startsAt}
              type="datetime-local"
              value={draft.endsAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, endsAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "状态" : "Status"}
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {[
                "DRAFT",
                "SCHEDULED",
                "ACTIVE",
                "PAUSED",
                "ENDED",
                "CANCELLED",
                "ARCHIVED",
              ].map((v) => (
                <option key={v} value={v}>
                  {language === "zh-CN"
                    ? {
                        ACTIVE: "进行中",
                        ARCHIVED: "已归档",
                        CANCELLED: "已取消",
                        DRAFT: "草稿",
                        ENDED: "已结束",
                        PAUSED: "已暂停",
                        SCHEDULED: "待生效",
                      }[v]
                    : v}
                </option>
              ))}
            </select>
          </label>
        </FeedbackForm>
      ) : null}
      <OperationsTable
        feedback={feedback}
        columns={
          language === "zh-CN"
            ? ["活动", "周期", "渠道/人群", "状态", "操作"]
            : ["Campaign", "Period", "Channel / Audience", "Status", "Actions"]
        }
        language={language}
        loader={loader}
        refreshKey={refreshKey}
        toolbar={
          canManage ? (
            <button onClick={() => begin()} type="button">
              <Plus aria-hidden="true" size={16} />
              {language === "zh-CN" ? "创建活动" : "Create campaign"}
            </button>
          ) : null
        }
        renderRow={(item) => (
          <tr key={item.id}>
            <td>
              <strong>{item.displayName}</strong>
              <small>{item.campaignCode || item.campaignNo}</small>
            </td>
            <td>
              {item.startsAt}
              <small>{item.endsAt || "-"}</small>
            </td>
            <td>
              {item.channelScope} / {item.audienceScope}
            </td>
            <td><MarketingStatus language={language} status={item.status} /></td>
            <td className="manager-operations-actions">
              {canManage ? (
                <>
                  <button onClick={() => begin(item)} type="button">
                    <Pencil aria-hidden="true" size={15} />
                    {copy.edit}
                  </button>
                  <button
                    className="manager-action-danger"
                    disabled={item.status !== "DRAFT"}
                    onClick={() => setDeleteTarget(item)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    {copy.remove}
                  </button>
                </>
              ) : (
                "-"
              )}
            </td>
          </tr>
        )}
      />
      <ConfirmDialog
        cancelLabel={copy.cancel}
        closeOnConfirm={false}
        confirmLabel={copy.remove}
        confirmLoading={pending}
        description={deleteTarget ? `${language === "zh-CN" ? "删除活动" : "Delete campaign"} ${deleteTarget.displayName}?` : undefined}
        onConfirm={() => void remove()}
        onOpenChange={(open) => { if (!open && !pending) setDeleteTarget(null); }}
        open={Boolean(deleteTarget)}
        title={language === "zh-CN" ? "删除营销活动" : "Delete campaign"}
        tone="danger"
      />
    </>
  );
}

const emptyOffer = (): PromotionOfferRequest => ({
  offerType: "COUPON",
  displayName: "",
  audienceScope: "ALL",
  combinability: "EXCLUSIVE",
  goodsScope: "BOTH",
  priority: 0,
  startsAt: nowLocal(),
  endsAt: null,
  status: 0,
  discountType: "FIXED",
  discountValue: "10",
  minimumAmount: "100",
  maximumDiscountAmount: null,
  currencyCode: "CNY",
});
function MarketingOffers({ service, language }: PageProps) {
  const copy = COPY[language];
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const [draft, setDraft] = useState<PromotionOfferRequest | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<PromotionOffer | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const loader = useCallback(
    (q: PromotionAdminListQuery) => service.listOffers(q),
    [service],
  );
  const loadCampaignOptions = useCallback<EntityOptionLoader>(
    async (query) => {
      const page = await service.listCampaigns({
        page: 1,
        pageSize: 20,
        q: query.trim() || undefined,
      });
      return page.items.map((item) => ({
        value: item.id,
        label: item.displayName,
        description: item.campaignCode || item.campaignNo,
        keywords: [item.displayName, item.campaignCode || item.campaignNo],
      }));
    },
    [service],
  );
  const begin = (item?: PromotionOffer) => {
    setFeedback(null);
    setEditingId(item?.id ?? null);
    setDraft(
      item
        ? {
            campaignId: item.campaignId,
            offerCode: item.offerCode,
            offerType: item.offerType,
            displayName: item.displayName,
            description: item.description,
            audienceScope: "ALL",
            combinability: "EXCLUSIVE",
            goodsScope: "BOTH",
            priority: item.priority,
            startsAt: toLocalDate(item.startsAt),
            endsAt: toLocalDate(item.endsAt) || null,
            status: item.status as 0 | 1,
            discountType: item.discountType || "FIXED",
            discountValue: item.discountValue || "0",
            minimumAmount: item.minimumAmount || "0",
            maximumDiscountAmount: item.maximumDiscountAmount,
            currencyCode: item.currencyCode || "CNY",
            version: item.version,
          }
        : emptyOffer(),
    );
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft) return;
    if (Number(draft.discountValue) <= 0 || Number(draft.minimumAmount) < 0) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "优惠值必须大于 0，使用门槛不能小于 0。"
            : "Discount value must be positive and minimum spend cannot be negative.",
      });
      return;
    }
    if (!validDateRange(draft.startsAt, draft.endsAt)) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "结束时间必须晚于开始时间。"
            : "The end time must be later than the start time.",
      });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      if (editingId) await service.updateOffer(editingId, draft);
      else await service.createOffer(draft);
      setDraft(null);
      setEditingId(null);
      setFeedback({
        kind: "success",
        message: editingId
          ? copy.success
          : language === "zh-CN"
            ? "优惠券已创建。下一步请在“券库存”中配置可发放数量与领取周期。"
            : "Coupon created. Next, configure quantity and claim period in Coupon Stock.",
      });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setPending(true);
    setFeedback(null);
    try {
      await service.deleteOffer(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback({ kind: "success", message: copy.success });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  const toggleStatus = async (
    item: PromotionOffer,
    reload: () => Promise<boolean>,
  ) => {
    setStatusPendingId(item.id);
    setFeedback(null);
    try {
      await service.updateOfferStatus(item.id, item.status === 1 ? 0 : 1);
      setFeedback({ kind: "success", message: copy.success });
      await reload();
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setStatusPendingId(null);
    }
  };
  return (
    <>
      {draft ? (
        <FeedbackForm
          description={
            language === "zh-CN"
              ? "定义优惠金额、使用门槛、生效周期与投放状态。"
              : "Define discount, minimum spend, validity, and availability."
          }
          language={language}
          feedback={feedback}
          pending={pending}
          onCancel={() => setDraft(null)}
          onSubmit={(e) => void submit(e)}
          title={
            editingId
              ? language === "zh-CN"
                ? "编辑优惠券"
                : "Edit coupon"
              : language === "zh-CN"
                ? "创建优惠券"
                : "Create coupon"
          }
        >
          <label>
            {language === "zh-CN" ? "优惠券名称" : "Coupon name"}
            <input
              required
              value={draft.displayName}
              onChange={(e) =>
                setDraft({ ...draft, displayName: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "优惠券编码" : "Coupon code"}
            <input
              maxLength={64}
              value={draft.offerCode ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  offerCode: e.target.value.toUpperCase() || null,
                })
              }
            />
          </label>
          <EntityPicker
            emptyText={language === "zh-CN" ? "未找到营销活动" : "No campaigns found"}
            label={language === "zh-CN" ? "所属活动（可选）" : "Campaign (optional)"}
            language={language}
            loader={loadCampaignOptions}
            onValueChange={(campaignId) =>
              setDraft({ ...draft, campaignId: campaignId || null })
            }
            placeholder={language === "zh-CN" ? "不关联活动" : "No campaign"}
            value={draft.campaignId ?? ""}
          />
          <label>
            {language === "zh-CN" ? "优惠券说明" : "Description"}
            <textarea
              maxLength={500}
              rows={4}
              value={draft.description ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "优惠类型" : "Discount type"}
            <select
              value={draft.discountType}
              onChange={(e) =>
                setDraft({ ...draft, discountType: e.target.value })
              }
            >
              <option value="FIXED">
                {language === "zh-CN" ? "固定金额" : "Fixed amount"}
              </option>
              <option value="PERCENTAGE">
                {language === "zh-CN" ? "百分比" : "Percentage"}
              </option>
            </select>
          </label>
          <label>
            {language === "zh-CN"
              ? draft.discountType === "PERCENTAGE"
                ? "优惠比例（%）"
                : "优惠金额"
              : draft.discountType === "PERCENTAGE"
                ? "Discount percentage (%)"
                : "Discount amount"}
            <input
              required
              inputMode="decimal"
              min="0.01"
              step="0.01"
              type="number"
              value={draft.discountValue}
              onChange={(e) =>
                setDraft({ ...draft, discountValue: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "最低金额" : "Minimum amount"}
            <input
              required
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              value={draft.minimumAmount}
              onChange={(e) =>
                setDraft({ ...draft, minimumAmount: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "最高优惠金额（可选）" : "Maximum discount (optional)"}
            <input
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              value={draft.maximumDiscountAmount ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  maximumDiscountAmount: e.target.value || null,
                })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "币种" : "Currency"}
            <input
              maxLength={3}
              required
              value={draft.currencyCode}
              onChange={(e) =>
                setDraft({ ...draft, currencyCode: e.target.value.toUpperCase() })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "开始时间" : "Starts"}
            <input
              required
              type="datetime-local"
              value={draft.startsAt}
              onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            />
          </label>
          <label>
            {language === "zh-CN" ? "结束时间" : "Ends"}
            <input
              min={draft.startsAt}
              type="datetime-local"
              value={draft.endsAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, endsAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "展示优先级" : "Priority"}
            <input
              min={0}
              type="number"
              value={draft.priority}
              onChange={(e) =>
                setDraft({ ...draft, priority: Number(e.target.value) })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "创建状态" : "Initial status"}
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: Number(e.target.value) as 0 | 1 })
              }
            >
              <option value={0}>{language === "zh-CN" ? "停用" : "Inactive"}</option>
              <option value={1}>{language === "zh-CN" ? "启用" : "Active"}</option>
            </select>
          </label>
        </FeedbackForm>
      ) : null}
      <OperationsTable
        feedback={feedback}
        columns={
          language === "zh-CN"
            ? ["优惠券", "优惠规则", "有效期", "状态", "操作"]
            : ["Coupon", "Discount", "Validity", "Status", "Actions"]
        }
        language={language}
        loader={loader}
        refreshKey={refreshKey}
        toolbar={
          canManage ? (
            <button onClick={() => begin()} type="button">
              <Plus aria-hidden="true" size={16} />
              {language === "zh-CN" ? "创建优惠券" : "Create coupon"}
            </button>
          ) : null
        }
        renderRow={(item, reload) => (
          <tr key={item.id}>
            <td>
              <strong>{item.displayName}</strong>
              <small>{item.offerCode || item.offerNo}</small>
            </td>
            <td>
              <strong>{formatDiscount(item, language)}</strong>
              <small>
                {language === "zh-CN" ? "门槛" : "Minimum"}:{" "}
                {item.minimumAmount} {item.currencyCode}
              </small>
            </td>
            <td>
              {item.startsAt}
              <small>{item.endsAt || (language === "zh-CN" ? "长期有效" : "No end date")}</small>
            </td>
            <td><MarketingStatus language={language} status={item.status} /></td>
            <td className="manager-operations-actions">
              {canManage ? (
                <>
                  <button onClick={() => begin(item)} type="button">
                    <Pencil aria-hidden="true" size={15} />
                    {copy.edit}
                  </button>
                  <button
                    aria-label={`${item.status === 1 ? (language === "zh-CN" ? "停用" : "Disable") : (language === "zh-CN" ? "启用" : "Enable")}: ${item.displayName}`}
                    disabled={statusPendingId === item.id}
                    onClick={() => void toggleStatus(item, reload)}
                    title={item.status === 1 ? (language === "zh-CN" ? "停用" : "Disable") : (language === "zh-CN" ? "启用" : "Enable")}
                    type="button"
                  >
                    {item.status === 1 ? <PowerOff aria-hidden="true" size={15} /> : <Power aria-hidden="true" size={15} />}
                  </button>
                  <button
                    className="manager-action-danger"
                    disabled={item.status !== 0}
                    onClick={() => setDeleteTarget(item)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                    {copy.remove}
                  </button>
                </>
              ) : (
                "-"
              )}
            </td>
          </tr>
        )}
      />
      <ConfirmDialog
        cancelLabel={copy.cancel}
        closeOnConfirm={false}
        confirmLabel={copy.remove}
        confirmLoading={pending}
        description={deleteTarget ? `${language === "zh-CN" ? "删除优惠券" : "Delete coupon"} ${deleteTarget.displayName}?` : undefined}
        onConfirm={() => void remove()}
        onOpenChange={(open) => { if (!open && !pending) setDeleteTarget(null); }}
        open={Boolean(deleteTarget)}
        title={language === "zh-CN" ? "删除优惠券" : "Delete coupon"}
        tone="danger"
      />
    </>
  );
}

function MarketingStocks({ service, language }: PageProps) {
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const copy = COPY[language];
  const [draft, setDraft] = useState<CouponStockRequest | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loader = useCallback(
    (q: PromotionAdminListQuery) => service.listCouponStocks(q),
    [service],
  );
  const loadOfferOptions = useCallback<EntityOptionLoader>(
    async (query) => {
      const page = await service.listOffers({
        page: 1,
        pageSize: 20,
        q: query.trim() || undefined,
        status: 1,
      });
      return page.items.map((item) => ({
        value: item.id,
        label: item.displayName,
        description: `${formatDiscount(item, language)} · ${item.offerCode || item.offerNo}`,
        keywords: [item.displayName, item.offerCode || item.offerNo],
      }));
    },
    [language, service],
  );
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.offerId) {
      setFeedback({
        kind: "error",
        message: language === "zh-CN" ? "请选择优惠券。" : "Select a coupon.",
      });
      return;
    }
    if (Number(draft.totalQuantity) <= 0 || draft.perUserLimit <= 0) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "库存数量和每人限领数量必须大于 0。"
            : "Quantity and per-user limit must be positive.",
      });
      return;
    }
    if (!validDateRange(draft.claimStartsAt || nowLocal(), draft.claimEndsAt)) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "领取结束时间必须晚于领取开始时间。"
            : "Claim end time must be later than claim start time.",
      });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      await service.createCouponStock(draft);
      setDraft(null);
      setFeedback({
        kind: "success",
        message:
          language === "zh-CN"
            ? "券库存已创建，可以继续生成券码或创建定向发放任务。"
            : "Coupon stock created. You can now generate codes or create a distribution task.",
      });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      {draft ? (
        <FeedbackForm
          description={
            language === "zh-CN"
              ? "配置可发放总量、单用户限领和领取周期。"
              : "Configure available quantity, per-user limit, and claim period."
          }
          language={language}
          feedback={feedback}
          pending={pending}
          onCancel={() => setDraft(null)}
          onSubmit={(e) => void submit(e)}
          title={language === "zh-CN" ? "创建券库存" : "Create coupon stock"}
        >
          <EntityPicker
            emptyText={language === "zh-CN" ? "未找到已启用优惠券" : "No active coupons found"}
            label={language === "zh-CN" ? "优惠券" : "Coupon"}
            language={language}
            loader={loadOfferOptions}
            onValueChange={(offerId) => setDraft({ ...draft, offerId })}
            placeholder={language === "zh-CN" ? "选择已启用优惠券" : "Select an active coupon"}
            required
            value={draft.offerId}
          />
          <label>
            {language === "zh-CN" ? "库存数量" : "Quantity"}
            <input
              required
              inputMode="numeric"
              min="1"
              step="1"
              type="number"
              value={draft.totalQuantity}
              onChange={(e) =>
                setDraft({ ...draft, totalQuantity: e.target.value })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "每人限领" : "Per-user limit"}
            <input
              required
              min={1}
              type="number"
              value={draft.perUserLimit}
              onChange={(e) =>
                setDraft({ ...draft, perUserLimit: Number(e.target.value) })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "库存类型" : "Stock type"}
            <select
              value={draft.stockType}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  stockType: e.target.value as "LIMITED" | "UNLIMITED",
                })
              }
            >
              <option value="LIMITED">
                {language === "zh-CN" ? "限量库存" : "Limited"}
              </option>
              <option value="UNLIMITED">
                {language === "zh-CN" ? "不限量" : "Unlimited"}
              </option>
            </select>
          </label>
          <label>
            {language === "zh-CN" ? "领取开始时间" : "Claim starts"}
            <input
              type="datetime-local"
              value={draft.claimStartsAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, claimStartsAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "领取结束时间" : "Claim ends"}
            <input
              min={draft.claimStartsAt ?? undefined}
              type="datetime-local"
              value={draft.claimEndsAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, claimEndsAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "库存状态" : "Stock status"}
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: Number(e.target.value) as 0 | 1 })
              }
            >
              <option value={1}>{language === "zh-CN" ? "启用" : "Active"}</option>
              <option value={0}>{language === "zh-CN" ? "停用" : "Inactive"}</option>
            </select>
          </label>
        </FeedbackForm>
      ) : null}
      <OperationsTable
        feedback={feedback}
        columns={
          language === "zh-CN"
            ? ["库存批次", "优惠券 ID", "总量", "可用", "领取/核销"]
            : ["Stock", "Coupon ID", "Total", "Available", "Claimed / Redeemed"]
        }
        language={language}
        loader={loader}
        refreshKey={refreshKey}
        toolbar={
          canManage ? (
            <button
              onClick={() => {
                setFeedback(null);
                setDraft({
                  offerId: "",
                  stockType: "LIMITED",
                  totalQuantity: "1000",
                  perUserLimit: 1,
                  claimStartsAt: nowLocal(),
                  claimEndsAt: null,
                  status: 1,
                });
              }}
              type="button"
            >
              <PackagePlus aria-hidden="true" size={16} />
              {language === "zh-CN" ? "创建券库存" : "Create stock"}
            </button>
          ) : null
        }
        renderRow={(item: CouponStock) => (
          <tr key={item.id}>
            <td>
              <strong>{item.stockNo}</strong>
              <small>{item.stockType}</small>
            </td>
            <td>{item.offerId}</td>
            <td className="manager-numeric-cell">{item.totalQuantity}</td>
            <td className="manager-numeric-cell">{item.availableQuantity}</td>
            <td className="manager-numeric-cell">
              {item.claimedQuantity} / {item.redeemedQuantity}
            </td>
          </tr>
        )}
      />
    </>
  );
}

function MarketingCodeBatches({ service, language }: PageProps) {
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const copy = COPY[language];
  const [draft, setDraft] = useState<PromotionCodeBatchRequest | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loader = useCallback(
    (q: PromotionAdminListQuery) => service.listCodeBatches(q),
    [service],
  );
  const loadStockOptions = useStockOptionLoader(service, language);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.stockId || Number(draft.quantity) <= 0) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "请选择券库存，生成数量必须大于 0。"
            : "Select coupon stock and enter a positive quantity.",
      });
      return;
    }
    if (!validDateRange(draft.startsAt || nowLocal(), draft.expiresAt)) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "券码失效时间必须晚于生效时间。"
            : "Code expiry must be later than its start time.",
      });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      await service.createCodeBatch(draft);
      setDraft(null);
      setFeedback({
        kind: "success",
        message:
          language === "zh-CN"
            ? "券码批次已提交生成，可在券码明细中查看结果。"
            : "Code batch submitted. Review generated results in Coupon Codes.",
      });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      {draft ? (
        <FeedbackForm
          description={
            language === "zh-CN"
              ? "从可用库存生成单次使用券码，并设置码制与有效期。"
              : "Generate single-use codes from available stock with format and validity."
          }
          language={language}
          feedback={feedback}
          pending={pending}
          onCancel={() => setDraft(null)}
          onSubmit={(e) => void submit(e)}
          title={language === "zh-CN" ? "生成券码批次" : "Generate code batch"}
        >
          <EntityPicker
            emptyText={language === "zh-CN" ? "未找到可用券库存" : "No active coupon stock found"}
            label={language === "zh-CN" ? "券库存" : "Coupon stock"}
            language={language}
            loader={loadStockOptions}
            onValueChange={(stockId) => setDraft({ ...draft, stockId })}
            placeholder={language === "zh-CN" ? "选择券库存" : "Select coupon stock"}
            required
            value={draft.stockId}
          />
          <label>
            {language === "zh-CN" ? "生成数量" : "Quantity"}
            <input
              required
              min="1"
              step="1"
              type="number"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
            />
          </label>
          <label>
            {language === "zh-CN" ? "生效时间" : "Starts"}
            <input
              type="datetime-local"
              value={draft.startsAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, startsAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "失效时间" : "Expires"}
            <input
              min={draft.startsAt ?? undefined}
              type="datetime-local"
              value={draft.expiresAt ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, expiresAt: e.target.value || null })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "券码前缀" : "Prefix"}
            <input
              value={draft.codePrefix}
              onChange={(e) =>
                setDraft({ ...draft, codePrefix: e.target.value.toUpperCase() })
              }
            />
          </label>
          <label>
            {language === "zh-CN" ? "券码长度" : "Length"}
            <input
              min={12}
              max={32}
              type="number"
              value={draft.codeLength}
              onChange={(e) =>
                setDraft({ ...draft, codeLength: Number(e.target.value) })
              }
            />
          </label>
        </FeedbackForm>
      ) : null}
      <OperationsTable
        feedback={feedback}
        columns={
          language === "zh-CN"
            ? ["批次", "库存 ID", "数量", "码制", "状态"]
            : ["Batch", "Stock ID", "Quantity", "Code format", "Status"]
        }
        language={language}
        loader={loader}
        refreshKey={refreshKey}
        toolbar={
          canManage ? (
            <button
              onClick={() => {
                setFeedback(null);
                setDraft({
                  stockId: "",
                  codeType: "SINGLE_USE",
                  quantity: "100",
                  codeLength: 16,
                  codePrefix: "CP",
                  startsAt: nowLocal(),
                  expiresAt: null,
                  idempotencyKey: uuid(),
                });
              }}
              type="button"
            >
              <QrCode aria-hidden="true" size={16} />
              {language === "zh-CN" ? "生成券码" : "Generate codes"}
            </button>
          ) : null
        }
        renderRow={(item: PromotionCodeBatch) => (
          <tr key={item.id}>
            <td>
              <strong>{item.batchNo}</strong>
              <small>{item.createdAt}</small>
            </td>
            <td>{item.stockId}</td>
            <td className="manager-numeric-cell">
              {item.generatedQuantity} / {item.requestedQuantity}
            </td>
            <td>
              {item.codePrefix} / {item.codeLength}
            </td>
            <td><MarketingStatus language={language} status={item.status} /></td>
          </tr>
        )}
      />
    </>
  );
}

function MarketingDistributions({ service, language }: PageProps) {
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const copy = COPY[language];
  const [stockId, setStockId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loader = useCallback(
    (q: PromotionAdminListQuery) => service.listDistributionTasks(q),
    [service],
  );
  const loadStockOptions = useStockOptionLoader(service, language);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ownerUserIds = userIds
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!stockId) {
      setFeedback({
        kind: "error",
        message: language === "zh-CN" ? "请选择券库存。" : "Select coupon stock.",
      });
      return;
    }
    if (
      ownerUserIds.length === 0 ||
      ownerUserIds.length > 200 ||
      ownerUserIds.some((value) => !/^\d+$/.test(value) || Number(value) <= 0) ||
      new Set(ownerUserIds).size !== ownerUserIds.length
    ) {
      setFeedback({
        kind: "error",
        message:
          language === "zh-CN"
            ? "请输入 1 至 200 个不重复的正整数用户 ID。"
            : "Enter 1 to 200 unique positive numeric user IDs.",
      });
      return;
    }
    const input: PromotionDistributionRequest = {
      stockId,
      ownerUserIds,
      idempotencyKey: uuid(),
    };
    setPending(true);
    setFeedback(null);
    try {
      await service.createDistributionTask(input);
      setShow(false);
      setStockId("");
      setUserIds("");
      setFeedback({
        kind: "success",
        message:
          language === "zh-CN"
            ? "定向发放任务已创建，可在列表中跟踪成功与失败数量。"
            : "Distribution task created. Track success and failure totals in the list.",
      });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setFeedback({ kind: "error", message: failureMessage(error, copy.error) });
    } finally {
      setPending(false);
    }
  };
  return (
    <>
      {show ? (
        <FeedbackForm
          description={
            language === "zh-CN"
              ? "从可用库存向指定用户账户批量发放优惠券。"
              : "Issue coupons from available stock to selected user accounts."
          }
          language={language}
          feedback={feedback}
          pending={pending}
          onCancel={() => setShow(false)}
          onSubmit={(e) => void submit(e)}
          title={language === "zh-CN" ? "创建定向发放任务" : "Create distribution task"}
        >
          <EntityPicker
            emptyText={language === "zh-CN" ? "未找到可用券库存" : "No active coupon stock found"}
            label={language === "zh-CN" ? "券库存" : "Coupon stock"}
            language={language}
            loader={loadStockOptions}
            onValueChange={setStockId}
            placeholder={language === "zh-CN" ? "选择券库存" : "Select coupon stock"}
            required
            value={stockId}
          />
          <label>
            {language === "zh-CN" ? "用户 ID（逗号或换行分隔）" : "User IDs"}
            <textarea
              required
              rows={5}
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
            />
          </label>
        </FeedbackForm>
      ) : null}
      <OperationsTable
        feedback={feedback}
        columns={
          language === "zh-CN"
            ? ["任务", "库存 ID", "请求数", "成功/失败", "状态"]
            : ["Task", "Stock ID", "Requested", "Succeeded / Failed", "Status"]
        }
        language={language}
        loader={loader}
        refreshKey={refreshKey}
        toolbar={
          canManage ? (
            <button
              onClick={() => {
                setFeedback(null);
                setShow(true);
              }}
              type="button"
            >
              <Send aria-hidden="true" size={16} />
              {language === "zh-CN" ? "创建发放任务" : "Create distribution"}
            </button>
          ) : null
        }
        renderRow={(item: PromotionDistributionTask) => (
          <tr key={item.id}>
            <td>
              <strong>{item.taskNo}</strong>
              <small>{item.createdAt}</small>
            </td>
            <td>{item.stockId}</td>
            <td className="manager-numeric-cell">{item.requestedQuantity}</td>
            <td className="manager-numeric-cell">
              {item.succeededQuantity} / {item.failedQuantity}
            </td>
            <td><MarketingStatus language={language} status={item.status} /></td>
          </tr>
        )}
      />
    </>
  );
}

function ReadOnlyTable<T>({
  service,
  language,
  kind,
}: {
  service: SdkworkPromotionBackendService;
  language: Language;
  kind: "claims" | "codes" | "ledger" | "applications";
}) {
  const loaders = {
    claims: service.listUserCoupons.bind(service),
    codes: service.listCodes.bind(service),
    ledger: service.listCouponLedger.bind(service),
    applications: service.listDiscountApplications.bind(service),
  };
  const columns = {
    claims:
      language === "zh-CN"
        ? ["用户券", "用户", "库存", "状态", "领取时间"]
        : ["Coupon", "User", "Stock", "Status", "Claimed"],
    codes:
      language === "zh-CN"
        ? ["券码", "库存", "领取进度", "状态", "失效时间"]
        : ["Code", "Stock", "Claims", "Status", "Expires"],
    ledger:
      language === "zh-CN"
        ? ["业务", "库存", "方向", "变动", "结余", "发生时间"]
        : ["Business", "Stock", "Direction", "Delta", "Balance", "Created"],
    applications:
      language === "zh-CN"
        ? ["核销单", "订单", "优惠券", "优惠金额", "状态", "应用时间"]
        : ["Application", "Order", "Coupon", "Discount", "Status", "Applied"],
  }[kind];
  return (
    <OperationsTable<T>
      columns={columns}
      language={language}
      loader={
        loaders[kind] as (
          q: PromotionAdminListQuery,
        ) => Promise<PromotionAdminPage<T>>
      }
      renderRow={(raw: T) => {
        const item = raw as PromotionUserCoupon &
          PromotionCode &
          PromotionCouponLedgerEntry &
          DiscountApplication;
        if (kind === "claims")
          return (
            <tr key={item.id}>
              <td>
                <strong>{item.couponNo}</strong>
                <small>{item.couponCode}</small>
              </td>
              <td>{item.ownerUserId}</td>
              <td>{item.stockId}</td>
              <td><MarketingStatus language={language} status={item.status} /></td>
              <td>{item.claimedAt}</td>
            </tr>
          );
        if (kind === "codes")
          return (
            <tr key={item.id}>
              <td>
                <strong>{item.promotionCode}</strong>
                <small>{item.codeNo}</small>
              </td>
              <td>{item.stockId}</td>
              <td>
                {item.claimedQuantity} / {item.maxClaims}
              </td>
              <td><MarketingStatus language={language} status={item.status} /></td>
              <td>{item.expiresAt || "-"}</td>
            </tr>
          );
        if (kind === "ledger")
          return (
            <tr key={item.id}>
              <td>
                <strong>{item.businessType}</strong>
                <small>{item.businessNo}</small>
              </td>
              <td>{item.stockId}</td>
              <td>{item.direction}</td>
              <td className="manager-numeric-cell">{item.quantityDelta}</td>
              <td className="manager-numeric-cell">{item.balanceAfter}</td>
              <td>{item.createdAt}</td>
            </tr>
          );
        return (
          <tr key={item.id}>
            <td>{item.applicationNo}</td>
            <td>{item.orderNo || item.orderId}</td>
            <td>{item.offerId}</td>
            <td className="manager-numeric-cell">
              {item.discountAmount} {item.currencyCode}
            </td>
            <td><MarketingStatus language={language} status={item.status} /></td>
            <td>{item.appliedAt}</td>
          </tr>
        );
      }}
    />
  );
}

export function createSdkworkManagerMarketingAdminContribution(
  locale: string,
): AdminModuleContribution {
  const language: Language = locale === "zh-CN" ? "zh-CN" : "en-US";
  const copy = COPY[language];
  const service = getManagerPromotionBackendService();
  const groupKeys = {
    applications: "audit",
    campaigns: "campaign",
    claims: "lifecycle",
    codeBatches: "delivery",
    codes: "lifecycle",
    distributions: "delivery",
    ledger: "audit",
    offers: "campaign",
    overview: "insights",
    stocks: "delivery",
  } as const satisfies Record<
    keyof typeof copy.routes,
    keyof typeof copy.navigationGroups
  >;
  const route = (
    key: keyof typeof copy.routes,
    Component: (props: PageProps) => ReactNode,
  ) => {
    const groupKey = groupKeys[key];
    return {
      Component: () => Component({ service, language }),
      description: copy.routes[key][1],
      id: `commerce.marketing.${key}`,
      label: copy.routes[key][0],
      navigationGroups: [
        { id: groupKey, label: copy.navigationGroups[groupKey] },
      ],
      path: `/admin/marketing/${key}`,
      requiredPermissions: ["commerce.marketing.read"],
    };
  };
  return {
    access: {
      permissionMode: "any",
      requiredPermissions: [
        "commerce.marketing.read",
        "commerce.marketing.manage",
      ],
    },
    capability: "marketing-admin",
    commercial: {
      entitlementKey: "sdkwork.marketing.admin",
      releaseChannel: "stable",
      tier: "professional",
    },
    defaultPath: "/admin/marketing/overview",
    displayName: copy.displayName,
    domain: "commerce",
    header: { description: copy.description, title: copy.displayName },
    id: "commerce.marketing",
    packageName: "@sdkwork/manager-pc-admin-marketing",
    pathPrefix: "/admin/marketing",
    routes: [
      route("overview", MarketingOverview),
      route("campaigns", MarketingCampaigns),
      route("offers", MarketingOffers),
      route("stocks", MarketingStocks),
      route("codeBatches", MarketingCodeBatches),
      route("distributions", MarketingDistributions),
      route("claims", (props) => (
        <ReadOnlyTable<PromotionUserCoupon> {...props} kind="claims" />
      )),
      route("codes", (props) => (
        <ReadOnlyTable<PromotionCode> {...props} kind="codes" />
      )),
      route("ledger", (props) => (
        <ReadOnlyTable<PromotionCouponLedgerEntry> {...props} kind="ledger" />
      )),
      route("applications", (props) => (
        <ReadOnlyTable<DiscountApplication> {...props} kind="applications" />
      )),
    ],
    surface: "backend-admin",
  };
}
