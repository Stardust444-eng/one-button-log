import { BoardScreen } from "@/components/board-screen";

export const metadata = {
  title: "Board",
};

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoardScreen key={id} id={id} />;
}
