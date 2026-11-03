import { handle } from "@/lib/http";
import { removeTap, updateTap } from "@/lib/store";
import { cleanText, cleanWhen, readJson } from "@/lib/validate";

type Context = { params: Promise<{ id: string; tapId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { id, tapId } = await params;
  return handle(async () => {
    const body = await readJson(request);
    const by = cleanText(body.by, "Add a name for this tap.", 24);
    const at = cleanWhen(body.at);
    return updateTap(id, tapId, by, at);
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id, tapId } = await params;
  return handle(() => removeTap(id, tapId));
}
