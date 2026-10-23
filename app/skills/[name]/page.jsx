import { loadSkills, loadInstall, REPO_URL } from "../../../lib/skills.mjs";
import Cosmos from "../../components/Cosmos.jsx";
import CopyButton from "../../components/CopyButton.jsx";
import Header from "../../components/Header.jsx";
import { formatDate } from "../../../lib/format.mjs";

export const dynamicParams = false;
export const generateStaticParams = () => loadSkills().map((s) => ({ name: s.name }));

export async function generateMetadata({ params }) {
  const { name } = await params;
  const s = loadSkills().find((x) => x.name === name);
  return { title: `/mrn:${name} · MRN Skills`, description: s.summary || s.description };
}

export default async function SkillPage({ params }) {
  const { name } = await params;
  const all = loadSkills();
  const s = all.find((x) => x.name === name);
  const { prompt } = loadInstall();
  const tree = `${REPO_URL}/blob/main/plugins/mrn/skills/${s.name}`;

  return (
    <>
      <Cosmos skills={all.map(({ html, ...x }) => x)} variant="planet" focus={s.name} />
      <Header />
      <main className="detail">
        <nav className="crumbs" aria-label="ตำแหน่งหน้า">
          <a href="/#skills">skill ทั้งหมด</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{s.name}</span>
        </nav>
        <header className="detail-head">
          <h1>{s.name}</h1>
          <p className="invoke">
            <code>
              {`/mrn:${s.name}`}
              {s.argumentHint && <span className="hint"> {s.argumentHint}</span>}
            </code>
          </p>
          {s.summary && <p className="lede">{s.summary}</p>}
        </header>

        <div className="detail-grid">
          <article className="prose" dangerouslySetInnerHTML={{ __html: s.html }} />
          <aside className="facts">
            <section className="facts-install">
              <h2>ยังไม่ได้ติดตั้ง</h2>
              <p>prompt เดียวติดตั้งทุก skill รวมถึงตัวนี้</p>
              <CopyButton text={prompt} className="copy--compact" />
            </section>
            <dl>
              <dt>Claude จะเรียกใช้เมื่อ</dt>
              <dd lang="en">{s.description}</dd>
              <dt>ไฟล์ใน skill</dt>
              <dd>
                <ul className="files">
                  {s.files.map((f) => (
                    <li key={f}>
                      <a href={`${tree}/${f}`}>{f}</a>
                    </li>
                  ))}
                </ul>
              </dd>
              {s.added && (
                <>
                  <dt>เพิ่มเมื่อ</dt>
                  <dd>{formatDate(s.added)}</dd>
                </>
              )}
              {s.updated && (
                <>
                  <dt>อัปเดตล่าสุด</dt>
                  <dd>{formatDate(s.updated)}</dd>
                </>
              )}
            </dl>
            <a className="btn-ghost" href={`${REPO_URL}/tree/main/plugins/mrn/skills/${s.name}`}>ดูบน GitHub</a>
          </aside>
        </div>
      </main>
      <footer className="site-footer">
        <a href="/#skills">← skill ทั้งหมด</a>
        <a href={REPO_URL}>github.com/mernorthzide/mrn-skills</a>
      </footer>
    </>
  );
}
