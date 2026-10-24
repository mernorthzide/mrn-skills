import HomePage from "../../components/HomePage.jsx";
import { alternates } from "../../../lib/i18n.mjs";

export const metadata = { alternates: alternates("th", "/") };

export default function Page() {
  return <HomePage lang="th" />;
}
