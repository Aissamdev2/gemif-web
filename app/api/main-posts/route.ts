import { sql } from '@vercel/postgres'

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const mainPosts = (await sql`SELECT * FROM main_posts`).rows
    return new Response(JSON.stringify(mainPosts))

  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    const body = await request.json()
    if (!body)return new Response('Invalid request body', { status: 400 })
    const { name, description, fileName, link } = body
    if (!name) return new Response('Missing required fields', { status: 400 })
    await sql`INSERT INTO main_posts (name, description, fileName, link, userId) VALUES (${name}, ${description}, ${fileName}, ${link}, ${userId});`
    return new Response('Main post created')
  } catch (error) {
    console.log(error)
    return new Response('Unauthorized', { status: 401 })
  }
  
}