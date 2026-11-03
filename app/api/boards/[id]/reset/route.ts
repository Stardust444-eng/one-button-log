import { handle } from "@/lib/http";
import { resetDemo } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(() => resetDemo(id));
}
