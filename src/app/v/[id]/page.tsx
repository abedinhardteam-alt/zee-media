import { Feed } from "@/components/feed";

export default async function Page({ params }: PageProps<"/v/[id]">) {
  const { id } = await params;
  return <Feed initialId={id} />;
}
