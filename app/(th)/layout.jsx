import Root, { rootMetadata } from "../root.jsx";

export const metadata = rootMetadata("th");
export { viewport } from "../root.jsx";

export default function Layout({ children }) {
  return <Root lang="th">{children}</Root>;
}
