export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "cache-control": "no-store" } },
    );
  }
  console.error(error);
  return Response.json(
    { error: "Something went wrong on the board." },
    { status: 500, headers: { "cache-control": "no-store" } },
  );
}

export async function handle(fn: () => unknown | Promise<unknown>): Promise<Response> {
  try {
    const data = await fn();
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
