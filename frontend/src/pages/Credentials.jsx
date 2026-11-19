import {
  AlertCircle,
  Ban,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Download,
  Loader2,
  RefreshCw,
  Shield,
  Snowflake,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal";
import Select from "../components/Select";
import api from "../api";
import { useI18n } from "../i18n";

export default function Credentials() {
  const { t, lang, translateMessage } = useI18n();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, normal: 0, disabled: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("all");
  const [errorCodeFilter, setErrorCodeFilter] = useState("all");
  const [cooldownFilter, setCooldownFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [busyFiles, setBusyFiles] = useState(new Set());
  const [now, setNow] = useState(Date.now() / 1000);
  // 额度预览相关状态
  const [quotaModal, setQuotaModal] = useState(null); // { email } 额度弹窗
  const [quotaCache, setQuotaCache] = useState({}); // 缓存额度数据 { email: { claude, gemini } | { error } }
  // 支持模型弹窗状态
  const [modelsModal, setModelsModal] = useState(null); // { email, models: [] }

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchCreds = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      const res = await api.get("/creds/status", {
        params: {
          offset,
          limit: pageSize,
          status_filter: statusFilter,
          error_code_filter: errorCodeFilter,
          cooldown_filter: cooldownFilter,
          tier_filter: tierFilter,
        },
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setStats(res.data.stats || { total: 0, normal: 0, disabled: 0 });
      setSelected(new Set());
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.loadFailed", "加载凭证失败"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, errorCodeFilter, cooldownFilter, tierFilter, t]);

  useEffect(() => {
    fetchCreds();
  }, [fetchCreds]);

  const showMessage = useCallback((type, text, title) => {
    setMessage({
      type,
      text: typeof text === "string" ? translateMessage(text) : text,
      title: title
        ? (typeof title === "string" ? translateMessage(title) : title)
        : (type === "success" ? t("common.success", "操作成功") : type === "error" ? t("common.error", "操作失败") : t("common.info", "提示")),
    });
  }, [t, translateMessage]);

  const setBusy = (email, busy) => {
    setBusyFiles((prev) => {
      const next = new Set(prev);
      if (busy) next.add(email);
      else next.delete(email);
      return next;
    });
  };

  const doAction = async (email, action) => {
    setBusy(email, true);
    try {
      const res = await api.post("/creds/action", { email, action });
      const actionText =
        action === "enable"
          ? t("credentials.actionEnabled", "已启用凭证 {email}", { email })
          : action === "disable"
          ? t("credentials.actionDisabled", "已禁用凭证 {email}", { email })
          : action === "delete"
          ? t("credentials.actionDeleted", "已删除凭证 {email}", { email })
          : translateMessage(res.data.message);
      showMessage("success", actionText);
      fetchCreds();
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.actionFailed", "操作失败"));
    } finally {
      setBusy(email, false);
    }
  };

  const doBatchAction = async (action) => {
    if (selected.size === 0) return;
    setBusy("__batch__", true);
    try {
      const res = await api.post("/creds/batch-action", {
        action,
        emails: Array.from(selected),
      });
      let msg = translateMessage(res.data.message);
      if (res.data.errors?.length) {
        const translatedErrors = res.data.errors.map((e) => translateMessage(String(e))).join("\n");
        msg = `${msg}\n\n${translatedErrors}`;
      }
      showMessage(res.data.errors?.length ? "error" : "success", msg);
      fetchCreds();
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.batchActionFailed", "批量操作失败"));
    } finally {
      setBusy("__batch__", false);
    }
  };

  const verifyProject = async (email) => {
    setBusy(email, true);
    try {
      const res = await api.post(`/creds/verify-project/${encodeURIComponent(email)}`);
      if (res.data.success) {
        const modelCount = Array.isArray(res.data.supported_models)
          ? res.data.supported_models.length
          : 0;
        showMessage(
          "success",
          `Project=${res.data.project_id}, Tier=${res.data.subscription_tier}, ${t("credentials.modelCountLabel", "模型数")}=${modelCount}`,
          `${t("credentials.verifySuccess", "检验成功")}: ${email}`
        );
      } else {
        showMessage("error", res.data.message || res.data.error || t("credentials.verifyFailed", "检验失败"), `${t("credentials.verifyFailed", "检验失败")}: ${email}`);
      }
      fetchCreds();
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || t("credentials.verifyFailed", "检验失败"),
        `${t("credentials.verifyFailed", "检验失败")}: ${email}`
      );
    } finally {
      setBusy(email, false);
    }
  };

  const refreshCredentialModels = async (email) => {
    setBusy(email, true);
    try {
      const res = await api.post(`/creds/refresh-models/${encodeURIComponent(email)}`);
      if (res.data.success) {
        const newModels = res.data.supported_models || [];
        setModelsModal((prev) =>
          prev && prev.email === email ? { ...prev, models: newModels } : prev
        );
        fetchCreds();
      }
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.detail || t("credentials.refreshFailed", "刷新模型列表失败"),
        `${t("credentials.refreshFailed", "刷新失败")}: ${email}`
      );
    } finally {
      setBusy(email, false);
    }
  };

  const testCredential = async (email) => {
    setBusy(email, true);
    try {
      const res = await api.post(`/creds/test/${encodeURIComponent(email)}`);
      // 200 = 可用；429 = 限流但有效
      const testMsg = res.status === 429
        ? t("credentials.rateLimitedButValid", "凭证被限流（429）但有效")
        : t("credentials.testPassed", "凭证测试通过");
      showMessage(
        "success",
        testMsg,
        `${t("credentials.testSuccess", "测试成功")}: ${email}`
      );
      fetchCreds();
    } catch (err) {
      const data = err.response?.data || {};
      const status = err.response?.status;
      // 透明透传上游错误：优先后端返回的 error 原文
      const upstreamError = data.error || data.detail || data.message || t("credentials.testFailed", "测试失败");
      showMessage(
        status === 429 ? "info" : "error",
        `HTTP ${status}\n${typeof upstreamError === "string" ? translateMessage(upstreamError) : JSON.stringify(upstreamError)}`,
        `${t("credentials.testFailed", "测试失败")}: ${email}`
      );
      fetchCreds();
    } finally {
      setBusy(email, false);
    }
  };

  // 额度弹窗：打开并强制刷新（不使用旧缓存）
  const openQuotaModal = async (email) => {
    setQuotaModal({ email });
    setBusy(email, true);
    try {
      const res = await api.get(`/creds/quota/${encodeURIComponent(email)}`);
      if (res.data.success) {
        const aggregated = aggregateQuota(res.data.quotaGroups || []);
        setQuotaCache((prev) => ({ ...prev, [email]: aggregated }));
      } else {
        setQuotaCache((prev) => ({ ...prev, [email]: { error: res.data.error || t("credentials.fetchQuotaFailed", "获取额度失败") } }));
      }
    } catch (err) {
      setQuotaCache((prev) => ({
        ...prev,
        [email]: { error: err.response?.data?.detail || err.response?.data?.error || t("credentials.fetchQuotaFailed", "获取额度失败") },
      }));
    } finally {
      setBusy(email, false);
    }
  };

  // 聚合额度分组 -> Claude / Gemini 各自的剩余百分比（多组取平均，组内取 weekly/5h 较小值）
  const aggregateQuota = (groups) => {
    const result = {
      claude: { remaining: 0, count: 0, resetTime: "" },
      gemini: { remaining: 0, count: 0, resetTime: "" },
    };

    groups.forEach((group) => {
      const name = (group.displayName || "").toLowerCase();
      const target = name.includes("claude") ? result.claude : result.gemini;
      target.count += 1;

      // 每组取 weekly / 5h 中较小的 remainingFraction（短板效应）
      let minPct = null;
      let minResetTime = "";
      (group.buckets || []).forEach((bucket) => {
        const pct = (bucket.remainingFraction || 0) * 100;
        if (minPct === null || pct < minPct) {
          minPct = pct;
          minResetTime = bucket.resetTime || "";
        }
      });

      if (minPct !== null) {
        target.remaining += Math.round(minPct * 10) / 10;
        if (!target.resetTime && minResetTime) {
          try {
            target.resetTime = new Date(minResetTime).toLocaleString(lang === "zh" ? "zh-CN" : "en-US");
          } catch {
            target.resetTime = minResetTime;
          }
        }
      }
    });

    // 多组时取平均值
    if (result.claude.count > 1)
      result.claude.remaining = Math.round(result.claude.remaining / result.claude.count);
    if (result.gemini.count > 1)
      result.gemini.remaining = Math.round(result.gemini.remaining / result.gemini.count);

    return result;
  };

  // 额度进度条颜色
  const getQuotaColor = (remaining) => {
    if (remaining >= 80) return { bar: "bg-green-500", text: "text-green-400" };
    if (remaining >= 40) return { bar: "bg-yellow-500", text: "text-yellow-400" };
    if (remaining >= 20) return { bar: "bg-orange-500", text: "text-orange-400" };
    return { bar: "bg-red-500", text: "text-red-400" };
  };

  const exportCredential = async (email) => {
    try {
      const res = await api.get(`/creds/export/${encodeURIComponent(email)}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${email}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage("success", t("credentials.exportedSuccess", `已导出 ${email}.json`, { email }));
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.exportFailed", "导出失败"));
    }
  };

  const downloadAll = async () => {
    setBusy("__batch__", true);
    try {
      const res = await api.get("/creds/download-all", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "antigravity_credentials.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.downloadFailed", "下载失败"));
    } finally {
      setBusy("__batch__", false);
    }
  };

  const openErrors = async (email) => {
    try {
      const res = await api.get(`/creds/errors/${encodeURIComponent(email)}`);
      setErrorModal(res.data);
    } catch (err) {
      showMessage("error", err.response?.data?.detail || t("credentials.fetchErrorsFailed", "获取错误信息失败"));
    }
  };

  const toggleSelect = (email) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.email)));
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatTime = (ts) => {
    if (!ts) return "-";
    return new Date(ts * 1000).toLocaleString();
  };

  const getCooldownText = (cooldowns) => {
    const active = Object.entries(cooldowns || {}).filter(
      ([, until]) => until > now
    );
    if (!active.length) return null;
    const longest = Math.max(...active.map(([, until]) => until));
    const remain = longest - now;
    const h = Math.floor(remain / 3600);
    const m = Math.floor((remain % 3600) / 60);
    const s = Math.floor(remain % 60);
    return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}m${s}s` : `${s}s`;
  };

  const tierStyle = (tier) =>
    tier === "ultra"
      ? "bg-red-500/10 text-red-400 border-red-500/30"
      : tier === "pro"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
      : "bg-blue-500/10 text-blue-400 border-blue-500/30";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 消息弹窗 */}
      {message && (
        <Modal
          type={message.type}
          title={message.title}
          onClose={() => setMessage(null)}
        >
          <span className="whitespace-pre-wrap">{message.text}</span>
        </Modal>
      )}

      {/* 状态统计 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t("credentials.statTotal", "总计")}</div>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.normal}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t("credentials.statNormal", "正常")}</div>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.disabled}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t("credentials.statDisabled", "禁用")}</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={fetchCreds}
          disabled={loading}
          className="btn btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {t("credentials.refreshStatus", "刷新状态")}
        </button>
        <button
          onClick={downloadAll}
          disabled={busyFiles.has("__batch__")}
          className="btn btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5"
        >
          <Download size={15} />
          {t("credentials.exportPackage", "打包导出")}
        </button>
      </div>

      {/* 筛选器 */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 text-sm">
        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className="w-full sm:w-32"
          options={[
            { value: "all", label: t("credentials.filterAllCreds", "全部凭证") },
            { value: "enabled", label: t("credentials.filterEnabledOnly", "仅启用") },
            { value: "disabled", label: t("credentials.filterDisabledOnly", "仅禁用") },
          ]}
        />
        <Select
          value={errorCodeFilter}
          onChange={(v) => {
            setErrorCodeFilter(v);
            setPage(1);
          }}
          className="w-full sm:w-32"
          options={[
            { value: "all", label: t("credentials.filterErrorAll", "错误码: 全部") },
            { value: "none", label: t("credentials.filterErrorNone", "无错误") },
            { value: "400", label: "400" },
            { value: "403", label: "403" },
            { value: "429", label: "429" },
            { value: "500", label: "500" },
          ]}
        />
        <Select
          value={cooldownFilter}
          onChange={(v) => {
            setCooldownFilter(v);
            setPage(1);
          }}
          className="w-full sm:w-32"
          options={[
            { value: "all", label: t("credentials.filterCooldownAll", "冷却: 全部") },
            { value: "in_cooldown", label: t("credentials.filterInCooldown", "CD中") },
            { value: "no_cooldown", label: t("credentials.filterNoCooldown", "未CD") },
          ]}
        />
        <Select
          value={tierFilter}
          onChange={(v) => {
            setTierFilter(v);
            setPage(1);
          }}
          className="w-full sm:w-32"
          options={[
            { value: "all", label: t("credentials.filterTierAll", "Tier: 全部") },
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
            { value: "ultra", label: "Ultra" },
          ]}
        />
        <Select
          value={pageSize}
          onChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
          className="w-full sm:w-32"
          options={[20, 50, 100, 200, 500, 1000].map((n) => ({
            value: n,
            label: t("credentials.perPage", `每页 ${n}`, { n }),
          }))}
        />
      </div>

      {/* 批量操作 */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleSelectAll}
              className="accent-purple-600 w-4 h-4"
            />
            {t("credentials.selectAll", "全选")}
          </label>
          <span className="text-gray-500 text-xs">{t("credentials.selectedCount", `已选 ${selected.size} 项`, { count: selected.size })}</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => doBatchAction("enable")}
              disabled={selected.size === 0 || busyFiles.has("__batch__")}
              className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("credentials.batchEnable", "批量启用")}
            </button>
            <button
              onClick={() => doBatchAction("disable")}
              disabled={selected.size === 0 || busyFiles.has("__batch__")}
              className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("credentials.batchDisable", "批量禁用")}
            </button>
            <button
              onClick={() => doBatchAction("refresh_models")}
              disabled={selected.size === 0 || busyFiles.has("__batch__")}
              className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("credentials.batchRefreshModels", "批量刷新模型")}
            </button>
            <button
              onClick={() => doBatchAction("delete")}
              disabled={selected.size === 0 || busyFiles.has("__batch__")}
              className="btn btn-danger text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("credentials.batchDelete", "批量删除")}
            </button>
          </div>
        </div>
      </div>

      {/* 凭证卡片列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-purple-500" size={28} />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 text-sm">
          {t("credentials.emptyCreds", "没有凭证。请先通过 OAuth 认证或批量导入添加凭证。")}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {items.map((cred) => {
            const cooldownText = getCooldownText(cred.model_cooldowns);
            const busy = busyFiles.has(cred.email);
            return (
              <div
                key={cred.email}
                className={`card p-3 sm:p-4 space-y-3 transition-colors ${
                  cred.disabled ? "border-red-500/30" : ""
                }`}
              >
                {/* 头部：选择框 + 邮箱 + 状态标签 */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(cred.email)}
                    onChange={() => toggleSelect(cred.email)}
                    className="accent-purple-600 w-4 h-4 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-sm font-medium text-white break-all leading-snug">
                      {cred.email}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${tierStyle(cred.tier)}`}
                      >
                        {cred.tier || "pro"}
                      </span>
                      {cred.disabled ? (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <Ban size={12} /> {t("common.disabled", "禁用")}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                          <CheckCircle size={12} /> {t("common.enabled", "启用")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 信息区 */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    {cooldownText ? (
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Snowflake size={12} /> CD {cooldownText}
                      </span>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Clock size={12} /> {t("credentials.filterNoCooldown", "无CD")}
                      </span>
                    )}
                    {cred.error_codes?.length ? (
                      <button
                        onClick={() => openErrors(cred.email)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <AlertCircle size={12} />
                        {cred.error_codes.join(",")}
                      </button>
                    ) : (
                      <span className="text-gray-600 flex items-center gap-1">
                        <CheckCircle size={12} /> {t("credentials.filterErrorNone", "无错误")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-gray-500">
                    <div className="flex items-center gap-1 min-w-0">
                      <Clock size={12} className="flex-shrink-0" />
                      <span className="truncate" title={formatTime(cred.last_success)}>
                        {formatTime(cred.last_success)}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setModelsModal({
                          email: cred.email,
                          models: cred.supported_models || [],
                        })
                      }
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 flex-shrink-0"
                      title={t("credentials.titleModels", "点击查看或刷新该凭证支持的模型列表")}
                    >
                      <Cpu size={12} />
                      {cred.supported_models?.length
                        ? t("credentials.modelCount", `模型 ${cred.supported_models.length}`, { count: cred.supported_models.length })
                        : t("credentials.modelsUndetected", "模型未检测")}
                    </button>
                  </div>
                </div>

                {/* 操作按钮（2×3 网格铺满卡片） */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-dark-700">
                  {busy ? (
                    <div className="col-span-3 flex items-center justify-center py-1.5">
                      <Loader2 size={16} className="animate-spin text-purple-400" />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => verifyProject(cred.email)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 flex items-center justify-center gap-1"
                        title={t("credentials.titleVerify", "检验 Project ID / Tier（可修复 403）")}
                      >
                        <Shield size={13} /> {t("credentials.btnVerify", "检验")}
                      </button>
                      <button
                        onClick={() => testCredential(cred.email)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 flex items-center justify-center gap-1"
                        title={t("credentials.titleTest", "测试凭证")}
                      >
                        <Zap size={13} /> {t("credentials.btnTest", "测试")}
                      </button>
                      <button
                        onClick={() => openQuotaModal(cred.email)}
                        disabled={cred.disabled}
                        className="text-xs px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 flex items-center justify-center gap-1 disabled:opacity-40"
                        title={t("credentials.titleQuota", "查看额度")}
                      >
                        <BarChart3 size={13} /> {t("credentials.colQuota", "额度")}
                      </button>
                      <button
                        onClick={() => exportCredential(cred.email)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 flex items-center justify-center gap-1"
                        title={t("credentials.titleExport", "导出凭证（邮箱.json）")}
                      >
                        <Download size={13} /> {t("common.export", "导出")}
                      </button>
                      <button
                        onClick={() =>
                          doAction(cred.email, cred.disabled ? "enable" : "disable")
                        }
                        className={`text-xs px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                          cred.disabled
                            ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400"
                            : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400"
                        }`}
                      >
                        {cred.disabled ? <CheckCircle size={13} /> : <Ban size={13} />}
                        {cred.disabled ? t("common.enabled", "启用") : t("common.disabled", "禁用")}
                      </button>
                      <button
                        onClick={() => doAction(cred.email, "delete")}
                        className="text-xs px-2 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 flex items-center justify-center gap-1"
                        title={t("common.delete", "删除")}
                      >
                        <Trash2 size={13} /> {t("common.delete", "删除")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs sm:text-sm">
            {t("credentials.paginationTotal", `共 ${total} 个凭证，第 ${page}/${totalPages} 页`, { total, page, totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("common.prev", "上一页")}
            </button>
            <span className="text-gray-400 text-xs sm:text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
            >
              {t("common.next", "下一页")}
            </button>
          </div>
        </div>
      )}


      {/* 支持模型列表弹窗 */}
      {modelsModal && (
        <Modal
          type="info"
          title={`${t("credentials.modelsModalTitle", "支持模型列表：{email}", { email: modelsModal.email })}`}
          onClose={() => setModelsModal(null)}
        >
          <div className="space-y-3">
            {busyFiles.has(modelsModal.email) ? (
              <div className="flex items-center justify-center py-6 text-gray-500">
                <RefreshCw size={16} className="animate-spin mr-2" />
                {t("credentials.fetchingModels", "正在获取模型列表...")}
              </div>
            ) : modelsModal.models?.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">
                  {t("credentials.supportedModelsCount", `共支持 ${modelsModal.models.length} 个模型：`, { count: modelsModal.models.length })}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto p-2 bg-dark-900/60 border border-dark-700 rounded-lg">
                  {modelsModal.models.map((m) => (
                    <span
                      key={m}
                      className="text-xs px-2 py-0.5 rounded bg-dark-700 text-gray-200 border border-dark-600 font-mono"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                {t("credentials.noRecordedModels", "尚未记录该凭证的模型列表，请点击下方按钮检测。")}
              </div>
            )}
            <button
              onClick={() => refreshCredentialModels(modelsModal.email)}
              disabled={busyFiles.has(modelsModal.email)}
              className="w-full text-xs text-gray-300 hover:text-white py-2 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                className={busyFiles.has(modelsModal.email) ? "animate-spin" : ""}
              />
              {t("credentials.refreshModelList", "刷新模型列表")}
            </button>
          </div>
        </Modal>
      )}

      {/* 额度弹窗 */}
      {quotaModal && (
        <Modal
          type="info"
          title={t("credentials.quotaModalTitle", `额度信息 - ${quotaModal.email}`, { email: quotaModal.email })}
          onClose={() => setQuotaModal(null)}
        >
          {busyFiles.has(quotaModal.email) ? (
            <div className="flex items-center justify-center py-6 text-gray-500">
              <RefreshCw size={16} className="animate-spin mr-2" />
              {t("credentials.loadingQuota", "加载额度中...")}
            </div>
          ) : quotaCache[quotaModal.email]?.error ? (
            <div className="text-center py-4 text-red-400">{quotaCache[quotaModal.email].error}</div>
          ) : quotaCache[quotaModal.email] ? (
            <div className="space-y-3">
              {quotaCache[quotaModal.email].claude?.count > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-purple-400 text-sm">Claude</span>
                    <span className={`text-sm font-medium ${getQuotaColor(quotaCache[quotaModal.email].claude.remaining).text}`}>
                      {quotaCache[quotaModal.email].claude.remaining.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-dark-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getQuotaColor(quotaCache[quotaModal.email].claude.remaining).bar}`}
                      style={{ width: `${Math.min(quotaCache[quotaModal.email].claude.remaining, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {quotaCache[quotaModal.email].gemini?.count > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-cyan-400 text-sm">Gemini</span>
                    <span className={`text-sm font-medium ${getQuotaColor(quotaCache[quotaModal.email].gemini.remaining).text}`}>
                      {quotaCache[quotaModal.email].gemini.remaining.toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-dark-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getQuotaColor(quotaCache[quotaModal.email].gemini.remaining).bar}`}
                      style={{ width: `${Math.min(quotaCache[quotaModal.email].gemini.remaining, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {!quotaCache[quotaModal.email].claude?.count &&
                !quotaCache[quotaModal.email].gemini?.count && (
                  <div className="text-center py-3 text-gray-500">{t("credentials.noQuotaData", "暂无额度数据")}</div>
                )}
              {(quotaCache[quotaModal.email].claude?.resetTime ||
                quotaCache[quotaModal.email].gemini?.resetTime) && (
                <div className="text-xs text-gray-500 text-right pt-1">
                  {t("credentials.quotaReset", "重置: ")}{" "}
                  {quotaCache[quotaModal.email].claude?.resetTime ||
                    quotaCache[quotaModal.email].gemini?.resetTime}
                </div>
              )}
              <button
                onClick={() => openQuotaModal(quotaModal.email)}
                disabled={busyFiles.has(quotaModal.email)}
                className="w-full text-xs text-gray-400 hover:text-white py-2 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={12} className={busyFiles.has(quotaModal.email) ? "animate-spin" : ""} />
                {t("credentials.refreshQuota", "刷新额度")}
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">{t("common.loading", "加载中...")}</div>
          )}
        </Modal>
      )}

      {/* 错误详情弹窗 */}
      {errorModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setErrorModal(null)}
        >
          <div
            className="bg-dark-900 border border-dark-600 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-dark-700">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base break-all">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                {t("credentials.errorModalTitle", `错误详情 - ${errorModal.email}`, { email: errorModal.email })}
              </h3>
              <button
                onClick={() => setErrorModal(null)}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">{t("credentials.errorCode", "错误码")}</div>
                <div className="text-red-400 text-sm">
                  {(errorModal.error_codes || []).join(", ") || t("common.none", "无")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">{t("credentials.errorMessage", "错误信息")}</div>
                <pre className="bg-dark-800 border border-dark-600 rounded-lg p-3 sm:p-4 text-xs text-gray-300 overflow-auto max-h-56 whitespace-pre-wrap">
                  {JSON.stringify(errorModal.error_messages, null, 2)}
                </pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    verifyProject(errorModal.email);
                    setErrorModal(null);
                  }}
                  className="btn btn-primary text-sm"
                >
                  {t("credentials.btnVerifyRepair", "检验修复（重新获取Project ID）")}
                </button>
                <button
                  onClick={() => {
                    testCredential(errorModal.email);
                    setErrorModal(null);
                  }}
                  className="btn btn-secondary text-sm"
                >
                  {t("credentials.btnTestCred", "测试凭证")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
