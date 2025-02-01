import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET() {

  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const primitive_subjects = (await sql`SELECT * FROM primitive_subjects`).rows
    console.log(primitive_subjects.length)
    return new Response(JSON.stringify(primitive_subjects))
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}