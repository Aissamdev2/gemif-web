import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET() {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const { id: userId } = session
    const subjects = (await sql`SELECT * FROM subjects WHERE userId = ${userId};`).rows
    return new Response(JSON.stringify(subjects))

  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const body = await request.json()
    if (!body)return new Response('Invalid request body', { status: 400 })
    const { name, color, bgcolor, bordercolor, primitiveid, year, quadri, archived, score } = body
    if (!name) return new Response('Missing required fields', { status: 400 })
    await sql`INSERT INTO subjects (name, color, bgColor, borderColor, year, quadri, primitiveid, archived, score, userId) VALUES (${name}, ${color}, ${bgcolor}, ${bordercolor}, ${year}, ${quadri}, ${primitiveid}, ${archived}, ${score}, ${session.id})`
    return new Response('Subject created')
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}