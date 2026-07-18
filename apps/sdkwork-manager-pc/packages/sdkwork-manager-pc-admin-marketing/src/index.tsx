import { useCallback, useEffect, useState, type ReactNode } from "react";
import type {
  CouponStock,
  DiscountApplication,
  PromotionCode,
  PromotionOffer,
  PromotionOverview,
  PromotionAdminListQuery,
  PromotionAdminPage,
  SdkworkPromotionBackendService,
} from "@sdkwork/promotion-service";
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";
import { getManagerPromotionBackendService } from "@sdkwork/manager-pc-admin-core";

type Language = "en-US" | "zh-CN";

const COPY = {
  "zh-CN": {
    description: "统一查看营销经营指标，管理活动启停、优惠券库存、推广码与优惠核销。",
    displayName: "营销中心",
    error: "数据加载失败，请检查营销权限与服务状态。",
    empty: "当前检索条件下暂无营销记录。",
    actionError: "活动状态更新失败，原状态保持不变。",
    actionSuccess: "活动状态已更新。",
    confirmStatus: (active: boolean) => `确认${active ? "停用" : "启用"}该营销活动？`,
    loading: "正在加载营销运营数据…",
    next: "下一页",
    previous: "上一页",
    search: "搜索",
    searchPlaceholder: "输入编号或名称",
    title: "营销中心",
    routes: {
      overview: ["经营概览", "查看活动、优惠券、推广码与核销关键指标"],
      offers: ["活动管理", "检索营销活动并执行启用或停用"],
      stocks: ["优惠券库存", "查看券库存、领取、核销和锁定情况"],
      codes: ["推广码", "查看推广码可用状态与领取进度"],
      applications: ["优惠核销", "查询订单优惠应用、结算与回滚记录"],
    },
  },
  "en-US": {
    description: "Operate campaign status, coupon stock, promotion codes, and discount applications from one center.",
    displayName: "Marketing Center",
    error: "Unable to load marketing data. Check permissions and service health.",
    empty: "No marketing records match the current search.",
    actionError: "The campaign status update failed. Its previous status remains active.",
    actionSuccess: "The campaign status was updated.",
    confirmStatus: (active: boolean) => `${active ? "Disable" : "Enable"} this campaign?`,
    loading: "Loading marketing operations…",
    next: "Next",
    previous: "Previous",
    search: "Search",
    searchPlaceholder: "Search by number or name",
    title: "Marketing Center",
    routes: {
      overview: ["Overview", "Review campaign, coupon, code, and redemption indicators"],
      offers: ["Campaigns", "Search campaigns and enable or disable delivery"],
      stocks: ["Coupon Stock", "Review coupon availability, claims, redemptions, and locks"],
      codes: ["Promotion Codes", "Review code availability and claim progress"],
      applications: ["Discount Applications", "Review order discount, settlement, and rollback records"],
    },
  },
} as const;

function usePromotionPage<T>(loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [result, setResult] = useState<PromotionAdminPage<T>>({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setResult(await loader({ page, pageSize: 20, q: submittedQuery || undefined }));
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loader, page, submittedQuery]);
  useEffect(() => {
    const timer = window.setTimeout(() => setSubmittedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => { void reload(); }, [reload]);
  return { error, loading, page, query, reload, result, setPage, setQuery };
}

function OperationsTable<T>({
  columns,
  feedback,
  language,
  loader,
  renderRow,
}: {
  columns: string[];
  feedback?: ReactNode;
  language: Language;
  loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>;
  renderRow: (item: T, reload: () => Promise<boolean>) => ReactNode;
}) {
  const messages = COPY[language];
  const state = usePromotionPage(loader);
  return (
    <section className="manager-operations-page">
      <label className="manager-operations-search">
        <span>{messages.search}</span>
        <input value={state.query} placeholder={messages.searchPlaceholder} onChange={(event) => { state.setPage(1); state.setQuery(event.target.value); }} />
      </label>
      {state.error ? <p role="alert">{messages.error}</p> : null}
      {feedback}
      {state.loading ? <p role="status">{messages.loading}</p> : null}
      <div className="manager-operations-table-wrap">
        <table className="manager-operations-table">
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{state.result.items.length ? state.result.items.map((item) => renderRow(item, state.reload)) : <tr><td colSpan={columns.length}>{messages.empty}</td></tr>}</tbody>
        </table>
      </div>
      <div className="manager-operations-pagination">
        <button disabled={state.page <= 1 || state.loading} onClick={() => state.setPage((value) => value - 1)} type="button">{messages.previous}</button>
        <span>{state.page} / {Math.max(1, state.result.totalPages)}</span>
        <button disabled={state.page >= Math.max(1, state.result.totalPages) || state.loading} onClick={() => state.setPage((value) => value + 1)} type="button">{messages.next}</button>
      </div>
    </section>
  );
}

function MarketingOverview({ service, language }: { service: SdkworkPromotionBackendService; language: Language }) {
  const [overview, setOverview] = useState<PromotionOverview | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { void service.getOverview().then(setOverview).catch(() => setError(true)); }, [service]);
  if (error) return <p role="alert">{COPY[language].error}</p>;
  if (!overview) return <p role="status">{COPY[language].loading}</p>;
  const metrics = language === "zh-CN" ? [
    ["活动总数", overview.totalOffers], ["启用活动", overview.activeOffers], ["券总量", overview.totalCouponStock], ["可领取券", overview.availableCoupons], ["已领取", overview.claimedCoupons], ["已核销", overview.redeemedCoupons], ["启用推广码", overview.activeCodes], ["优惠应用", overview.discountApplications],
  ] : [
    ["Total campaigns", overview.totalOffers], ["Active campaigns", overview.activeOffers], ["Coupon stock", overview.totalCouponStock], ["Available", overview.availableCoupons], ["Claimed", overview.claimedCoupons], ["Redeemed", overview.redeemedCoupons], ["Active codes", overview.activeCodes], ["Applications", overview.discountApplications],
  ];
  return <div className="manager-kpi-grid">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>;
}

function MarketingOffers({ service, language }: { service: SdkworkPromotionBackendService; language: Language }) {
  const messages = COPY[language];
  const canManage = hasManagerPermission("commerce.marketing.manage");
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const loader = useCallback((query: PromotionAdminListQuery) => service.listOffers(query), [service]);
  const columns = language === "zh-CN" ? ["活动", "类型", "开始", "状态", "操作"] : ["Campaign", "Type", "Starts", "Status", "Action"];
  const updateStatus = async (item: PromotionOffer, reload: () => Promise<boolean>) => {
    const active = item.status === 1;
    if (!window.confirm(messages.confirmStatus(active))) return;
    setPendingOfferId(item.id);
    setFeedback(null);
    try {
      await service.updateOfferStatus(item.id, active ? 0 : 1);
      if (!await reload()) throw new Error("marketing refresh failed");
      setFeedback({ kind: "success", message: messages.actionSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.actionError });
    } finally {
      setPendingOfferId(null);
    }
  };
  return <OperationsTable columns={columns} feedback={feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null} language={language} loader={loader} renderRow={(item: PromotionOffer, reload) => <tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.offerCode || item.offerNo}</small></td><td>{item.offerType}</td><td>{item.startsAt}</td><td>{item.status === 1 ? (language === "zh-CN" ? "启用" : "Active") : (language === "zh-CN" ? "停用" : "Inactive")}</td><td>{canManage ? <button disabled={pendingOfferId !== null} onClick={() => void updateStatus(item, reload)} type="button">{pendingOfferId === item.id ? (language === "zh-CN" ? "处理中…" : "Updating…") : item.status === 1 ? (language === "zh-CN" ? "停用" : "Disable") : (language === "zh-CN" ? "启用" : "Enable")}</button> : "-"}</td></tr>} />;
}

function MarketingStocks({ service, language }: { service: SdkworkPromotionBackendService; language: Language }) {
  const loader = useCallback((query: PromotionAdminListQuery) => service.listCouponStocks(query), [service]);
  const columns = language === "zh-CN" ? ["库存编号", "类型", "总量", "可用", "领取", "核销"] : ["Stock", "Type", "Total", "Available", "Claimed", "Redeemed"];
  return <OperationsTable columns={columns} language={language} loader={loader} renderRow={(item: CouponStock) => <tr key={item.id}><td>{item.stockNo}</td><td>{item.stockType}</td><td>{item.totalQuantity}</td><td>{item.availableQuantity}</td><td>{item.claimedQuantity}</td><td>{item.redeemedQuantity}</td></tr>} />;
}

function MarketingCodes({ service, language }: { service: SdkworkPromotionBackendService; language: Language }) {
  const loader = useCallback((query: PromotionAdminListQuery) => service.listCodes(query), [service]);
  const columns = language === "zh-CN" ? ["推广码", "类型", "领取", "上限", "状态"] : ["Code", "Type", "Claims", "Limit", "Status"];
  return <OperationsTable columns={columns} language={language} loader={loader} renderRow={(item: PromotionCode) => <tr key={item.id}><td><strong>{item.promotionCode}</strong><small>{item.codeNo}</small></td><td>{item.codeType}</td><td>{item.claimedQuantity}</td><td>{item.maxClaims}</td><td>{item.status}</td></tr>} />;
}

function MarketingApplications({ service, language }: { service: SdkworkPromotionBackendService; language: Language }) {
  const loader = useCallback((query: PromotionAdminListQuery) => service.listDiscountApplications(query), [service]);
  const columns = language === "zh-CN" ? ["应用编号", "订单", "优惠类型", "金额", "状态", "应用时间"] : ["Application", "Order", "Discount", "Amount", "Status", "Applied"];
  return <OperationsTable columns={columns} language={language} loader={loader} renderRow={(item: DiscountApplication) => <tr key={item.id}><td>{item.applicationNo}</td><td>{item.orderNo || item.orderId}</td><td>{item.discountType}</td><td>{item.discountAmount} {item.currencyCode}</td><td>{item.status}</td><td>{item.appliedAt}</td></tr>} />;
}

export function createSdkworkManagerMarketingAdminContribution(locale: string): AdminModuleContribution {
  const language: Language = locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
  const messages = COPY[language];
  const service = getManagerPromotionBackendService();
  const route = (key: keyof typeof messages.routes, Component: typeof MarketingOverview) => ({ Component: () => <Component language={language} service={service} />, description: messages.routes[key][1], id: `commerce.marketing.${key}`, label: messages.routes[key][0], path: `/admin/marketing/${key}`, requiredPermissions: ["commerce.marketing.read"] });
  return {
    access: { permissionMode: "any", requiredPermissions: ["commerce.marketing.read", "commerce.marketing.manage"] },
    capability: "marketing-admin",
    commercial: { entitlementKey: "sdkwork.marketing.admin", releaseChannel: "stable", tier: "professional" },
    defaultPath: "/admin/marketing/overview",
    displayName: messages.displayName,
    domain: "commerce",
    header: {
      actions: [{ id: "open-trade-center", label: language === "zh-CN" ? "交易中心" : "Trade Center", onSelect: () => { window.location.assign("/admin/trade/orders"); }, variant: "secondary" }],
      description: messages.description,
      title: messages.title,
    },
    id: "commerce.marketing",
    packageName: "@sdkwork/manager-pc-admin-marketing",
    pathPrefix: "/admin/marketing",
    routes: [route("overview", MarketingOverview), route("offers", MarketingOffers), route("stocks", MarketingStocks), route("codes", MarketingCodes), route("applications", MarketingApplications)],
    surface: "backend-admin",
  };
}
