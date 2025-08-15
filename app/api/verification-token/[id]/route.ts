import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { jsonResponse } from '@/app/lib/helpers'

export async function DELETE(_: NextRequest, { params }: any) {
  try {
    await sql`DELETE FROM verification_tokens WHERE id = ${params.id}`
    return NextResponse.json({ data: 'Deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


export async function PATCH(request: Request, { params }: any) {
  const { id } = await params;

  if (!id) {
    return jsonResponse(
      {
        error: "Missing post ID in params",
        publicError: "ID no proporcionado",
        errorCode: "MISSING_PARAMS",
        details: [],
      },
      400
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON body",
        publicError: "Petición inválida",
        errorCode: "BAD_REQUEST",
        details: [],
      },
      400
    );
  }


  try {
    await sql`
    UPDATE verification_tokens SET used = true WHERE id = ${id};
  `;
    return jsonResponse({ data: { ok: true } }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message,
        publicError: "No se pudo actualizar la publicación",
        errorCode: "DB_VERIFICATION_TOKENS_PATCH_FAILED",
        details: { postId: id, attemptedFields: body },
      },
      500
    );
  }
}
