import Root from "./root.jsx";
import NotFound, { notFoundMetadata } from "./components/NotFound.jsx";

export const metadata = notFoundMetadata("en");
export { viewport } from "./root.jsx";

// Static export writes this as out/404.html. /th/ misses get out/th/404.html instead,
// because Cloudflare serves the nearest 404.html (see app/(th)/th/404 and the build script).
export default function GlobalNotFound() {
  return (
    <Root lang="en">
      <NotFound lang="en" />
    </Root>
  );
}
