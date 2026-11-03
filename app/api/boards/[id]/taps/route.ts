import { handle } from "@/lib/http";
import { logTap } from "@/lib/store";
import { cleanText, readJson } from "@/lib/validate";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const body = await readJson(request);
    const buttonId = cleanText(body.buttonId, "Pick a button.", 80);
    const by = cleanText(body.by, "Add your name.", 24);
    return logTap(id, buttonId, by);
  });
}
