import { handle } from "@/lib/http";
import { addButton } from "@/lib/store";
import { cleanInterval, cleanText, readJson } from "@/lib/validate";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handle(async () => {
    const body = await readJson(request);
    const label = cleanText(body.label, "Name the button.", 40);
    const intervalHours = cleanInterval(body.intervalHours);
    return addButton(id, label, intervalHours);
  });
}
