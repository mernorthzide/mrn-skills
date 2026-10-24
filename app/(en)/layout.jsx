import Root, { rootMetadata } from "../root.jsx";

export const metadata = rootMetadata("en");
export { viewport } from "../root.jsx";

export default function Layout({ children }) {
  return <Root lang="en">{children}</Root>;
}
