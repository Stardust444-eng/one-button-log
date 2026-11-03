import { handle } from "@/lib/http";
import { readBoard } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(() => readBoard(id));
}
