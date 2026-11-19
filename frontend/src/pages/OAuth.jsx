import { Check, ChevronDown, Copy, ExternalLink, Loader2, Rocket } from "lucide-react";
import { useState } from "react";
import Modal from "../components/Modal";
import api from "../api";
import { useI18n } from "../i18n";

export default function OAuth() {
  const { t, translateMessage } = useI18n();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [authUrl, setAuthUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [showCallbackInput, setShowCallbackInput] = useState(false);
  const [credsContent, setCredsContent] = useState("");
  const [message, setMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const startAuth = async () => {
    setLoading(true);
    setMessage(null);
    setAuthUrl("");
    setCredsContent("");

    try {
      const res = await api.post("/auth/start", {});
      setAuthUrl(res.data.auth_url);
      setMessage({ type: "info", text: t("oauth.authUrlSuccess", "已生成认证链接，请在新窗口完成 Google 授权") });
    } catch (err) {
      setMessage({
        type: "error",
        text: (err.response?.data?.detail ? translateMessage(err.response.data.detail) : null) || t("oauth.authFailed", "获取认证链接失败"),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async () => {
    setFetching(true);
    try {
      const res = await api.post("/auth/callback", {});
      setCredsContent(JSON.stringify(res.data.credentials, null, 2));
      setMessage({
        type: "success",
        text: t("oauth.authSuccess", "认证成功！凭证已保存：{email}", { email: res.data.email || t("oauth.unknownEmail", "未知邮箱") }),
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: (err.response?.data?.detail ? translateMessage(err.response.data.detail) : null) || t("oauth.authFailed", "获取凭证失败，请确认已完成授权"),
      });
    } finally {
      setFetching(false);
    }
  };

  const processCallbackUrl = async () => {
    if (!callbackUrl.trim()) {
      setMessage({ type: "error", text: t("oauth.callbackEmpty", "请粘贴完整的回调URL") });
      return;
    }
    setFetching(true);
    try {
      const res = await api.post("/auth/callback-url", {
        callback_url: callbackUrl.trim(),
      });
      setCredsContent(JSON.stringify(res.data.credentials, null, 2));
      setMessage({
        type: "success",
        text: t("oauth.authSuccess", "认证成功！凭证已保存：{email}", { email: res.data.email || t("oauth.unknownEmail", "未知邮箱") }),
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: (err.response?.data?.detail ? translateMessage(err.response.data.detail) : null) || t("oauth.authFailed", "从回调URL获取凭证失败"),
      });
    } finally {
      setFetching(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(authUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadCreds = () => {
    const blob = new Blob([credsContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "antigravity-credentials.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 说明卡片 */}
      <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 border border-orange-700/30 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-400">{t("oauth.bannerTitle", "Antigravity 认证模式")}</h3>
        </div>
        <p className="text-sm text-gray-400">
          {t("oauth.bannerDesc", "通过 Google OAuth 获取 Antigravity 凭证。授权成功后系统会自动获取 Project ID 和订阅等级，并保存凭证到数据库。")}
        </p>
      </div>

      {/* 消息提示弹窗 */}
      {message && (
        <Modal
          type={message.type}
          title={message.type === "success" ? t("common.success", "操作成功") : message.type === "error" ? t("common.error", "操作失败") : t("common.info", "提示")}
          onClose={() => setMessage(null)}
        >
          <span className="whitespace-pre-wrap break-all">{message.text}</span>
        </Modal>
      )}

      {/* 获取认证链接按钮 */}
      <button
        onClick={startAuth}
        disabled={loading}
        className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Rocket size={18} />
        )}
        {t("oauth.getAuthUrl", "获取 Antigravity 认证链接")}
      </button>

      {/* 认证链接 */}
      {authUrl && (
        <div className="card space-y-4">
          <h3 className="font-semibold">{t("oauth.authUrlTitle", "认证链接")}</h3>
          <div className="bg-dark-800 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between gap-3">
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 break-all text-sm flex items-center gap-1"
            >
              {t("oauth.clickToAuth", "点击此链接进行 Google 认证")} <ExternalLink size={14} />
            </a>
            <button
              onClick={copyUrl}
              className="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1 flex-shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("common.copied", "已复制") : t("common.copy", "复制")}
            </button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-gray-400">
            <p className="font-medium text-blue-400 mb-2">{t("oauth.instructionsTitle", "使用说明")}</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t("oauth.step1", "点击上方认证链接，在新窗口中完成 Google 账号授权")}</li>
              <li>{t("oauth.step2", "授权成功后会跳转到 localhost 显示成功页面")}</li>
              <li>{t("oauth.step3", "关闭 OAuth 窗口，返回本页面")}</li>
              <li>{t("oauth.step4", "点击下方\"获取凭证\"按钮完成流程")}</li>
            </ol>
          </div>

          {/* 快捷回调URL */}
          <div className="border border-dark-600 rounded-lg">
            <button
              onClick={() => setShowCallbackInput(!showCallbackInput)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-gray-200"
            >
              <span>{t("oauth.quickCallbackTitle", "🚀 无法回源？试试快捷方式（粘贴回调URL）")}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showCallbackInput ? "rotate-180" : ""}`}
              />
            </button>
            {showCallbackInput && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500">
                  {t("oauth.quickCallbackDesc", "适用场景：云服务器/VPS、Docker 容器、防火墙阻止回调端口等。完成 Google 授权后，复制浏览器地址栏的完整 URL 粘贴到下方。")}
                </p>
                <textarea
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder={t("oauth.pasteCallbackPlaceholder", "http://localhost:11451/?state=xxx&code=xxx&scope=xxx...")}
                  className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-500"
                  rows={3}
                />
                <button
                  onClick={processCallbackUrl}
                  disabled={fetching}
                  className="btn btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {fetching && <Loader2 className="animate-spin" size={14} />}
                  {t("oauth.fetchFromCallback", "从回调URL获取凭证")}
                </button>
              </div>
            )}
          </div>

          {/* 获取凭证按钮 */}
          <button
            onClick={fetchCredentials}
            disabled={fetching}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {fetching && <Loader2 className="animate-spin" size={18} />}
            {t("oauth.fetchCreds", "获取 Antigravity 凭证")}
          </button>
        </div>
      )}

      {/* 凭证内容 */}
      {credsContent && (
        <div className="card space-y-4">
          <h3 className="font-semibold">{t("oauth.credsContent", "凭证内容")}</h3>
          <pre className="bg-dark-800 border border-dark-600 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
            {credsContent}
          </pre>
          <button onClick={downloadCreds} className="btn btn-secondary text-sm">
            {t("oauth.downloadCreds", "下载凭证文件")}
          </button>
        </div>
      )}
    </div>
  );
}
