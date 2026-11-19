import { createContext, useContext, useEffect, useState } from "react";
import { Globe } from "lucide-react";
import en from "./locales/en";
import zh from "./locales/zh";

const translations = { zh, en };

const I18nContext = createContext(null);

function getNested(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem("agy_lang") || "zh";
  });

  const setLang = (nextLang) => {
    const l = nextLang === "en" ? "en" : "zh";
    setLangState(l);
    localStorage.setItem("agy_lang", l);
  };

  const t = (key, fallback, vars) => {
    if (typeof fallback === "object" && fallback !== null && vars === undefined) {
      vars = fallback;
      fallback = undefined;
    }
    let text = getNested(translations[lang], key);
    if (text === undefined) {
      text = getNested(translations.zh, key);
    }
    if (text === undefined) {
      text = fallback !== undefined ? fallback : key;
    }
    if (vars && typeof text === "string") {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return text;
  };

  const translateMessage = (msg) => {
    if (!msg || typeof msg !== "string") return msg;
    const str = msg.trim();

    const exact = {
      "操作成功": t("common.success", "操作成功"),
      "操作失败": t("common.error", "操作失败"),
      "批量操作失败": t("credentials.batchActionFailed", "批量操作失败"),
      "清理成功": t("common.success", "清理成功"),
      "清理失败": t("common.error", "清理失败"),
      "清空失败": t("common.error", "清空失败"),
      "删除失败": t("common.deleteFailed", "删除失败"),
      "配置保存成功": t("config.saved", "配置保存成功"),
      "保存配置失败": t("config.saveFailed", "保存配置失败"),
      "加载配置失败": t("config.loadFailed", "加载配置失败"),
      "测试成功": t("credentials.testPassed", "凭证测试通过"),
      "凭证测试通过": t("credentials.testPassed", "凭证测试通过"),
      "凭证被限流（429）但有效": t("credentials.rateLimitedButValid", "凭证被限流（429）但有效"),
      "测试失败": t("credentials.testFailed", "测试失败"),
      "检验成功": t("credentials.verifySuccess", "检验成功"),
      "检验失败": t("credentials.verifyFailed", "检验失败"),
      "检验成功！已解除禁用状态、清除错误码并同步模型列表": t("credentials.verifySuccessDetailed", "检验成功！已解除禁用状态、清除错误码并同步模型列表"),
      "刷新模型列表失败": t("credentials.refreshFailed", "刷新模型列表失败"),
      "已清理全部日志": t("usageLogs.clearedAllSuccess", "已清理全部日志"),
      "已清空全部日志": t("usageLogs.truncatedSuccess", "已清空全部日志"),
      "已清空全部日志（表已重建）": t("usageLogs.truncatedSuccess", "已清空全部日志（表已重建）"),
      "登录成功": t("login.success", "登录成功"),
      "认证成功，凭证已保存": t("oauth.authSaved", "认证成功，凭证已保存"),
      "从回调URL认证成功，凭证已保存": t("oauth.authSavedCallback", "从回调URL认证成功，凭证已保存"),
      "导入成功": t("upload.importSuccess", "导入成功"),
      "缺少 refresh_token": t("upload.missingRefreshToken", "缺少 refresh_token"),
      "无法获取邮箱（JSON 中未提供且自动获取失败）": t("upload.failedEmailFetch", "无法获取邮箱（JSON 中未提供且自动获取失败）"),
      "JSON格式错误: 顶层必须是对象": t("upload.jsonNotObject", "JSON格式错误: 顶层必须是对象"),
      "凭证列表不能为空": t("credentials.emptyCredsList", "凭证列表不能为空"),
      "凭证不存在": t("credentials.credNotFound", "凭证不存在"),
      "无效的操作类型": t("common.invalidAction", "无效的操作类型"),
      "该配置已被环境变量锁定，修改环境变量后重启生效": t("config.envLocked", "该配置已被环境变量锁定，修改环境变量后重启生效"),
    };

    if (exact[str]) return exact[str];

    let m;
    if ((m = str.match(/^批量操作完成[：:]\s*成功处理\s*(\d+)\/(\d+)\s*个凭证/))) {
      return t("credentials.batchResult", "批量操作完成：成功处理 {success}/{total} 个凭证", { success: m[1], total: m[2] });
    }
    if ((m = str.match(/^已启用凭证\s*(.+)$/))) {
      return t("credentials.actionEnabled", "已启用凭证 {email}", { email: m[1] });
    }
    if ((m = str.match(/^已禁用凭证\s*(.+)$/))) {
      return t("credentials.actionDisabled", "已禁用凭证 {email}", { email: m[1] });
    }
    if ((m = str.match(/^已删除凭证\s*(.+)$/))) {
      return t("credentials.actionDeleted", "已删除凭证 {email}", { email: m[1] });
    }
    if ((m = str.match(/^成功刷新模型列表[（(]共\s*(\d+)\s*个模型[)）]/))) {
      return t("credentials.refreshModelsSuccess", "成功刷新模型列表（共 {count} 个模型）", { count: m[1] });
    }
    if ((m = str.match(/^已清理\s*(\d+)\s*天前的日志/))) {
      return t("usageLogs.clearedDaysSuccess", "已清理 {days} 天前的日志", { days: m[1] });
    }
    if ((m = str.match(/^批量导入完成[：:]\s*成功\s*(\d+)\/(\d+)\s*个凭证/))) {
      return t("upload.batchImportDone", "批量导入完成: 成功 {success}/{total} 个凭证", { success: m[1], total: m[2] });
    }
    if ((m = str.match(/^refresh_token\s*无效[：:]\s*(.*)$/))) {
      return t("upload.invalidRefreshToken", "refresh_token 无效: {detail}", { detail: m[1] });
    }
    if ((m = str.match(/^测试失败[：:]\s*HTTP\s*(\d+)/))) {
      return t("credentials.testFailedHttp", "测试失败: HTTP {status}", { status: m[1] });
    }
    if ((m = str.match(/^检验成功[：:]\s*(.+)$/))) {
      return `${t("credentials.verifySuccess", "检验成功")}: ${m[1]}`;
    }
    if ((m = str.match(/^检验失败[：:]\s*(.+)$/))) {
      return `${t("credentials.verifyFailed", "检验失败")}: ${m[1]}`;
    }
    if ((m = str.match(/^测试成功[：:]\s*(.+)$/))) {
      return `${t("credentials.testSuccess", "测试成功")}: ${m[1]}`;
    }
    if ((m = str.match(/^测试失败[：:]\s*(.+)$/))) {
      return `${t("credentials.testFailed", "测试失败")}: ${m[1]}`;
    }
    if (str.includes(": 删除失败")) {
      return str.replace(": 删除失败", `: ${t("common.deleteFailed", "删除失败")}`);
    }
    if (str.includes(": 刷新模型列表失败")) {
      return str.replace(": 刷新模型列表失败", `: ${t("credentials.refreshFailed", "刷新模型列表失败")}`);
    }
    if (str.includes("处理失败")) {
      return str.replace("处理失败", t("common.processFailed", "处理失败"));
    }

    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, translateMessage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

export function LanguageSwitch({ className = "" }) {
  const { lang, setLang } = useI18n();

  const toggle = () => {
    setLang(lang === "zh" ? "en" : "zh");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dark-600 bg-dark-800 text-gray-300 hover:text-white hover:border-dark-500 transition-colors ${className}`}
      title={lang === "zh" ? "Switch to English" : "切换为中文"}
    >
      <Globe size={14} className="text-purple-400" />
      <span>{lang === "zh" ? "中文" : "English"}</span>
    </button>
  );
}
