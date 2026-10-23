import { loadSkills, loadInstall, REPO_URL } from "../lib/skills.mjs";
import Cosmos from "./components/Cosmos.jsx";
import CopyButton from "./components/CopyButton.jsx";
import SkillSearch from "./components/SkillSearch.jsx";
import { formatDate } from "../lib/format.mjs";
import Header from "./components/Header.jsx";

export default function Home() {
  const skills = loadSkills().map(({ html, ...s }) => s);
  const { prompt, commands } = loadInstall();
  const latest = skills.map((s) => s.updated).filter(Boolean).sort().at(-1);

  return (
    <>
      <Cosmos skills={skills} />
      <Header />
      <main>
        <section className="hero" data-stage>
          <h1>
            skill ของทีม
            <br />
            สำหรับ <span className="nowrap">Claude Code</span>
          </h1>
          <p className="lede">คัดลอก prompt ไปวางใน Claude Code ครั้งเดียว Claude จะติดตั้งให้ครบ แล้ว skill ใหม่กับเวอร์ชันที่แก้แล้วจะตามมาเอง</p>
          <CopyButton text={prompt} className="copy--hero" />
          <p className="hero-meta">
            <a href="#install">ดูก่อนว่า prompt เขียนว่าอะไร</a>
            <span>
              {skills.length} skill{latest && ` · อัปเดตล่าสุด ${formatDate(latest)}`}
            </span>
          </p>
        </section>

        <section className="install" id="install" data-stage>
          <h2>ติดตั้งครั้งเดียว ใช้ได้ทุก skill</h2>
          <ol className="steps">
            <li>
              <h3>คัดลอก prompt</h3>
              <p>กดปุ่มคัดลอก ข้อความทั้งหมดด้านล่างจะอยู่ในคลิปบอร์ด</p>
            </li>
            <li>
              <h3>วางใน Claude Code แล้วกด Enter</h3>
              <p>Claude จะรันคำสั่งติดตั้ง เปิด auto-update และตรวจผลให้เอง</p>
            </li>
            <li>
              <h3>
                พิมพ์ <code>/reload-plugins</code>
              </h3>
              <p>
                แล้วเรียกใช้ได้เลย เช่น <code>{`/mrn:${skills[0]?.name ?? "prove-it"}`}</code>
              </p>
            </li>
          </ol>

          <figure className="prompt">
            <figcaption>
              <span>prompt ที่จะคัดลอก</span>
              <CopyButton text={prompt} label="คัดลอก" className="copy--compact" />
            </figcaption>
            <pre>{prompt}</pre>
          </figure>

          <p className="note">
            <strong>อัปเดตเอง</strong> Claude Code เช็ก skill ใหม่ให้หลังเริ่มคุยในแต่ละ session ถ้าเห็นข้อความ <code>Plugin updated</code> ให้พิมพ์ <code>/reload-plugins</code>
          </p>

          <details className="terminal">
            <summary>ติดตั้งเองผ่าน terminal</summary>
            <pre>{commands.join("\n")}</pre>
            <p>สองคำสั่งนี้ติดตั้ง plugin อย่างเดียว ถ้าจะให้อัปเดตเอง ให้เปิดที่ <code>/plugin</code> → Marketplaces → <code>mrn-skills</code> → Enable auto-update</p>
          </details>
        </section>

        <section className="catalog" id="skills" data-stage>
          <h2>skill ทั้งหมด</h2>
          <SkillSearch skills={skills} />
        </section>

        <section className="close" data-stage>
          <h2>พร้อมแล้ว คัดลอกไปวางได้เลย</h2>
          <p>ติดตั้งครั้งเดียว ทุก skill ที่ทีมเพิ่มหลังจากนี้จะตามไปถึงเครื่องคุณเอง</p>
          <CopyButton text={prompt} />
          <p className="close-links">
            <a href={REPO_URL}>ดู source บน GitHub</a>
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
