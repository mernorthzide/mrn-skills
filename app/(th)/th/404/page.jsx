import NotFound, { notFoundMetadata } from "../../../components/NotFound.jsx";

// Exported to out/th/404/index.html, then moved to out/th/404.html by `npm run build`.
// noindex like the English global 404 (Next adds it there); /th/404 is a real file, so it is also served with 200.
export const metadata = { ...notFoundMetadata("th"), robots: { index: false } };

export default function Page() {
  return <NotFound lang="th" />;
}
