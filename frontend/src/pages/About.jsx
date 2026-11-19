import { ExternalLink, Github, Info, RefreshCw, Rocket, Zap } from "lucide-react";
import { getBasePath } from "../basePath.js";
import { useI18n } from "../i18n";

export default function About({ version, onCheckUpdate, checkingUpdate }) {
  const { t } = useI18n();
  const apiBase = `${window.location.origin}${getBasePath()}`;
  const apiEndpoints = [
    { label: t("about.openaiFormat", "OpenAI 格式"), value: `${apiBase}v1/chat/completions` },
    { label: t("about.geminiFormat", "Gemini 格式"), value: `${apiBase}v1beta/models` },
    { label: t("about.claudeFormat", "Claude 格式"), value: `${apiBase}v1/messages` },
  ];

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* API 端点 */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          {t("about.apiEndpoints", "API 端点（点击复制）")}
        </h3>
        <div className="space-y-2">
          {apiEndpoints.map((ep) => (
            <div key={ep.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
              <span className="text-gray-500 sm:w-28 flex-shrink-0">{ep.label}</span>
              <code
                className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-xs text-gray-300 cursor-pointer hover:text-white break-all"
                onClick={() => copyText(ep.value)}
              >
                {ep.value}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* 项目简介 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-600/20">
            <Rocket className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AGY2API</h2>
            <p className="text-gray-400 text-sm">
              {version?.version ? t("about.version", `版本: ${version.version}`, { ver: version.version }) : t("login.subtitle", "Antigravity API 代理服务")}
            </p>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {t("about.desc", "将 Google Antigravity API 转换为 OpenAI、Gemini 和 Anthropic 兼容格式的代理工具。支持多账户管理（邮箱去重）、自动轮换、模型级冷却、凭证导入导出等功能。")}
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <a
            href="https://github.com/su-kaka/agy2api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1.5"
          >
            <Github size={15} />
            {t("about.githubRepo", "GitHub 仓库")}
            <ExternalLink size={12} />
          </a>
          <button
            onClick={onCheckUpdate}
            disabled={checkingUpdate}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {checkingUpdate ? (
              <Info size={14} className="animate-pulse" />
            ) : (
              <RefreshCw size={14} />
            )}
            {checkingUpdate ? t("about.checking", "检查中...") : t("about.checkUpdate", "检查更新")}
          </button>
          {version?.check_update && version?.has_update && (
            <span className="text-emerald-400 text-sm flex items-center gap-1.5">
              <Info size={14} />
              {t("about.hasUpdate", `有新版本可用: ${version.latest_version}`, { ver: version.latest_version })}
            </span>
          )}
          {version?.check_update && version?.has_update === false && (
            <span className="text-gray-400 text-sm flex items-center gap-1.5">
              <Info size={14} />
              {t("about.latestVersion", "已是最新版本")}
            </span>
          )}
        </div>
      </div>

      {/* 主要功能 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">{t("about.featuresTitle", "✨ 主要功能")}</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="text-gray-300">
              <span className="text-amber-400">⚡</span>{" "}
              <strong>{t("about.multiFormat", "多格式兼容")}：</strong>{t("about.multiFormatDesc", "OpenAI / Gemini / Anthropic 三种 API 格式")}
            </div>
            <div className="text-gray-300">
              <span className="text-cyan-400">🔄</span>{" "}
              <strong>{t("about.autoRotate", "自动轮换")}：</strong>{t("about.autoRotateDesc", "随机负载均衡，自动跳过冷却和禁用的凭证")}
            </div>
            <div className="text-gray-300">
              <span className="text-emerald-400">🛡️</span>{" "}
              <strong>{t("about.autoBan", "自动封禁")}：</strong>{t("about.autoBanDesc", "遇到指定错误码自动禁用异常凭证")}
            </div>
            <div className="text-gray-300">
              <span className="text-purple-400">❄️</span>{" "}
              <strong>{t("about.modelCooldown", "模型级冷却")}：</strong>{t("about.modelCooldownDesc", "429 错误自动设置模型级 CD")}
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-gray-300">
              <span className="text-red-400">✂️</span>{" "}
              <strong>{t("about.antiTruncation", "抗截断")}：</strong>{t("about.antiTruncationDesc", "\"抗截断-\" 前缀模型自动续传截断的响应")}
            </div>
            <div className="text-gray-300">
              <span className="text-emerald-400">📊</span>{" "}
              <strong>{t("about.realtimeMonitor", "实时监控")}：</strong>{t("about.realtimeMonitorDesc", "凭证状态、错误码、额度查询")}
            </div>
            <div className="text-gray-300">
              <span className="text-gray-400">📱</span>{" "}
              <strong>{t("about.responsiveUI", "响应式界面")}：</strong>{t("about.responsiveUIDesc", "桌面/移动端自适应")}
            </div>
          </div>
        </div>
      </div>

      {/* 交流群 */}
      <div className="card text-center">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">{t("about.communityGroup", "💬 交流群")}</h3>
        <p className="text-gray-400 text-sm mb-3">{t("about.communityDesc", "欢迎加入 QQ 群交流讨论！")}</p>
        <div className="inline-block bg-white rounded-xl p-3">
          <img
            src={`${getBasePath()}docs/qq-group.jpg`}
            alt="QQ Group"
            className="w-40 h-40 rounded-lg"
          />
        </div>
        <p className="text-blue-400 font-semibold mt-3">{t("about.communityNumber", "QQ 群号：1083250744")}</p>
      </div>

      {/* 使用声明 */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
        <div className="text-amber-400 font-medium mb-2">{t("about.disclaimerTitle", "⚠️ 使用声明")}</div>
        <p className="text-sm text-amber-400/80">
          {t("about.disclaimerDesc", "本项目仅供学习研究使用，禁止商业用途和倒卖。")}
        </p>
      </div>

      {/* 版本信息 */}
      {version && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-300 mb-3">{t("about.versionInfoTitle", "版本信息")}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-500">
              {t("about.currentVersion", "当前版本")}: <span className="text-gray-300">{version.version || "-"}</span>
            </div>
            <div className="text-gray-500">
              {t("about.buildHash", "构建哈希")}: <span className="text-gray-300">{version.full_hash || "-"}</span>
            </div>
            <div className="text-gray-500">
              {t("about.updateNotes", "更新说明")}: <span className="text-gray-300">{version.message || "-"}</span>
            </div>
            <div className="text-gray-500">
              {t("about.buildDate", "构建日期")}: <span className="text-gray-300">{version.date || "-"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
