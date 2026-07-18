import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import type {
  AccountValuePackageResponse,
  AccountValueRequestResponse,
  AfterSalesRequestSummary,
  ShipmentSummary,
  TokenBankPlanResponse,
} from "@sdkwork/order-pc-admin-core";
import type {
  TradeOperationsPage,
  TradeOperationsQuery,
  TradeOperationsService,
  TradeRequestAction,
} from "@sdkwork/order-pc-admin-orders";
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";
import {
  getManagerOrderAdminService,
  getManagerTradeOperationsService,
} from "@sdkwork/manager-pc-admin-core";

type Language = "en-US" | "zh-CN";

const COPY = {
  "zh-CN": {
    description: "集中处理订单、售后、发货、充值方案、退款与提现，并与支付中心协同运营。",
    displayName: "交易中心",
    loading: "正在加载交易运营数据…",
    error: "数据加载失败，请检查交易权限与服务状态。",
    empty: "当前筛选条件下暂无交易记录。",
    actionError: "操作执行失败，记录状态未变更，请稍后重试。",
    actionSuccess: "操作已提交，最新状态已刷新。",
    confirmReview: (action: TradeRequestAction, kind: "refund" | "withdrawal") =>
      `确认对该${kind === "refund" ? "退款" : "提现"}请求执行“${{ approve: "批准", reject: "拒绝", retry: "重试" }[action]}”？`,
    actionLabels: { approve: "批准", reject: "拒绝", retry: "重试" },
    previous: "上一页",
    next: "下一页",
    title: "交易中心",
    routes: {
      orders: ["订单管理", "检索订单、查看详情，并执行取消或关闭"],
      afterSales: ["售后管理", "查询退款、退货与换货申请"],
      shipments: ["发货管理", "查看履约发货与物流单状态"],
      packages: ["充值套餐", "运营积分与账户价值充值套餐"],
      tokenBank: ["Token Bank", "运营 Token Bank 周期方案"],
      refunds: ["退款审核", "批准、拒绝或重试退款请求"],
      withdrawals: ["提现审核", "批准、拒绝或重试提现请求"],
    },
  },
  "en-US": {
    description: "Operate orders, after-sales, fulfillment, value plans, refunds, and withdrawals with Payment Center coordination.",
    displayName: "Trade Center",
    loading: "Loading trade operations…",
    error: "Unable to load trade data. Check permissions and service health.",
    empty: "No trade records match the current filters.",
    actionError: "The action failed and no status was changed. Try again.",
    actionSuccess: "The action was submitted and the latest status is shown.",
    confirmReview: (action: TradeRequestAction, kind: "refund" | "withdrawal") =>
      `Apply the ${action} action to this ${kind} request?`,
    actionLabels: { approve: "Approve", reject: "Reject", retry: "Retry" },
    previous: "Previous",
    next: "Next",
    title: "Trade Center",
    routes: {
      orders: ["Orders", "Search orders, inspect details, and cancel or close orders"],
      afterSales: ["After-sales", "Review refund, return, and exchange requests"],
      shipments: ["Shipments", "Review fulfillment shipments and tracking status"],
      packages: ["Recharge Packages", "Operate points and account-value recharge packages"],
      tokenBank: ["Token Bank", "Operate Token Bank recurring plans"],
      refunds: ["Refund Review", "Approve, reject, or retry refund requests"],
      withdrawals: ["Withdrawal Review", "Approve, reject, or retry withdrawal requests"],
    },
  },
} as const;

const LazyOrdersPage = lazy(async () => {
  const module = await import("@sdkwork/order-pc-admin-orders");
  return {
    default: () => (
      <module.SdkworkOrderAdminOrdersPage
        capabilities={{ canManageOrders: hasManagerPermission("commerce.orders.manage") }}
        service={getManagerOrderAdminService()}
      />
    ),
  };
});

function useTradePage<T>(loader: (query: TradeOperationsQuery) => Promise<TradeOperationsPage<T>>) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TradeOperationsPage<T>>({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try { setResult(await loader({ page, pageSize: 20 })); return true; } catch { setError(true); return false; } finally { setLoading(false); }
  }, [loader, page]);
  useEffect(() => { void reload(); }, [reload]);
  return { error, loading, page, reload, result, setPage };
}

function TradeTable<T>({ columns, feedback, language, loader, renderRow }: { columns: string[]; feedback?: ReactNode; language: Language; loader: (query: TradeOperationsQuery) => Promise<TradeOperationsPage<T>>; renderRow: (item: T, reload: () => Promise<boolean>) => ReactNode }) {
  const messages = COPY[language];
  const state = useTradePage(loader);
  return <section className="manager-operations-page">{state.error ? <p role="alert">{messages.error}</p> : null}{feedback}{state.loading ? <p role="status">{messages.loading}</p> : null}<div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{state.result.items.length ? state.result.items.map((item) => renderRow(item, state.reload)) : <tr><td colSpan={columns.length}>{messages.empty}</td></tr>}</tbody></table></div><div className="manager-operations-pagination"><button disabled={state.page <= 1 || state.loading} onClick={() => state.setPage((value) => value - 1)} type="button">{messages.previous}</button><span>{state.page} / {Math.max(1, state.result.totalPages)}</span><button disabled={state.page >= Math.max(1, state.result.totalPages) || state.loading} onClick={() => state.setPage((value) => value + 1)} type="button">{messages.next}</button></div></section>;
}

function AfterSalesPage({ service, language }: TradePageProps) { const loader = useCallback((query: TradeOperationsQuery) => service.listAfterSales(query), [service]); return <TradeTable columns={language === "zh-CN" ? ["售后单", "订单", "类型", "金额", "状态"] : ["Request", "Order", "Type", "Amount", "Status"]} language={language} loader={loader} renderRow={(item: AfterSalesRequestSummary) => <tr key={item.afterSalesRequestId}><td>{item.afterSalesNo}</td><td>{item.orderId}</td><td>{item.afterSalesType}</td><td>{item.requestedAmount} {item.currencyCode}</td><td>{item.status}</td></tr>} />; }
function ShipmentsPage({ service, language }: TradePageProps) { const loader = useCallback((query: TradeOperationsQuery) => service.listShipments(query), [service]); return <TradeTable columns={language === "zh-CN" ? ["发货单", "履约单", "承运商", "物流号", "状态"] : ["Shipment", "Fulfillment", "Carrier", "Tracking", "Status"]} language={language} loader={loader} renderRow={(item: ShipmentSummary) => <tr key={item.shipmentId}><td>{item.shipmentNo}</td><td>{item.fulfillmentId}</td><td>{item.carrierCode}</td><td>{item.trackingNo || "-"}</td><td>{item.status}</td></tr>} />; }
function PackagesPage({ service, language }: TradePageProps) { const loader = useCallback((query: TradeOperationsQuery) => service.listAccountValuePackages(query), [service]); return <TradeTable columns={language === "zh-CN" ? ["套餐", "资产", "赠送", "价格", "状态"] : ["Package", "Asset", "Grant", "Price", "Status"]} language={language} loader={loader} renderRow={(item: AccountValuePackageResponse) => <tr key={item.packageId}><td>{item.displayName || item.packageCode}</td><td>{item.targetAsset}</td><td>{item.grantAmount}</td><td>{item.priceAmount} {item.currencyCode}</td><td>{item.status}</td></tr>} />; }
function TokenBankPage({ service, language }: TradePageProps) { const loader = useCallback((query: TradeOperationsQuery) => service.listTokenBankPlans(query), [service]); return <TradeTable columns={language === "zh-CN" ? ["方案", "周期", "额度", "价格", "状态"] : ["Plan", "Period", "Grant", "Price", "Status"]} language={language} loader={loader} renderRow={(item: TokenBankPlanResponse) => <tr key={item.planCode}><td>{item.displayName || item.planCode}</td><td>{item.planPeriod}</td><td>{item.grantAmount}</td><td>{item.priceAmount} {item.currencyCode}</td><td>{item.status}</td></tr>} />; }

type TradePageProps = { service: TradeOperationsService; language: Language };
function RequestPage({ service, language, kind }: TradePageProps & { kind: "refund" | "withdrawal" }) {
  const messages = COPY[language];
  const canManage = hasManagerPermission("commerce.orders.manage");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const loader = useCallback((query: TradeOperationsQuery) => kind === "refund" ? service.listRefundRequests(query) : service.listWithdrawalRequests(query), [kind, service]);
  const review = (id: string, action: TradeRequestAction) => kind === "refund" ? service.reviewRefundRequest(id, action) : service.reviewWithdrawalRequest(id, action);
  const executeReview = async (id: string, action: TradeRequestAction, reload: () => Promise<boolean>) => {
    if (!id || !window.confirm(messages.confirmReview(action, kind))) return;
    const actionKey = `${id}:${action}`;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await review(id, action);
      if (!await reload()) throw new Error("trade refresh failed");
      setFeedback({ kind: "success", message: messages.actionSuccess });
    } catch {
      setFeedback({ kind: "error", message: messages.actionError });
    } finally {
      setPendingAction(null);
    }
  };
  return <TradeTable columns={language === "zh-CN" ? ["请求", "订单", "资产", "金额", "状态", "操作"] : ["Request", "Order", "Asset", "Amount", "Status", "Actions"]} feedback={feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null} language={language} loader={loader} renderRow={(item: AccountValueRequestResponse, reload) => { const id = item.accountValueRequestId || item.requestNo || ""; return <tr key={id}><td>{item.requestNo}</td><td>{item.originalOrderId}</td><td>{item.targetAsset}</td><td>{item.amount} {item.currencyCode}</td><td>{item.status}</td><td className="manager-operations-actions">{canManage ? (["approve", "reject", "retry"] as const).map((action) => { const actionKey = `${id}:${action}`; return <button disabled={!id || pendingAction !== null} key={action} onClick={() => void executeReview(id, action, reload)} type="button">{pendingAction === actionKey ? `${messages.actionLabels[action]}…` : messages.actionLabels[action]}</button>; }) : "-"}</td></tr>; }} />;
}

export function createSdkworkManagerTradeAdminContribution(locale: string): AdminModuleContribution {
  const language: Language = locale.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
  const messages = COPY[language];
  const service = getManagerTradeOperationsService();
  const operationRoute = (key: keyof typeof messages.routes, Component: (props: TradePageProps) => ReactNode) => ({ Component: () => <Component language={language} service={service} />, description: messages.routes[key][1], id: `commerce.trade.${key}`, label: messages.routes[key][0], path: `/admin/trade/${key}`, requiredPermissions: ["commerce.orders.read"] });
  return {
    access: { permissionMode: "any", requiredPermissions: ["commerce.orders.read", "commerce.orders.manage"] },
    capability: "trade-admin",
    commercial: { entitlementKey: "sdkwork.trade.admin", releaseChannel: "stable", tier: "standard" },
    defaultPath: "/admin/trade/orders",
    displayName: messages.displayName,
    domain: "commerce",
    header: {
      actions: [{ id: "open-payment-center", label: language === "zh-CN" ? "支付中心" : "Payment Center", onSelect: () => { window.location.assign("/admin/payments/monitor"); }, variant: "secondary" }],
      description: messages.description,
      title: messages.title,
    },
    id: "commerce.trade",
    packageName: "@sdkwork/manager-pc-admin-trade",
    pathPrefix: "/admin/trade",
    routes: [
      { Component: () => <Suspense fallback={<div className="manager-module-loading">{messages.loading}</div>}><LazyOrdersPage /></Suspense>, description: messages.routes.orders[1], id: "commerce.trade.orders", label: messages.routes.orders[0], path: "/admin/trade/orders", requiredPermissions: ["commerce.orders.read"] },
      operationRoute("afterSales", AfterSalesPage), operationRoute("shipments", ShipmentsPage), operationRoute("packages", PackagesPage), operationRoute("tokenBank", TokenBankPage),
      operationRoute("refunds", (props) => <RequestPage {...props} kind="refund" />), operationRoute("withdrawals", (props) => <RequestPage {...props} kind="withdrawal" />),
    ],
    surface: "backend-admin",
  };
}
