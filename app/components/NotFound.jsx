import { t, href } from "../../lib/i18n.mjs";
import Header from "./Header.jsx";

export const notFoundMetadata = (lang) => ({ title: `${t[lang].lostTitle} · MRN Skills` });

// Carries a line in the other language too, for readers who landed on the wrong side.
export default function NotFound({ lang }) {
  const l = t[lang], other = t[lang === "th" ? "en" : "th"];
  return (
    <>
      <Header lang={lang} path="/" />
      <main className="lost">
        <h1>{l.lostTitle}</h1>
        <p>{l.lostBody}</p>
        <p lang={lang === "th" ? "en" : "th"}>{other.lostTitle}{lang === "th" ? ". " : " "}{other.lostBody}</p>
        <a className="btn-ghost" href={href(lang, "/#skills")}>{l.lostBack}</a>
      </main>
    </>
  );
}
