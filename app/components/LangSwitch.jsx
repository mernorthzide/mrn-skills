"use client";
import { useEffect, useRef } from "react";

// The href is fixed at build time; keep the current #section on it so the reader stays where they were,
// whether they click, middle-click or open it from the context menu.
export default function LangSwitch({ href, lang, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const sync = () => ref.current.setAttribute("href", href + location.hash);
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, [href]);
  return (
    <a ref={ref} className="lang-switch" href={href} lang={lang} hrefLang={lang}>
      {children}
    </a>
  );
}
