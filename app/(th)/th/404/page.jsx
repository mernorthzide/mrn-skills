import NotFound, { notFoundMetadata } from "../../../components/NotFound.jsx";

// Exported to out/th/404/index.html, then moved to out/th/404.html by `npm run build`.
export const metadata = notFoundMetadata("th");

export default function Page() {
  return <NotFound lang="th" />;
}
