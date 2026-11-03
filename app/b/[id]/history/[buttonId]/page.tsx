import { HistoryScreen } from "@/components/history-screen";

export const metadata = {
  title: "History",
};

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string; buttonId: string }>;
}) {
  const { id, buttonId } = await params;
  return <HistoryScreen key={`${id}:${buttonId}`} id={id} buttonId={buttonId} />;
}
