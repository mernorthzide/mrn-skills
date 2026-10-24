import SkillPage, { staticParams, skillMetadata } from "../../../../components/SkillPage.jsx";

export const dynamicParams = false;
export const generateStaticParams = staticParams;
export const generateMetadata = async ({ params }) => skillMetadata("th", (await params).name);
export default async function Page({ params }) {
  return <SkillPage lang="th" name={(await params).name} />;
}
