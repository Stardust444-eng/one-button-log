import { ShareScreen } from "@/components/share-screen";

export const metadata = {
  title: "Share",
};

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShareScreen key={id} id={id} />;
}
