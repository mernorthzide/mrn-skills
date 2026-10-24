import { loadSkills, loadInstall, REPO_URL } from "../../lib/skills.mjs";
import { t, href, alternates } from "../../lib/i18n.mjs";
import Cosmos from "./Cosmos.jsx";
import CopyButton from "./CopyButton.jsx";
import Header from "./Header.jsx";
import { formatDate } from "../../lib/format.mjs";

export const staticParams = () => loadSkills().map((s) => ({ name: s.name }));

export function skillMetadata(lang, name) {
  const s = loadSkills().find((x) => x.name === name);
  return {
    title: `/mrn:${name} · MRN Skills`,
    description: (lang === "th" && s.summary) || s.summaryEn,
    alternates: alternates(lang, `/skills/${name}/`),
  };
}

export default function SkillPage({ lang, name }) {
  const l = t[lang];
  const all = loadSkills();
  const s = all.find((x) => x.name === name);
  const { prompt } = loadInstall(lang);
  const summary = lang === "th" ? s.summary : s.summaryEn;

  return (
    <>
      <Cosmos names={all.map((x) => x.name)} variant="planet" focus={s.name} lang={lang} />
      <Header lang={lang} path={`/skills/${s.name}/`} />
      <main className="detail">
        <nav className="crumbs" aria-label={l.crumbs}>
          <a href={href(lang, "/#skills")}>{l.navSkills}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{s.name}</span>
        </nav>
        <header className="detail-head">
          <h1>{s.name}</h1>
          <p className="invoke">
            <code>
              {`/mrn:${s.name}`}
              {s.argumentHint && <span className="hint" lang={/[\u0E00-\u0E7F]/.test(s.argumentHint) ? "th" : "en"}> {s.argumentHint}</span>}
            </code>
          </p>
          {summary && <p className="lede">{summary}</p>}
          {l.thaiBody && <p className="lang-note">{l.thaiBody}</p>}
        </header>

        <div className="detail-grid">
          <article className="prose" lang="th" dangerouslySetInnerHTML={{ __html: s.html }} />
          <aside className="facts">
            <section className="facts-install">
              <h2>{l.notInstalled}</h2>
              <p>{l.notInstalledBody}</p>
              <CopyButton text={prompt} lang={lang} className="copy--compact" />
            </section>
            <dl>
              {s.useWhen && (
                <>
                  <dt>{l.whenUsed}</dt>
                  <dd lang="en">{s.useWhen}</dd>
                </>
              )}
              <dt>{l.files}</dt>
              <dd>
                <ul className="files">
                  {s.files.map((f) => (
                    <li key={f.path}>
                      <a href={f.url}>{f.path}</a>
                    </li>
                  ))}
                </ul>
              </dd>
              {s.added && (
                <>
                  <dt>{l.added}</dt>
                  <dd>{formatDate(s.added, lang)}</dd>
                </>
              )}
              {s.updated && (
                <>
                  <dt>{l.lastUpdate}</dt>
                  <dd>{formatDate(s.updated, lang)}</dd>
                </>
              )}
            </dl>
            <a className="btn-ghost" href={s.sourceUrl}>{l.onGitHub}</a>
          </aside>
        </div>
      </main>
      <footer className="site-footer">
        <a href={href(lang, "/#skills")}>{l.back}</a>
        <a href={REPO_URL}>github.com/mernorthzide/mrn-skills</a>
      </footer>
    </>
  );
}
