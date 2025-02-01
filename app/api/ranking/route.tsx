import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET() {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const subjects = (await sql`SELECT * FROM subjects WHERE score IS NOT NULL;`).rows
    return new Response(JSON.stringify(subjects))
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}