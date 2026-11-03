import { handle } from "@/lib/http";
import { createBoard } from "@/lib/store";
import { cleanText, readJson } from "@/lib/validate";

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readJson(request);
    const name = cleanText(body.name, "Give the board a name.", 40);
    const templateId = cleanText(body.templateId, "Pick a template.", 40);
    return createBoard(name, templateId);
  });
}
