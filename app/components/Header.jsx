import { REPO_URL } from "../../lib/skills.mjs";
import { t, href } from "../../lib/i18n.mjs";
import LangSwitch from "./LangSwitch.jsx";

// `path` is the current page without the /th prefix, so the language switch lands on the same page.
export default function Header({ lang, path }) {
  const l = t[lang];
  const other = lang === "th" ? "en" : "th";
  return (
    <header className="site-header">
      <a className="wordmark" href={href(lang, "/")}>
        <span className="wordmark-star" aria-hidden="true" />
        MRN Skills
      </a>
      <nav aria-label={l.nav}>
        <a href={href(lang, "/#install")}>{l.navInstall}</a>
        <a href={href(lang, "/#skills")}>{l.navSkills}</a>
        <a href={REPO_URL}>GitHub</a>
        <LangSwitch href={href(other, path)} lang={other}>{t[other].langName}</LangSwitch>
      </nav>
    </header>
  );
}
