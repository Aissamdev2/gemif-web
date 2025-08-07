import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { jsonResponse } from '@/app/lib/helpers'

export async function POST(req: NextRequest) {
  const { userId, token, expiresAt, type } = await req.json()

  try {
    await sql`
      INSERT INTO verification_tokens (userid, token, expiresat, type)
      VALUES (${userId}, ${token}, ${expiresAt}, ${type})
    `
    return jsonResponse({ data: { ok: true }, error: null, publicError: null, errorCode: null, details: [] }, 200)
  } catch (error: any) {
    return jsonResponse({ data: null, error: error.message, publicError: 'Error de comunicación externa', errorCode: 'UNKNOWN_ERROR', details: [] }, 500)
  }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')

  try {
    const { rows } = await sql`
      SELECT id, token, userid, expiresat FROM verification_tokens
      WHERE type = ${type} AND expiresat > NOW()
    `
    return NextResponse.json({ data: rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
