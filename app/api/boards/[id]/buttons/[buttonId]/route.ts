import { handle } from "@/lib/http";
import { removeButton, updateButton } from "@/lib/store";
import { cleanInterval, cleanText, readJson } from "@/lib/validate";

type Context = { params: Promise<{ id: string; buttonId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id, buttonId } = await params;
  return handle(async () => {
    const body = await readJson(request);
    const label = cleanText(body.label, "Name the button.", 40);
    const intervalHours = cleanInterval(body.intervalHours);
    return updateButton(id, buttonId, label, intervalHours);
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id, buttonId } = await params;
  return handle(() => removeButton(id, buttonId));
}
