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

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
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
