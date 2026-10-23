import { REPO_URL } from "../../lib/skills.mjs";

export default function Header() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/">
        <span className="wordmark-star" aria-hidden="true" />
        MRN Skills
      </a>
      <nav aria-label="เมนูหลัก">
        <a href="/#install">ติดตั้ง</a>
        <a href="/#skills">skill ทั้งหมด</a>
        <a href={REPO_URL}>GitHub</a>
      </nav>
    </header>
  );
}
