"use client";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "../../lib/format.mjs";
import { t, href } from "../../lib/i18n.mjs";

const focusPlanet = (name) => dispatchEvent(new CustomEvent("mrn:focus", { detail: name }));

// Filters by name/description/summary, every word must match; Thai has no case, so lower-casing is enough. "/" jumps to the search box.
export default function SkillSearch({ skills, lang }) {
  const l = t[lang];
  const [q, setQ] = useState("");
  const input = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const query = q.trim().toLocaleLowerCase("th");
  const words = query.split(/\s+/).filter(Boolean);
  const shown = skills.filter((s) => {
    const text = `${s.name} ${s.description} ${s.summary}`.toLocaleLowerCase("th");
    return words.every((w) => text.includes(w));
  });

  return (
    <div className="skills">
      <div className="search">
        <label htmlFor="skill-search">{l.searchLabel}</label>
        <div className="search-box">
          <input ref={input} id="skill-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={l.searchPlaceholder} autoComplete="off" />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <p className="search-count" role="status" aria-live="polite">
          {query ? l.found(shown.length, skills.length) : l.all(skills.length)}
        </p>
      </div>

      {shown.length ? (
        <ol className="skill-list">
          {shown.map((s) => (
            <li key={s.name}>
              <a className="skill-row" href={href(lang, `/skills/${s.name}/`)} onMouseEnter={() => focusPlanet(s.name)} onMouseLeave={() => focusPlanet(null)} onFocus={() => focusPlanet(s.name)} onBlur={() => focusPlanet(null)}>
                <span className="skill-name">{s.name}</span>
                <code className="skill-cmd">{`/mrn:${s.name}`}</code>
                <span className="skill-summary">{(lang === "th" && s.summary) || s.summaryEn}</span>
                {s.updated && <span className="skill-date">{l.updated}{formatDate(s.updated, lang)}</span>}
                <span className="skill-go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty">
          <p>{l.empty(q.trim())}</p>
          <button type="button" className="btn-ghost" onClick={() => (setQ(""), input.current?.focus())}>{l.clear}</button>
        </div>
      )}
      <p className="skill-next">
        <span className="dot" aria-hidden="true" />
        {l.nextSkill}
      </p>
    </div>
  );
}
