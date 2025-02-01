import { sql } from '@vercel/postgres'
import { verifySession } from '@/app/lib/helpers'

export async function GET() {
  try {
    const verification = await verifySession();
    const session = verification.session
    if (!session) return new Response('Unauthorized', { status: 401 })
    const mainPosts = (await sql`SELECT * FROM main_posts`).rows
    return new Response(JSON.stringify(mainPosts))

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
    const { name, description, fileName, link } = body
    if (!name) return new Response('Missing required fields', { status: 400 })
    await sql`INSERT INTO main_posts (name, description, fileName, link, userId) VALUES (${name}, ${description}, ${fileName}, ${link}, ${session.id});`
    return new Response('Main post created')
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
  
}