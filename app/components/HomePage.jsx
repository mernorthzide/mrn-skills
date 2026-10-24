import { loadSkills, loadInstall, REPO_URL } from "../../lib/skills.mjs";
import { t } from "../../lib/i18n.mjs";
import Cosmos from "./Cosmos.jsx";
import CopyButton from "./CopyButton.jsx";
import SkillSearch from "./SkillSearch.jsx";
import { formatDate } from "../../lib/format.mjs";
import Header from "./Header.jsx";

export default function HomePage({ lang }) {
  const l = t[lang];
  const skills = loadSkills().map(({ html, files, ...s }) => s);
  const { prompt, commands } = loadInstall(lang);
  const latest = skills.map((s) => s.updated).filter(Boolean).sort().at(-1);

  return (
    <>
      <Cosmos names={skills.map((s) => s.name)} lang={lang} />
      <Header lang={lang} path="/" />
      <main>
        <section className="hero" data-stage>
          <h1>
            {l.heroTitle}
            <br />
            {l.heroFor}<span className="nowrap">Claude Code</span>
          </h1>
          <p className="lede">{l.heroLede}</p>
          <CopyButton text={prompt} lang={lang} className="copy--hero" />
          <p className="hero-meta">
            <a href="#install">{l.heroLink}</a>
            <span>
              {l.count(skills.length)}{latest && l.lastUpdated(formatDate(latest, lang))}
            </span>
          </p>
        </section>

        <section className="install" id="install" data-stage>
          <h2>{l.installTitle}</h2>
          <ol className="steps">
            <li>
              <h3>{l.step1}</h3>
              <p>{l.step1Body}</p>
            </li>
            <li>
              <h3>{l.step2}</h3>
              <p>{l.step2Body}</p>
            </li>
            <li>
              <h3>
                {l.step3}<code>/reload-plugins</code>
              </h3>
              <p>
                {l.step3Body}<code>/mrn:prove-it</code>
              </p>
            </li>
          </ol>

          <figure className="prompt">
            <figcaption>
              <span>{l.promptCaption}</span>
              <CopyButton text={prompt} lang={lang} label={l.copyShort} className="copy--compact" />
            </figcaption>
            <pre>{prompt}</pre>
          </figure>

          <p className="note">
            <strong>{l.noteTitle}</strong>{l.noteA}<code>Plugin updated</code>{l.noteB}<code>/reload-plugins</code>
          </p>

          <details className="terminal">
            <summary>{l.terminal}</summary>
            <pre>{commands.join("\n")}</pre>
            <p>{l.terminalBody}<code>/plugin</code> → Marketplaces → <code>mrn-skills</code> → Enable auto-update</p>
          </details>
        </section>

        <section className="catalog" id="skills" data-stage>
          <h2>{l.catalogTitle}</h2>
          <SkillSearch skills={skills} lang={lang} />
        </section>

        <section className="close" data-stage>
          <h2>{l.closeTitle}</h2>
          <p>{l.closeBody}</p>
          <CopyButton text={prompt} lang={lang} />
          <p className="close-links">
            <a href={REPO_URL}>{l.source}</a>
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <span>MRN Skills</span>
        <a href={REPO_URL}>github.com/mernorthzide/mrn-skills</a>
      </footer>
    </>
  );
}
