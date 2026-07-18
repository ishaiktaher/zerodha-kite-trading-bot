import { requireSession } from "@/lib/auth";
import { deleteFilter, saveFilter } from "@/lib/filter-store";
import { apiError } from "@/lib/kite";

export async function PUT(request, { params }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    return Response.json(await saveFilter(session.userId, { ...(await request.json()), id }));
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const deleted = await deleteFilter(session.userId, id);
    return deleted ? new Response(null, { status: 204 }) : Response.json({ error: "Filter not found" }, { status: 404 });
  } catch (error) { return apiError(error); }
}

