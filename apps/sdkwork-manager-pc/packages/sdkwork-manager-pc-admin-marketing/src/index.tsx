import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
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
import { hasManagerPermission, type AdminModuleContribution } from "@sdkwork/manager-pc-core";
import { getManagerPromotionBackendService } from "@sdkwork/manager-pc-admin-core";
import { uuid } from "@sdkwork/utils";

type Language = "en-US" | "zh-CN";
type PageProps = { service: SdkworkPromotionBackendService; language: Language };
type Feedback = { kind: "error" | "success"; message: string } | null;

const COPY = {
  "zh-CN": {
    displayName: "营销中心", description: "管理营销活动、优惠权益、券库存、券码批次、定向发放、领取和核销全生命周期。",
    error: "操作失败，请检查营销权限、输入内容与服务状态。", empty: "当前条件下暂无记录。", loading: "正在加载营销数据...",
    search: "搜索", searchPlaceholder: "输入编号、名称或用户 ID", previous: "上一页", next: "下一页", create: "新建", edit: "编辑", save: "保存", cancel: "取消", remove: "删除", processing: "处理中...", success: "操作已完成。",
    navigationGroups: { audit: "核销与审计", campaign: "活动与权益", delivery: "库存与发放", insights: "营销洞察", lifecycle: "领券生命周期" },
    routes: {
      overview: ["经营概览", "查看活动、库存、领取、核销和券码指标"], campaigns: ["营销活动", "创建、编辑和管理活动生命周期"],
      offers: ["优惠权益", "管理优惠券模板、规则版本和活动关联"], stocks: ["券库存", "创建投放库存并查看领取与核销余量"],
      codeBatches: ["券码批次", "按库存批次生成一人一码兑换券"], distributions: ["发放任务", "向指定用户批量发放账户券"],
      claims: ["领取记录", "查询领取、后台发放和用户券状态"], codes: ["券码明细", "查看脱敏券码及兑换进度"],
      ledger: ["库存流水", "审计库存扣减、领取和发放流水"], applications: ["核销记录", "查看订单优惠应用、结算和回滚"],
    },
  },
  "en-US": {
    displayName: "Marketing Center", description: "Manage campaigns, benefits, stock, code batches, distribution, claims, and redemption lifecycle.",
    error: "The operation failed. Check permissions, input, and service health.", empty: "No records match the current filters.", loading: "Loading marketing data...",
    search: "Search", searchPlaceholder: "Search by number, name, or user ID", previous: "Previous", next: "Next", create: "Create", edit: "Edit", save: "Save", cancel: "Cancel", remove: "Delete", processing: "Processing...", success: "Operation completed.",
    navigationGroups: { audit: "Redemption & audit", campaign: "Campaigns & benefits", delivery: "Stock & distribution", insights: "Marketing insights", lifecycle: "Coupon lifecycle" },
    routes: {
      overview: ["Overview", "Review campaign, stock, claim, redemption, and code indicators"], campaigns: ["Campaigns", "Create, edit, and manage campaign lifecycle"],
      offers: ["Coupon Benefits", "Manage coupon templates, rule versions, and campaign links"], stocks: ["Coupon Stock", "Create distribution stock and review balances"],
      codeBatches: ["Code Batches", "Generate single-use redemption codes by stock batch"], distributions: ["Distribution", "Issue account coupons to selected users"],
      claims: ["Claim Records", "Review claims, admin issues, and user-coupon status"], codes: ["Coupon Codes", "Review masked codes and redemption progress"],
      ledger: ["Stock Ledger", "Audit stock deductions, claims, and distribution entries"], applications: ["Redemptions", "Review discount application, settlement, and rollback"],
    },
  },
} as const;

function usePromotionPage<T>(loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>) {
  const [page, setPage] = useState(1); const [query, setQuery] = useState("");
  const [result, setResult] = useState<PromotionAdminPage<T>>({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const reload = useCallback(async () => { setLoading(true); setError(false); try { setResult(await loader({ page, pageSize: 20, q: query.trim() || undefined })); return true; } catch { setError(true); return false; } finally { setLoading(false); } }, [loader, page, query]);
  useEffect(() => { const timer = window.setTimeout(() => void reload(), 250); return () => window.clearTimeout(timer); }, [reload]);
  return { error, loading, page, query, reload, result, setPage, setQuery };
}

function OperationsTable<T>({ columns, language, loader, renderRow, toolbar, feedback }: { columns: string[]; language: Language; loader: (query: PromotionAdminListQuery) => Promise<PromotionAdminPage<T>>; renderRow: (item: T, reload: () => Promise<boolean>) => ReactNode; toolbar?: ReactNode; feedback?: Feedback }) {
  const copy = COPY[language]; const state = usePromotionPage(loader);
  return <section className="manager-operations-page">
    <div className="manager-operations-filter-row"><label><span>{copy.search}</span><input type="search" placeholder={copy.searchPlaceholder} value={state.query} onChange={(event) => { state.setPage(1); state.setQuery(event.target.value); }} /></label>{toolbar}</div>
    {state.error ? <p role="alert">{copy.error}</p> : null}{feedback ? <p role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
    {state.loading ? <p role="status">{copy.loading}</p> : <div className="manager-operations-table-wrap"><table className="manager-operations-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{state.result.items.length ? state.result.items.map((item) => renderRow(item, state.reload)) : <tr><td colSpan={columns.length}>{copy.empty}</td></tr>}</tbody></table></div>}
    <div className="manager-operations-pagination"><button disabled={state.page <= 1 || state.loading} onClick={() => state.setPage((value) => value - 1)} type="button">{copy.previous}</button><span>{state.page} / {Math.max(1, state.result.totalPages)}</span><button disabled={state.page >= Math.max(1, state.result.totalPages) || state.loading} onClick={() => state.setPage((value) => value + 1)} type="button">{copy.next}</button></div>
  </section>;
}

function FeedbackForm({ children, onSubmit, onCancel, language, pending }: { children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; language: Language; pending: boolean }) { const copy = COPY[language]; return <form className="manager-operation-form" onSubmit={onSubmit}>{children}<div className="manager-operations-actions"><button disabled={pending} type="submit">{pending ? copy.processing : copy.save}</button><button disabled={pending} onClick={onCancel} type="button">{copy.cancel}</button></div></form>; }
const toLocalDate = (value?: string | null) => value ? value.slice(0, 16) : "";
const nowLocal = () => new Date(Date.now() + 60_000).toISOString().slice(0, 16);

function MarketingOverview({ service, language }: PageProps) { const [value, setValue] = useState<PromotionOverview | null>(null); const [error, setError] = useState(false); useEffect(() => { void service.getOverview().then(setValue).catch(() => setError(true)); }, [service]); if (error) return <p role="alert">{COPY[language].error}</p>; if (!value) return <p role="status">{COPY[language].loading}</p>; const metrics = language === "zh-CN" ? [["活动总数",value.totalOffers],["启用权益",value.activeOffers],["券总量",value.totalCouponStock],["可发放",value.availableCoupons],["已领取",value.claimedCoupons],["已核销",value.redeemedCoupons],["有效券码",value.activeCodes],["优惠应用",value.discountApplications]] : [["Campaigns",value.totalOffers],["Active benefits",value.activeOffers],["Coupon stock",value.totalCouponStock],["Available",value.availableCoupons],["Claimed",value.claimedCoupons],["Redeemed",value.redeemedCoupons],["Active codes",value.activeCodes],["Applications",value.discountApplications]]; return <div className="manager-kpi-grid">{metrics.map(([label,count]) => <article key={label}><span>{label}</span><strong>{count}</strong></article>)}</div>; }

const emptyCampaign = (): PromotionCampaignRequest => ({ displayName: "", campaignCode: "", description: "", channelScope: "ALL", audienceScope: "ALL", startsAt: nowLocal(), endsAt: null, status: "DRAFT" });
function MarketingCampaigns({ service, language }: PageProps) { const copy=COPY[language]; const canManage=hasManagerPermission("commerce.marketing.manage"); const [draft,setDraft]=useState<PromotionCampaignRequest|null>(null); const [editingId,setEditingId]=useState<string|null>(null); const [pending,setPending]=useState(false); const [feedback,setFeedback]=useState<Feedback>(null); const loader=useCallback((query:PromotionAdminListQuery)=>service.listCampaigns(query),[service]); const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!draft)return;setPending(true);setFeedback(null);try{if(editingId)await service.updateCampaign(editingId,draft);else await service.createCampaign(draft);setDraft(null);setEditingId(null);setFeedback({kind:"success",message:copy.success});window.location.reload();}catch{setFeedback({kind:"error",message:copy.error});}finally{setPending(false);}}; const begin=(item?:PromotionCampaign)=>{setEditingId(item?.id??null);setDraft(item?{campaignCode:item.campaignCode,displayName:item.displayName,description:item.description,channelScope:item.channelScope,audienceScope:item.audienceScope,startsAt:toLocalDate(item.startsAt),endsAt:toLocalDate(item.endsAt)||null,status:item.status,version:item.version}:emptyCampaign());}; return <>{draft?<FeedbackForm language={language} pending={pending} onCancel={()=>setDraft(null)} onSubmit={(event)=>void submit(event)}><label>{language==="zh-CN"?"活动名称":"Name"}<input required value={draft.displayName} onChange={(e)=>setDraft({...draft,displayName:e.target.value})}/></label><label>{language==="zh-CN"?"活动编码":"Code"}<input value={draft.campaignCode??""} onChange={(e)=>setDraft({...draft,campaignCode:e.target.value})}/></label><label>{language==="zh-CN"?"开始时间":"Starts"}<input required type="datetime-local" value={draft.startsAt} onChange={(e)=>setDraft({...draft,startsAt:e.target.value})}/></label><label>{language==="zh-CN"?"结束时间":"Ends"}<input type="datetime-local" value={draft.endsAt??""} onChange={(e)=>setDraft({...draft,endsAt:e.target.value||null})}/></label><label>{language==="zh-CN"?"状态":"Status"}<select value={draft.status} onChange={(e)=>setDraft({...draft,status:e.target.value})}>{["DRAFT","SCHEDULED","ACTIVE","PAUSED","ENDED","CANCELLED","ARCHIVED"].map((v)=><option key={v}>{v}</option>)}</select></label></FeedbackForm>:null}<OperationsTable feedback={feedback} columns={language==="zh-CN"?["活动","周期","渠道/人群","状态","操作"]:["Campaign","Period","Channel / Audience","Status","Actions"]} language={language} loader={loader} toolbar={canManage?<button onClick={()=>begin()} type="button">{copy.create}</button>:null} renderRow={(item,reload)=><tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.campaignCode||item.campaignNo}</small></td><td>{item.startsAt}<small>{item.endsAt||"-"}</small></td><td>{item.channelScope} / {item.audienceScope}</td><td>{item.status}</td><td className="manager-operations-actions">{canManage?<><button onClick={()=>begin(item)} type="button">{copy.edit}</button><button disabled={item.status!=="DRAFT"} onClick={()=>void service.deleteCampaign(item.id).then(reload).catch(()=>setFeedback({kind:"error",message:copy.error}))} type="button">{copy.remove}</button></>:"-"}</td></tr>}/></>; }

const emptyOffer=():PromotionOfferRequest=>({offerType:"COUPON",displayName:"",audienceScope:"ALL",combinability:"EXCLUSIVE",goodsScope:"BOTH",priority:0,startsAt:nowLocal(),endsAt:null,status:0,discountType:"FIXED",discountValue:"0",minimumAmount:"0",maximumDiscountAmount:null,currencyCode:"CNY"});
function MarketingOffers({service,language}:PageProps){const copy=COPY[language];const canManage=hasManagerPermission("commerce.marketing.manage");const[draft,setDraft]=useState<PromotionOfferRequest|null>(null);const[editingId,setEditingId]=useState<string|null>(null);const[pending,setPending]=useState(false);const[feedback,setFeedback]=useState<Feedback>(null);const loader=useCallback((q:PromotionAdminListQuery)=>service.listOffers(q),[service]);const begin=(item?:PromotionOffer)=>{setEditingId(item?.id??null);setDraft(item?{campaignId:item.campaignId,offerCode:item.offerCode,offerType:item.offerType,displayName:item.displayName,description:item.description,audienceScope:"ALL",combinability:"EXCLUSIVE",goodsScope:"BOTH",priority:item.priority,startsAt:toLocalDate(item.startsAt),endsAt:toLocalDate(item.endsAt)||null,status:item.status as 0|1,discountType:item.discountType||"FIXED",discountValue:item.discountValue||"0",minimumAmount:item.minimumAmount||"0",maximumDiscountAmount:item.maximumDiscountAmount,currencyCode:item.currencyCode||"CNY",version:item.version}:emptyOffer());};const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!draft)return;setPending(true);try{if(editingId)await service.updateOffer(editingId,draft);else await service.createOffer(draft);setDraft(null);setEditingId(null);setFeedback({kind:"success",message:copy.success});window.location.reload();}catch{setFeedback({kind:"error",message:copy.error});}finally{setPending(false);}};return <>{draft?<FeedbackForm language={language} pending={pending} onCancel={()=>setDraft(null)} onSubmit={(e)=>void submit(e)}><label>{language==="zh-CN"?"权益名称":"Name"}<input required value={draft.displayName} onChange={(e)=>setDraft({...draft,displayName:e.target.value})}/></label><label>{language==="zh-CN"?"活动 ID":"Campaign ID"}<input value={draft.campaignId??""} onChange={(e)=>setDraft({...draft,campaignId:e.target.value||null})}/></label><label>{language==="zh-CN"?"优惠类型":"Discount type"}<select value={draft.discountType} onChange={(e)=>setDraft({...draft,discountType:e.target.value})}><option>FIXED</option><option>PERCENTAGE</option></select></label><label>{language==="zh-CN"?"优惠值":"Discount value"}<input required inputMode="decimal" value={draft.discountValue} onChange={(e)=>setDraft({...draft,discountValue:e.target.value})}/></label><label>{language==="zh-CN"?"最低金额":"Minimum amount"}<input required inputMode="decimal" value={draft.minimumAmount} onChange={(e)=>setDraft({...draft,minimumAmount:e.target.value})}/></label><label>{language==="zh-CN"?"开始时间":"Starts"}<input required type="datetime-local" value={draft.startsAt} onChange={(e)=>setDraft({...draft,startsAt:e.target.value})}/></label></FeedbackForm>:null}<OperationsTable feedback={feedback} columns={language==="zh-CN"?["权益","优惠规则","开始时间","状态","操作"]:["Benefit","Discount","Starts","Status","Actions"]} language={language} loader={loader} toolbar={canManage?<button onClick={()=>begin()} type="button">{copy.create}</button>:null} renderRow={(item,reload)=><tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.offerCode||item.offerNo}</small></td><td>{item.discountType} {item.discountValue}<small>{language==="zh-CN"?"门槛":"Minimum"}: {item.minimumAmount}</small></td><td>{item.startsAt}</td><td>{item.status===1?"ACTIVE":"INACTIVE"}</td><td className="manager-operations-actions">{canManage?<><button onClick={()=>begin(item)} type="button">{copy.edit}</button><button onClick={()=>void service.updateOfferStatus(item.id,item.status===1?0:1).then(reload).catch(()=>setFeedback({kind:"error",message:copy.error}))} type="button">{item.status===1?"Disable":"Enable"}</button><button disabled={item.status!==0} onClick={()=>void service.deleteOffer(item.id).then(reload).catch(()=>setFeedback({kind:"error",message:copy.error}))} type="button">{copy.remove}</button></>:"-"}</td></tr>}/></>;}

function MarketingStocks({service,language}:PageProps){const canManage=hasManagerPermission("commerce.marketing.manage");const copy=COPY[language];const[draft,setDraft]=useState<CouponStockRequest|null>(null);const[pending,setPending]=useState(false);const loader=useCallback((q:PromotionAdminListQuery)=>service.listCouponStocks(q),[service]);const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!draft)return;setPending(true);try{await service.createCouponStock(draft);setDraft(null);window.location.reload();}finally{setPending(false);}};return <>{draft?<FeedbackForm language={language} pending={pending} onCancel={()=>setDraft(null)} onSubmit={(e)=>void submit(e)}><label>Offer ID<input required value={draft.offerId} onChange={(e)=>setDraft({...draft,offerId:e.target.value})}/></label><label>{language==="zh-CN"?"库存数量":"Quantity"}<input required inputMode="numeric" value={draft.totalQuantity} onChange={(e)=>setDraft({...draft,totalQuantity:e.target.value})}/></label><label>{language==="zh-CN"?"每人限领":"Per-user limit"}<input required min={1} type="number" value={draft.perUserLimit} onChange={(e)=>setDraft({...draft,perUserLimit:Number(e.target.value)})}/></label><label>{language==="zh-CN"?"库存类型":"Stock type"}<select value={draft.stockType} onChange={(e)=>setDraft({...draft,stockType:e.target.value as "LIMITED"|"UNLIMITED"})}><option>LIMITED</option><option>UNLIMITED</option></select></label></FeedbackForm>:null}<OperationsTable columns={language==="zh-CN"?["库存批次","权益 ID","总量","可用","领取/核销"]:["Stock","Offer ID","Total","Available","Claimed / Redeemed"]} language={language} loader={loader} toolbar={canManage?<button onClick={()=>setDraft({offerId:"",stockType:"LIMITED",totalQuantity:"1000",perUserLimit:1,status:1})} type="button">{copy.create}</button>:null} renderRow={(item:CouponStock)=><tr key={item.id}><td><strong>{item.stockNo}</strong><small>{item.stockType}</small></td><td>{item.offerId}</td><td>{item.totalQuantity}</td><td>{item.availableQuantity}</td><td>{item.claimedQuantity} / {item.redeemedQuantity}</td></tr>}/></>;}

function MarketingCodeBatches({service,language}:PageProps){const canManage=hasManagerPermission("commerce.marketing.manage");const copy=COPY[language];const[draft,setDraft]=useState<PromotionCodeBatchRequest|null>(null);const[pending,setPending]=useState(false);const loader=useCallback((q:PromotionAdminListQuery)=>service.listCodeBatches(q),[service]);const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!draft)return;setPending(true);try{await service.createCodeBatch(draft);setDraft(null);window.location.reload();}finally{setPending(false);}};return <>{draft?<FeedbackForm language={language} pending={pending} onCancel={()=>setDraft(null)} onSubmit={(e)=>void submit(e)}><label>Stock ID<input required value={draft.stockId} onChange={(e)=>setDraft({...draft,stockId:e.target.value})}/></label><label>{language==="zh-CN"?"生成数量":"Quantity"}<input required value={draft.quantity} onChange={(e)=>setDraft({...draft,quantity:e.target.value})}/></label><label>{language==="zh-CN"?"券码前缀":"Prefix"}<input value={draft.codePrefix} onChange={(e)=>setDraft({...draft,codePrefix:e.target.value.toUpperCase()})}/></label><label>{language==="zh-CN"?"券码长度":"Length"}<input min={12} max={32} type="number" value={draft.codeLength} onChange={(e)=>setDraft({...draft,codeLength:Number(e.target.value)})}/></label></FeedbackForm>:null}<OperationsTable columns={language==="zh-CN"?["批次","库存 ID","数量","码制","状态"]:["Batch","Stock ID","Quantity","Code format","Status"]} language={language} loader={loader} toolbar={canManage?<button onClick={()=>setDraft({stockId:"",codeType:"SINGLE_USE",quantity:"100",codeLength:16,codePrefix:"CP",idempotencyKey:uuid()})} type="button">{copy.create}</button>:null} renderRow={(item:PromotionCodeBatch)=><tr key={item.id}><td><strong>{item.batchNo}</strong><small>{item.createdAt}</small></td><td>{item.stockId}</td><td>{item.generatedQuantity} / {item.requestedQuantity}</td><td>{item.codePrefix} / {item.codeLength}</td><td>{item.status}</td></tr>}/></>;}

function MarketingDistributions({service,language}:PageProps){const canManage=hasManagerPermission("commerce.marketing.manage");const copy=COPY[language];const[stockId,setStockId]=useState("");const[userIds,setUserIds]=useState("");const[show,setShow]=useState(false);const[pending,setPending]=useState(false);const loader=useCallback((q:PromotionAdminListQuery)=>service.listDistributionTasks(q),[service]);const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const input:PromotionDistributionRequest={stockId,ownerUserIds:userIds.split(/[\s,]+/).map((v)=>v.trim()).filter(Boolean),idempotencyKey:uuid()};setPending(true);try{await service.createDistributionTask(input);setShow(false);window.location.reload();}finally{setPending(false);}};return <>{show?<FeedbackForm language={language} pending={pending} onCancel={()=>setShow(false)} onSubmit={(e)=>void submit(e)}><label>Stock ID<input required value={stockId} onChange={(e)=>setStockId(e.target.value)}/></label><label>{language==="zh-CN"?"用户 ID（逗号或换行分隔）":"User IDs"}<textarea required rows={5} value={userIds} onChange={(e)=>setUserIds(e.target.value)}/></label></FeedbackForm>:null}<OperationsTable columns={language==="zh-CN"?["任务","库存 ID","请求数","成功/失败","状态"]:["Task","Stock ID","Requested","Succeeded / Failed","Status"]} language={language} loader={loader} toolbar={canManage?<button onClick={()=>setShow(true)} type="button">{language==="zh-CN"?"发放优惠券":"Issue coupons"}</button>:null} renderRow={(item:PromotionDistributionTask)=><tr key={item.id}><td><strong>{item.taskNo}</strong><small>{item.createdAt}</small></td><td>{item.stockId}</td><td>{item.requestedQuantity}</td><td>{item.succeededQuantity} / {item.failedQuantity}</td><td>{item.status}</td></tr>}/></>;}

function ReadOnlyTable<T>({service,language,kind}:{service:SdkworkPromotionBackendService;language:Language;kind:"claims"|"codes"|"ledger"|"applications"}){const loaders={claims:service.listUserCoupons.bind(service),codes:service.listCodes.bind(service),ledger:service.listCouponLedger.bind(service),applications:service.listDiscountApplications.bind(service)};const columns={claims:["Coupon","User","Stock","Status","Claimed"],codes:["Code","Stock","Claims","Status","Expires"],ledger:["Business","Stock","Direction","Delta","Balance","Created"],applications:["Application","Order","Offer","Discount","Status","Applied"]}[kind];return <OperationsTable<T> columns={columns} language={language} loader={loaders[kind] as (q:PromotionAdminListQuery)=>Promise<PromotionAdminPage<T>>} renderRow={(raw:T)=>{const item=raw as PromotionUserCoupon&PromotionCode&PromotionCouponLedgerEntry&DiscountApplication;if(kind==="claims")return <tr key={item.id}><td><strong>{item.couponNo}</strong><small>{item.couponCode}</small></td><td>{item.ownerUserId}</td><td>{item.stockId}</td><td>{item.status}</td><td>{item.claimedAt}</td></tr>;if(kind==="codes")return <tr key={item.id}><td><strong>{item.promotionCode}</strong><small>{item.codeNo}</small></td><td>{item.stockId}</td><td>{item.claimedQuantity} / {item.maxClaims}</td><td>{item.status}</td><td>{item.expiresAt||"-"}</td></tr>;if(kind==="ledger")return <tr key={item.id}><td><strong>{item.businessType}</strong><small>{item.businessNo}</small></td><td>{item.stockId}</td><td>{item.direction}</td><td>{item.quantityDelta}</td><td>{item.balanceAfter}</td><td>{item.createdAt}</td></tr>;return <tr key={item.id}><td>{item.applicationNo}</td><td>{item.orderNo||item.orderId}</td><td>{item.offerId}</td><td>{item.discountAmount} {item.currencyCode}</td><td>{item.status}</td><td>{item.appliedAt}</td></tr>;}}/>;}

export function createSdkworkManagerMarketingAdminContribution(locale: string): AdminModuleContribution {
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
  } as const satisfies Record<keyof typeof copy.routes, keyof typeof copy.navigationGroups>;
  const route = (key: keyof typeof copy.routes, Component: (props: PageProps) => ReactNode) => {
    const groupKey = groupKeys[key];
    return {
      Component: () => Component({ service, language }),
      description: copy.routes[key][1],
      id: `commerce.marketing.${key}`,
      label: copy.routes[key][0],
      navigationGroups: [{ id: groupKey, label: copy.navigationGroups[groupKey] }],
      path: `/admin/marketing/${key}`,
      requiredPermissions: ["commerce.marketing.read"],
    };
  };
  return {
    access: { permissionMode: "any", requiredPermissions: ["commerce.marketing.read", "commerce.marketing.manage"] },
    capability: "marketing-admin",
    commercial: { entitlementKey: "sdkwork.marketing.admin", releaseChannel: "stable", tier: "professional" },
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
      route("claims", (props) => <ReadOnlyTable<PromotionUserCoupon> {...props} kind="claims" />),
      route("codes", (props) => <ReadOnlyTable<PromotionCode> {...props} kind="codes" />),
      route("ledger", (props) => <ReadOnlyTable<PromotionCouponLedgerEntry> {...props} kind="ledger" />),
      route("applications", (props) => <ReadOnlyTable<DiscountApplication> {...props} kind="applications" />),
    ],
    surface: "backend-admin",
  };
}
